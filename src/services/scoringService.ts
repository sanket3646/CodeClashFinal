import { supabase } from "../lib/supabaseClient";
import { runJudge0 } from "./judgeService";

/* ---------------------- 1️⃣ Evaluate Solution ---------------------- */
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

  // Save score
  const { error } = await supabase
    .from("matches")
    .update({ [playerField]: score })
    .eq("id", matchId);

  if (error) throw error;

  return score;
}

/* ---------------------- 2️⃣ Decide Winner ---------------------- */
export async function checkMatchCompletion(matchId: string) {
  const { data, error } = await supabase
    .from("matches")
    .select("player1_score, player2_score, player1, player2")
    .eq("id", matchId)
    .single();

  if (error || !data) return null;

  const { player1_score: p1, player2_score: p2 } = data;

  // If either missing → match not complete
  if (p1 == null || p2 == null) return null;

  if (p1 > p2) return data.player1;
  if (p2 > p1) return data.player2;
  return "draw";
}

/* ---------------------- 3️⃣ Finish Match (rating + final update) ---------------------- */
export async function finishMatch(matchId: string, winner: string | "draw") {
  // Load match players
  const { data: match, error: matchErr } = await supabase
    .from("matches")
    .select("player1, player2, status")
    .eq("id", matchId)
    .single();

  if (matchErr || !match) throw matchErr;

  // If already finished → do nothing
  if (match.status === "finished") return;

  const p1 = match.player1;
  const p2 = match.player2;

  /* --- Load ratings --- */
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

  // Save old ratings for ResultPage
  const old_p1_rating = p1Rating;
  const old_p2_rating = p2Rating;

  /* --- Apply rating change --- */
  if (winner === p1) {
    p1Rating += 8;
    p2Rating -= 8;
  } else if (winner === p2) {
    p2Rating += 8;
    p1Rating -= 8;
  }

  // Prevent negative ratings
  p1Rating = Math.max(0, p1Rating);
  p2Rating = Math.max(0, p2Rating);

  /* --- Update ratings --- */
  await supabase.from("user_profiles").update({ rating: p1Rating }).eq("id", p1);
  await supabase.from("user_profiles").update({ rating: p2Rating }).eq("id", p2);

  /* --- Mark match finished + save rating history --- */
  const { error } = await supabase
    .from("matches")
    .update({
      status: "finished",
      winner: winner === "draw" ? null : winner,
      old_p1_rating,
      old_p2_rating,
    })
    .eq("id", matchId);

  if (error) throw error;
}
