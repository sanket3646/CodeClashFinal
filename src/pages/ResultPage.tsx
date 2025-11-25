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

  const [player1Email, setPlayer1Email] = useState<string>("Player 1");
  const [player2Email, setPlayer2Email] = useState<string>("Player 2");
  const [winnerEmail, setWinnerEmail] = useState<string>("");

  useEffect(() => {
    async function load() {
      if (!matchId) return;

      setLoading(true);

      // Load match normally (NO JOIN)
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (error || !data) {
        console.error("Failed to load match:", error);
        setLoading(false);
        return;
      }

      setMatch(data);

      // 🔥 Load Player 1 email
      if (data.player1) {
        const { data: u1 } = await supabase.auth.admin.getUserById(data.player1);
        setPlayer1Email(u1?.user?.email ?? "Player 1");
      }

      // 🔥 Load Player 2 email
      if (data.player2) {
        const { data: u2 } = await supabase.auth.admin.getUserById(data.player2);
        setPlayer2Email(u2?.user?.email ?? "Player 2");
      }

      // 🔥 Load Winner email
      if (data.winner) {
        const { data: uw } = await supabase.auth.admin.getUserById(data.winner);
        setWinnerEmail(uw?.user?.email ?? "");
      }

      // Load problem details
      const pid = data.problem_id || data.problem;
      if (pid) {
        for (const level of ["Beginner", "Intermediate", "Advanced"] as const) {
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Match Result</h1>

        {/* Match summary */}
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
              <div className="font-bold text-lg">{player1Email}</div>
              <div className="text-green-400 text-xl mt-2">{p1Score}</div>
            </div>

            <div className="p-4 bg-gray-900 rounded">
              <div className="text-sm text-gray-400">Player 2</div>
              <div className="font-bold text-lg">{player2Email}</div>
              <div className="text-green-400 text-xl mt-2">{p2Score}</div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-800 rounded border border-gray-700">
            <div className="text-sm text-gray-300">Winner</div>
            <div className="text-2xl font-bold">
              {winnerEmail || (p1Score === p2Score ? "Draw" : "Deciding...")}
            </div>
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
                  <div key={i} className="p-2 bg-gray-900 rounded border border-gray-700">
                    <div className="text-sm text-gray-300">Input: {tc.input}</div>
                    <div className="text-sm text-gray-300">Expected: {tc.expected}</div>
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
