import { supabase } from "../lib/supabaseClient";
import { runJudge0 } from "./judgeService";

export async function evaluateSolution(
  matchId: string,
  code: string,
  language: string,
  testcases: any[],
  playerField: "player1_score" | "player2_score"
) {
  let score = 0;

  for (let tc of testcases) {
    const result = await runJudge0(code, language, tc.input);

    const output = (result?.stdout || "").trim();
    const expected = tc.expected.trim();

    if (output === expected) score++;
  }

  // update score in DB
  const { error } = await supabase
    .from("matches")
    .update({ [playerField]: score })
    .eq("id", matchId);

  if (error) throw error;

  return score;
}

export async function checkMatchCompletion(matchId: string) {
  const { data, error } = await supabase
    .from("matches")
    .select("player1_score, player2_score, player1, player2")
    .eq("id", matchId)
    .single();

  if (error || !data) return null; // 🔥 FIX: safe data handling

  const p1 = data.player1_score;
  const p2 = data.player2_score;

  // If either score is null → not finished
  if (p1 == null || p2 == null) return null;

  if (p1 > p2) return data.player1;
  if (p2 > p1) return data.player2;
  return "draw";
}

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
