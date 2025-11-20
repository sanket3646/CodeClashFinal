import { runJudge0 } from "./judgeService";
import { supabase } from "../lib/supabaseClient";

// ---------- Evaluate Player Code ----------
export async function evaluateSolution(
  matchId: string,
  code: string,
  language: string,
  testcases: { input: string; expected: string }[],
  playerField: "player1_score" | "player2_score"
) {
  let score = 0;

  for (let tc of testcases) {
    const result = await runJudge0(code, language, tc.input);

    const output = (result?.stdout || "").trim();
    const expected = tc.expected.trim();

    if (output === expected) score++;
  }

  // Save player score
  const { error } = await supabase
    .from("matches")
    .update({ [playerField]: score })
    .eq("id", matchId);

  if (error) throw error;

  return score;
}

// ---------- Check Winner ----------
export async function checkIfBothSubmitted(matchId: string) {
  const { data, error } = await supabase
    .from("matches")
    .select("player1_score, player2_score, player1, player2")
    .eq("id", matchId)
    .single();

  if (error || !data) return null;

  const { player1_score, player2_score, player1, player2 } = data;

  if (player1_score == null || player2_score == null) return null;

  if (player1_score > player2_score) return player1;
  if (player2_score > player1_score) return player2;

  return "draw";
}

// ---------- Finish Match ----------
export async function finishMatch(matchId: string, winner: string | "draw") {
  const { error } = await supabase
    .from("matches")
    .update({
      status: "finished",
      winner: winner === "draw" ? null : winner,
    })
    .eq("id", matchId);

  if (error) throw error;
}
