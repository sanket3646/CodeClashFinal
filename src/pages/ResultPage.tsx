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

  useEffect(() => {
    async function load() {
      if (!matchId) return;
      setLoading(true);

      const { data, error } = await supabase
        .from("matches")
        .select(
          `*,
           player1:player1 ( id, username ),
           player2:player2 ( id, username ),
           winner:winner ( id, username )`
        )
        .eq("id", matchId)
        .single();

      if (error || !data) {
        console.error("Failed to load match:", error);
        setLoading(false);
        return;
      }

      setMatch(data);

      // find problem info
      const pid = data.problem_id || data.problem;
      if (pid) {
        const levels = ["Beginner", "Intermediate", "Advanced"] as const;
        for (const level of levels) {
          const found = PROBLEMS[level].find((p) => p.id === pid);
          if (found) {
            setProblem(found);
            break;
          }
        }
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

  const player1Name = match.player1?.username ?? "Player 1";
  const player2Name = match.player2?.username ?? "Player 2";

  const winnerName =
    match.winner?.username ??
    (p1Score === p2Score ? "Draw" : "Deciding...");

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Match Result</h1>

        {/* Match Summary */}
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

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-900 rounded">
              <div className="text-sm text-gray-400">Player 1</div>
              <div className="font-bold text-lg">{player1Name}</div>
              <div className="text-green-400 text-xl mt-2">{p1Score}</div>
            </div>

            <div className="p-4 bg-gray-900 rounded">
              <div className="text-sm text-gray-400">Player 2</div>
              <div className="font-bold text-lg">{player2Name}</div>
              <div className="text-green-400 text-xl mt-2">{p2Score}</div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-800 rounded border border-gray-700">
            <div className="text-sm text-gray-300">Winner</div>
            <div className="text-2xl font-bold">{winnerName}</div>
          </div>
        </div>

        {/* Problem summary */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-2">
            {problem ? problem.title : "Problem"}
          </h2>

          <p className="text-gray-300 mb-4">
            {problem ? problem.description : ""}
          </p>

          {problem?.testcases && (
            <>
              <h3 className="text-lg font-semibold mb-2">Testcases</h3>
              <div className="space-y-2">
                {problem.testcases.map((tc: any, i: number) => (
                  <div
                    key={i}
                    className="p-2 bg-gray-900 rounded border border-gray-700"
                  >
                    <div className="text-sm text-gray-300">
                      Input: {tc.input}
                    </div>
                    <div className="text-sm text-gray-300">
                      Expected: {tc.expected}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Back to Menu
          </button>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(location.href);
              alert("Result URL copied");
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
