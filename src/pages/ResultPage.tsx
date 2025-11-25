// src/pages/ResultPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { PROBLEMS } from "../data/problems";

export default function ResultPage() {
  const { id: matchId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<any>(null);
  const [problem, setProblem] = useState<any>(null);

  const [player1Email, setPlayer1Email] = useState("Player 1");
  const [player2Email, setPlayer2Email] = useState("Player 2");
  const [winnerEmail, setWinnerEmail] = useState("");

  const [p1RatingChange, setP1RatingChange] = useState(0);
  const [p2RatingChange, setP2RatingChange] = useState(0);

  useEffect(() => {
    async function load() {
      if (!matchId) return;
      setLoading(true);

      // 1️⃣ Fetch match
      const { data: matchData, error: matchErr } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (matchErr || !matchData) {
        console.error("Failed to load match:", matchErr);
        setLoading(false);
        return;
      }

      setMatch(matchData);

      // helper to get email
      async function getEmail(uid: string) {
        if (!uid) return "";
        const { data } = await supabase.auth.getUser(uid);
        return data?.user?.email ?? "";
      }

      // 2️⃣ Load emails
      if (matchData.player1) {
        setPlayer1Email(await getEmail(matchData.player1));
      }
      if (matchData.player2) {
        setPlayer2Email(await getEmail(matchData.player2));
      }
      if (matchData.winner) {
        setWinnerEmail(await getEmail(matchData.winner));
      }

      // 3️⃣ Load problem
      const pid = matchData.problem_id || matchData.problem;
      if (pid) {
        const levels = ["Beginner", "Intermediate", "Advanced"] as const;
        for (const lvl of levels) {
          const found = PROBLEMS[lvl].find((p) => p.id === pid);
          if (found) {
            setProblem(found);
            break;
          }
        }
      }

      // 4️⃣ Rating change
      async function getRating(uid: string) {
        const { data } = await supabase
          .from("user_profiles")
          .select("rating")
          .eq("id", uid)
          .single();
        return data?.rating ?? 1000;
      }

      if (matchData.player1 && matchData.player2) {
        const oldP1 = matchData.old_p1_rating ?? null;
        const oldP2 = matchData.old_p2_rating ?? null;

        // get new ratings
        const newP1 = await getRating(matchData.player1);
        const newP2 = await getRating(matchData.player2);

        if (oldP1 !== null) setP1RatingChange(newP1 - oldP1);
        if (oldP2 !== null) setP2RatingChange(newP2 - oldP2);
      }

      setLoading(false);
    }

    load();
  }, [matchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Loading results...
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Match not found.
      </div>
    );
  }

  const p1Score = match.player1_score ?? "—";
  const p2Score = match.player2_score ?? "—";

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Match Result</h1>

        {/* SUMMARY */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-300">Match ID</div>
              <div className="font-bold text-lg">{match.id}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-300">Difficulty</div>
              <div className="font-bold">{match.difficulty}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-gray-900 rounded">
              <div className="text-sm text-gray-400">Player 1</div>
              <div className="font-bold text-lg">{player1Email}</div>
              <div className="text-green-400 text-xl mt-2">
                {p1Score}{" "}
                <span className="text-gray-400 text-sm">
                  ({p1RatingChange > 0 ? "+" : ""}
                  {p1RatingChange})
                </span>
              </div>
            </div>

            <div className="p-4 bg-gray-900 rounded">
              <div className="text-sm text-gray-400">Player 2</div>
              <div className="font-bold text-lg">{player2Email}</div>
              <div className="text-green-400 text-xl mt-2">
                {p2Score}{" "}
                <span className="text-gray-400 text-sm">
                  ({p2RatingChange > 0 ? "+" : ""}
                  {p2RatingChange})
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-800 rounded border border-gray-700">
            <div className="text-sm text-gray-300">Winner</div>
            <div className="text-2xl font-bold">
              {winnerEmail || (p1Score === p2Score ? "Draw" : "Deciding...")}
            </div>
          </div>
        </div>

        {/* PROBLEM */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-2">
            {problem ? problem.title : "Problem"}
          </h2>

          <p className="text-gray-300 mb-4">
            {problem ? problem.description : ""}
          </p>

          <h3 className="text-lg font-semibold mb-2">Testcases</h3>
          <div className="space-y-2">
            {problem?.testcases?.map((tc: any, i: number) => (
              <div
                key={i}
                className="p-2 bg-gray-900 rounded border border-gray-700"
              >
                <div className="text-sm text-gray-300">Input: {tc.input}</div>
                <div className="text-sm text-gray-300">
                  Expected: {tc.expected}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex space-x-3">
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Back to Menu
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Copied result URL!");
            }}
            className="px-4 py-2 bg-gray-700 rounded"
          >
            Copy Link
          </button>
        </div>
      </div>
    </div>
  );
}
