// src/services/scoringService.ts
import { supabase } from "../lib/supabaseClient";
import { runJudge0 } from "./judgeService";

//
// ------------------------------------------------------------
// 1️⃣  EVALUATE SOLUTION — runs Judge0, calculates score, saves it
// ------------------------------------------------------------
//
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

  // Save score safely
  const { error } = await supabase
    .from("matches")
    .update({ [playerField]: score })
    .eq("id", matchId);

  if (error) throw error;

  return score;
}

//
// ------------------------------------------------------------
// 2️⃣  CHECK MATCH COMPLETION — decides winner or null
// ------------------------------------------------------------
//
export async function checkMatchCompletion(matchId: string) {
  const { data, error } = await supabase
    .from("matches")
    .select("player1, player2, player1_score, player2_score")
    .eq("id", matchId)
    .single();

  if (error || !data) return null;

  const { player1_score: p1, player2_score: p2, player1, player2 } = data;

  if (p1 == null || p2 == null) return null; // still waiting

  if (p1 > p2) return player1;
  if (p2 > p1) return player2;
  return "draw";
}

//
// ------------------------------------------------------------
// 3️⃣  FINISH MATCH — apply rating update + save winner
// ------------------------------------------------------------
//
export async function finishMatch(
  matchId: string,
  winner: string | "draw"
) {
  console.log("finishMatch CALLED with winner:", winner);

  // Load match
  const { data: match, error: matchErr } = await supabase
    .from("matches")
    .select("player1, player2, status")
    .eq("id", matchId)
    .single();

  if (matchErr || !match) throw matchErr;

  // Prevent double execution (no rating recalculation)
  if (match.status === "finished") {
    console.log("Match already finished → skipping.");
    return;
  }

  const p1 = match.player1;
  const p2 = match.player2;

  if (!p1 || !p2) {
    console.error("Match players missing!");
    return;
  }

  //
  // Load ratings
  //
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

  //
  // Save OLD ratings so ResultPage can calculate +8 / -8
  //
  await supabase.from("matches").update({
    old_p1_rating: p1Rating,
    old_p2_rating: p2Rating,
  })
  .eq("id", matchId);

  //
  // Apply 8-point Elo logic
  //
  if (winner === p1) {
    p1Rating += 8;
    p2Rating -= 8;
  } else if (winner === p2) {
    p2Rating += 8;
    p1Rating -= 8;
  }

  // Prevent negative values
  p1Rating = Math.max(0, p1Rating);
  p2Rating = Math.max(0, p2Rating);

  //
  // Update both ratings
  //
  await supabase.from("user_profiles").update({ rating: p1Rating }).eq("id", p1);
  await supabase.from("user_profiles").update({ rating: p2Rating }).eq("id", p2);

  //
  // Mark match finished
  //
  const { error: finishErr } = await supabase
    .from("matches")
    .update({
      status: "finished",
      winner: winner === "draw" ? null : winner,
    })
    .eq("id", matchId);

  if (finishErr) throw finishErr;

  console.log("Match finished successfully.");
}
