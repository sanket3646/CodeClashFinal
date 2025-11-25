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

  const STARTER_CODE: Record<string, string> = {
    javascript: `const fs = require("fs");
const input = fs.readFileSync(0, "utf8").trim().split(" ");

const a = Number(input[0]);
const b = Number(input[1]);

// Write your answer:
`,
    python: `a, b = map(int, input().split())

# Write your answer:
`,
    cpp: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;

    // Write your answer:

    return 0;
}
`,
    java: `import java.util.*;
class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    int a = sc.nextInt();
    int b = sc.nextInt();

    // Write your answer:
  }
}
`,
  };

  const [language, setLanguage] = useState<
    "javascript" | "python" | "cpp" | "java"
  >("javascript");
  const [code, setCode] = useState(STARTER_CODE["javascript"]);

  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isPlayer1, setIsPlayer1] = useState<boolean | null>(null);
  const autoSubmittedRef = useRef(false);

  const subscriptionRef = useRef<any>(null);

  // Load match and user
  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!matchId) return;

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        console.error("No auth user:", userErr);
        return;
      }

      if (!mounted) return;
      setCurrentUserId(user.id);

      const { data: matchRow, error: matchErr } = await supabase
        .from("matches")
        .select(
          "difficulty, problem_id, player1, player2, status, player1_score, player2_score"
        )
        .eq("id", matchId)
        .single();

      if (matchErr || !matchRow) {
        console.error("Failed to load match:", matchErr);
        if (!mounted) return;
        setLoading(false);
        return;
      }

      setIsPlayer1(matchRow.player1 === user.id);

      const difficulty = matchRow.difficulty as
        | "Beginner"
        | "Intermediate"
        | "Advanced";
      const pid = matchRow.problem_id as string;

      const bucket = PROBLEMS[difficulty] || [];
      const pb = bucket.find((p) => p.id === pid);

      if (!pb) {
        console.error("Problem not found:", pid, difficulty);
        if (!mounted) return;
        setLoading(false);
        return;
      }

      setProblemTitle(pb.title);
      setProblemDescription(pb.description);
      setExamples(
        pb.testcases.map((t) => ({ input: t.input, output: t.expected }))
      );
      setRawTestcases(pb.testcases);

      if (matchRow.status === "finished") {
        navigate(`/result/${matchId}`);
        return;
      }

      if (matchRow.player1_score != null && matchRow.player2_score != null) {
        try {
          await supabase
            .from("matches")
            .update({ status: "finished" })
            .eq("id", matchId);
        } catch {}
        navigate(`/result/${matchId}`);
        return;
      }

      setLoading(false);

      // Realtime — FIXED (winner logic removed)
      try {
        const chan = supabase
          .channel(`public:matches:id=eq.${matchId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "matches",
              filter: `id=eq.${matchId}`,
            },
            (payload: any) => {
              const rec = payload?.new;
              if (!rec) return;

              // ❗ ONLY redirect if finished
              if (rec.status === "finished") {
                navigate(`/result/${matchId}`);
              }
            }
          )
          .subscribe();

        subscriptionRef.current = chan;
      } catch (err) {
        console.error("Realtime subscription failed:", err);
      }
    }

    init();

    return () => {
      mounted = false;
      if (subscriptionRef.current) {
        try {
          supabase.removeChannel(subscriptionRef.current);
        } catch {}
        subscriptionRef.current = null;
      }
    };
  }, [matchId, navigate]);

  // Timer
  useEffect(() => {
    if (loading) return;

    if (timeLeft <= 0) {
      if (!submitted && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        handleSubmit(true).catch(console.error);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => (t <= 0 ? 0 : t - 1));
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

  // Submit
  async function handleSubmit(auto = false) {
    if (submitted) return;
    if (!matchId) return;
    if (!currentUserId) return alert("Not authenticated.");

    setSubmitting(true);

    try {
      setSubmitted(true);

      const playerField: "player1_score" | "player2_score" = isPlayer1
        ? "player1_score"
        : "player2_score";

      const playerScore = await evaluateSolution(
        matchId,
        code,
        language,
        rawTestcases,
        playerField
      );

      await supabase
        .from("matches")
        .update({
          status: isPlayer1 ? "submitted_p1" : "submitted_p2",
        })
        .eq("id", matchId);

      const winnerOrNull = await checkMatchCompletion(matchId);

      if (winnerOrNull !== null) {
        await finishMatch(matchId, winnerOrNull);
        navigate(`/result/${matchId}`);
        return;
      }

      alert(
        auto
          ? `Auto-submitted. Score: ${playerScore}/${rawTestcases.length}`
          : `Submitted! Score: ${playerScore}/${rawTestcases.length}. Waiting for opponent...`
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
            onChange={(e) => {
              const lang = e.target.value as
                | "javascript"
                | "python"
                | "cpp"
                | "java";
              setLanguage(lang);
              setCode(STARTER_CODE[lang]);
            }}
            disabled={submitted}
          >
            <option value="javascript">JavaScript (Node)</option>
            <option value="python">Python 3</option>
            <option value="cpp">C++ (GCC)</option>
            <option value="java">Java</option>
          </select>

          <div className="text-2xl font-bold text-green-400">
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Problem */}
        <div className="w-1/2 p-6 overflow-y-auto bg-[#0b0b0b] border-r border-gray-700">
          <h2 className="text-3xl font-bold mb-4">{problemTitle}</h2>
          <p className="text-gray-300 mb-6 whitespace-pre-line">
            {problemDescription}
          </p>

          <h3 className="text-xl font-semibold mb-2">Examples</h3>
          {examples.map((ex, i) => (
            <div
              key={i}
              className="mb-3 p-3 bg-gray-800 rounded-lg border border-gray-700"
            >
              <p className="text-sm text-gray-300">
                <strong>Input:</strong> {ex.input}
              </p>
              <p className="text-sm text-gray-300">
                <strong>Output:</strong> {ex.output}
              </p>
            </div>
          ))}
        </div>

        {/* Editor */}
        <div className="w-1/2 flex flex-col">
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              language={language === "cpp" ? "cpp" : language}
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v || "")}
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
  );
}
