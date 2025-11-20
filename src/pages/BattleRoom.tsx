// src/pages/BattleRoom.tsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";

import { supabase } from "../lib/supabaseClient";
import { PROBLEMS } from "../data/problems";
import {
  evaluateSolution,
  checkMatchCompletion,
  finishMatch,
} from "../services/scoringService";

type Testcase = { input: string; expected: string };

export default function BattleRoom() {
  const { id: matchId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // UI state
  const [loading, setLoading] = useState(true);
  const [problemTitle, setProblemTitle] = useState("Loading...");
  const [problemDescription, setProblemDescription] = useState("");
  const [examples, setExamples] = useState<{ input: string; output: string }[]>(
    []
  );
  const [rawTestcases, setRawTestcases] = useState<Testcase[]>([]);

  const [code, setCode] = useState("// Write your solution here");
  const [language, setLanguage] = useState<
    "javascript" | "python" | "cpp" | "java"
  >("javascript");

  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // player info
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isPlayer1, setIsPlayer1] = useState<boolean | null>(null);
  const autoSubmittedRef = useRef(false);

  // Keep a ref to subscription so we can unsubscribe on unmount
  const subscriptionRef = useRef<any>(null);

  // Load current user id & match -> problem
  useEffect(() => {
    async function init() {
      if (!matchId) return;

      // current user
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        console.error("No auth user:", userErr);
        // optionally redirect to login
        return;
      }
      setCurrentUserId(user.id);

      // load match (we need difficulty, problem_id, player1, player2, status, scores)
      const { data: matchRow, error: matchErr } = await supabase
        .from("matches")
        .select("difficulty, problem_id, player1, player2, status, player1_score, player2_score")
        .eq("id", matchId)
        .single();

      if (matchErr || !matchRow) {
        console.error("Failed to load match:", matchErr);
        setLoading(false);
        return;
      }

      // decide player side
      setIsPlayer1(matchRow.player1 === user.id);

      // find problem from local bank
      const difficulty = matchRow.difficulty as
        | "Beginner"
        | "Intermediate"
        | "Advanced";
      const pid = matchRow.problem_id as string;
      const bucket = PROBLEMS[difficulty] || [];
      const pb = bucket.find((p) => p.id === pid);

      if (!pb) {
        console.error("Problem not found for id:", pid, "difficulty:", difficulty);
        setLoading(false);
        return;
      }

      setProblemTitle(pb.title);
      setProblemDescription(pb.description);
      setExamples(pb.testcases.map((t) => ({ input: t.input, output: t.expected })));
      setRawTestcases(pb.testcases);

      // if match already finished, redirect to result page
      if (matchRow.status === "finished") {
        navigate(`/result/${matchId}`);
        return;
      }

      // if both scores already present, finish match and redirect
      if (matchRow.player1_score != null && matchRow.player2_score != null) {
        // optionally ensure status is finished
        await supabase
          .from("matches")
          .update({ status: "finished" })
          .eq("id", matchId);
        navigate(`/result/${matchId}`);
        return;
      }

      setLoading(false);

      // subscribe to realtime updates for this match row
      try {
  const chan = supabase.channel(`public:matches:id=eq.${matchId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "matches", filter: `id=eq.${matchId}` },
      (payload: any) => {
        const rec = payload?.record as any;
        if (!rec) return;

        if (rec.status === "finished") {
          navigate(`/result/${matchId}`);
        }

        if (rec.player1_score != null && rec.player2_score != null) {
  (async () => {
    try {
      await supabase
        .from("matches")
        .update({ status: "finished" })
        .eq("id", matchId);

      navigate(`/result/${matchId}`);
    } catch (err: any) {
      console.error("Error finishing match:", err);
      navigate(`/result/${matchId}`); // still redirect
    }
  });
        }
      }
    )
    .subscribe();

        subscriptionRef.current = chan;
      } catch (subErr) {
        console.error("Realtime subscription failed:", subErr);
      }
    }

    init();

    return () => {
      if (subscriptionRef.current) {
        try {
          supabase.removeChannel(subscriptionRef.current);
        } catch (e) {
          // ignore
        }
        subscriptionRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // Timer
  useEffect(() => {
    if (loading) return;

    if (timeLeft <= 0) {
      // auto-submit if not yet submitted
      if (!submitted && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        handleSubmit(true).catch((e) => console.error(e));
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0) {
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, timeLeft, submitted]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Submit handler (single submission)
  async function handleSubmit(auto = false) {
    if (submitted) return;
    if (!matchId) return;
    if (!currentUserId) {
      alert("Not authenticated.");
      return;
    }

    setSubmitting(true);

    try {
      setSubmitted(true);

      // Determine which score field to update
      const playerField: "player1_score" | "player2_score" = isPlayer1
        ? "player1_score"
        : "player2_score";

      // Evaluate solution (runs Judge0 per testcase and saves score)
      const playerScore = await evaluateSolution(
        matchId,
        code,
        language,
        rawTestcases,
        playerField
      );

      console.log("Player score:", playerScore);

      // mark status as submitted for this player (optional)
      await supabase
        .from("matches")
        .update({
          status: isPlayer1 ? "submitted_p1" : "submitted_p2",
        })
        .eq("id", matchId);

      // check whether both players have now submitted / scores present
      const winnerOrNull = await checkMatchCompletion(matchId);

      if (winnerOrNull !== null) {
        // finish match and redirect
        await finishMatch(matchId, winnerOrNull as string | "draw");
        navigate(`/result/${matchId}`);
        return;
      }

      alert(
        auto
          ? `Auto-submitted. Your score: ${playerScore}/${rawTestcases.length}`
          : `Submitted. Your score: ${playerScore}/${rawTestcases.length}. Waiting for opponent...`
      );
    } catch (err: any) {
      console.error("Submit error:", err);
      alert(err?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Loading match...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Coding Battle</h1>
          <div className="text-sm text-gray-400">Match ID: {matchId}</div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-300">Language</div>
          <select
            className="bg-gray-700 text-white p-2 rounded"
            value={language}
            onChange={(e) =>
              setLanguage(e.target.value as "javascript" | "python" | "cpp" | "java")
            }
            disabled={submitted} // lock language after submit
          >
            <option value="javascript">JavaScript (Node)</option>
            <option value="python">Python 3</option>
            <option value="cpp">C++ (GCC)</option>
            <option value="java">Java</option>
          </select>

          <div className="text-2xl font-bold text-green-400">{formatTime(timeLeft)}</div>
        </div>
      </div>

      {/* Main split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Problem panel */}
        <div className="w-1/2 p-6 overflow-y-auto bg-[#0b0b0b] border-r border-gray-700">
          <h2 className="text-3xl font-bold mb-4">{problemTitle}</h2>
          <p className="text-gray-300 mb-6 whitespace-pre-line">{problemDescription}</p>

          <h3 className="text-xl font-semibold mb-2">Examples</h3>
          {examples.map((ex, i) => (
            <div key={i} className="mb-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-300"><strong>Input:</strong> {ex.input}</p>
              <p className="text-sm text-gray-300"><strong>Output:</strong> {ex.output}</p>
            </div>
          ))}
        </div>

        {/* Editor panel */}
        <div className="w-1/2 flex flex-col">
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              language={language === "cpp" ? "cpp" : language}
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                automaticLayout: true,
              }}
            />
          </div>

          <div className="p-4 bg-gray-800 border-t border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {submitted ? "Submitted — waiting for result" : "You can submit once"}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitted || submitting}
                className={`px-6 py-3 text-lg font-bold rounded ${
                  submitted || submitting
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {submitting ? "Submitting..." : submitted ? "Submitted" : "Submit Solution"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
