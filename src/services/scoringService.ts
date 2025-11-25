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
  // 1. Load match info
  const { data: match, error: matchErr } = await supabase
    .from("matches")
    .select("player1, player2")
    .eq("id", matchId)
    .single();

  if (matchErr || !match) throw matchErr;

  const p1 = match.player1;
  const p2 = match.player2;

  // 2. Load both player ratings
  const { data: r1 } = await supabase
    .from("user_profiles")
    .select("rating")
    .eq("id", p1)
    .single();

  const { data: r2 } = await supabase
    .from("user_profiles")
    .select("rating")
    .eq("id", p2)
    .single();

  let p1Rating = r1?.rating ?? 1000;
  let p2Rating = r2?.rating ?? 1000;


  // 3. Apply rating change
  if (winner === p1) {
    p1Rating += 8;
    p2Rating -= 8;
  } else if (winner === p2) {
    p2Rating += 8;
    p1Rating -= 8;
  }

  // Prevent negative rating
  p1Rating = Math.max(0, p1Rating);
  p2Rating = Math.max(0, p2Rating);

  // 4. Update player ratings
  await supabase
    .from("user_profiles")
    .update({ rating: p1Rating })
    .eq("id", p1);

  await supabase
    .from("user_profiles")
    .update({ rating: p2Rating })
    .eq("id", p2);

  // 5. Mark match finished
  const { error } = await supabase
    .from("matches")
    .update({
      status: "finished",
      winner: winner === "draw" ? null : winner,
    })
    .eq("id", matchId);

  if (error) throw error;
}

