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

  const [player1Email, setPlayer1Email] = useState("Player 1");
  const [player2Email, setPlayer2Email] = useState("Player 2");
 

  const [p1RatingChange, setP1RatingChange] = useState(0);
  const [p2RatingChange, setP2RatingChange] = useState(0);

  const [problem, setProblem] = useState<any>(null);

  useEffect(() => {
    async function load() {
      if (!matchId) return;

      setLoading(true);

      // 1️⃣ Fetch match row
      const { data: m, error } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (error || !m) {
        console.error("Match load error:", error);
        setLoading(false);
        return;
      }

      setMatch(m);

      // helper: ALWAYS load email from auth.users (NOT user_profiles)
      async function getEmail(uid: string) {
        if (!uid) return "";
        const { data } = await supabase.auth.getUser(uid);
        return data?.user?.email ?? "";
      }

      // 2️⃣ Load emails
      if (m.player1) setPlayer1Email(await getEmail(m.player1));
      if (m.player2) setPlayer2Email(await getEmail(m.player2));
     

      // 3️⃣ Load problem
      const pid = m.problem_id || m.problem;
      if (pid) {
        const levels: Array<"Beginner" | "Intermediate" | "Advanced"> = [
          "Beginner",
          "Intermediate",
          "Advanced",
        ];
        for (const lvl of levels) {
          const found = PROBLEMS[lvl].find((p) => p.id === pid);
          if (found) {
            setProblem(found);
            break;
          }
        }
      }

      // 4️⃣ Rating change display
      async function getRating(uid: string) {
        const { data } = await supabase
          .from("user_profiles")
          .select("rating")
          .eq("id", uid)
          .single();
        return data?.rating ?? 1000;
      }

      const oldP1 = m.old_p1_rating ?? null;
      const oldP2 = m.old_p2_rating ?? null;

      if (m.player1 && m.player2) {
        const newP1 = await getRating(m.player1);
        const newP2 = await getRating(m.player2);

        if (oldP1 !== null) setP1RatingChange(newP1 - oldP1);
        if (oldP2 !== null) setP2RatingChange(newP2 - oldP2);
      }

      setLoading(false);
    }

    load();
  }, [matchId]);

  if (loading)
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Loading...
      </div>
    );

  if (!match)
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Match not found.
      </div>
    );

  const p1Score = match.player1_score ?? "—";
  const p2Score = match.player2_score ?? "—";

  // winner display fix
 

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Match Result</h1>

        {/* SUMMARY */}
        <div className="bg-gray-800 p-6 rounded border border-gray-700">
          <div className="flex justify-between mb-6">
            <div>
              <div className="text-gray-300 text-sm">Match ID</div>
              <div className="text-lg font-bold">{match.id}</div>
            </div>
            <div className="text-right">
              <div className="text-gray-300 text-sm">Difficulty</div>
              <div className="font-bold">{match.difficulty}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Player 1 */}
            <div className="bg-gray-900 p-4 rounded">
              <div className="text-gray-400 text-sm">Player 1</div>
              <div className="text-lg font-bold">{player1Email}</div>
              <div className="text-green-400 text-xl mt-2">
                {p1Score}{" "}
                <span className="text-gray-400 text-sm">
                  ({p1RatingChange >= 0 ? "+" : ""}
                  {p1RatingChange})
                </span>
              </div>
            </div>

            {/* Player 2 */}
            <div className="bg-gray-900 p-4 rounded">
              <div className="text-gray-400 text-sm">Player 2</div>
              <div className="text-lg font-bold">{player2Email}</div>
              <div className="text-green-400 text-xl mt-2">
                {p2Score}{" "}
                <span className="text-gray-400 text-sm">
                  ({p2RatingChange >= 0 ? "+" : ""}
                  {p2RatingChange})
                </span>
              </div>
            </div>
          </div>

          {/* Winner */}
          <div className="bg-gray-800 p-4 rounded mt-6 border border-gray-700">
            <div className="text-gray-300 text-sm">Winner</div>
            <div className="text-2xl font-bold">sanketkakade32</div>
          </div>
        </div>

        {/* PROBLEM */}
        <div className="bg-gray-800 p-6 rounded border border-gray-700">
          <h2 className="font-bold text-xl mb-2">
            {problem ? problem.title : "Problem"}
          </h2>

          <p className="text-gray-300 mb-4">
            {problem ? problem.description : ""}
          </p>

          <h3 className="font-semibold text-lg mb-2">Testcases</h3>
          {problem?.testcases?.map((tc: any, i: number) => (
            <div
              key={i}
              className="bg-gray-900 p-3 rounded border border-gray-700 mb-2"
            >
              <div className="text-gray-300 text-sm">Input: {tc.input}</div>
              <div className="text-gray-300 text-sm">
                Expected: {tc.expected}
              </div>
            </div>
          ))}
        </div>

        {/* BUTTONS */}
        <div className="flex space-x-3">
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Back to Menu
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Copied link!");
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
