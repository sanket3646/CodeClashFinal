// src/services/MatchService.ts
import { supabase } from "../lib/supabaseClient";
import { PROBLEMS } from "../data/problems";

// Types for createMatch return
export interface CreateMatchResponse {
  matchId: string;
  code: string;
  problemId: string | null;
  match: any;
}

export const MatchService = {
  async createMatch(
    userId: string,
    difficulty: "Beginner" | "Intermediate" | "Advanced"
  ): Promise<CreateMatchResponse> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // pick random problem based on difficulty
    const bucket = PROBLEMS[difficulty];
    const randomProblem =
      bucket[Math.floor(Math.random() * bucket.length)];

    // Insert match row
    const { data, error } = await supabase
      .from("matches")
      .insert({
        code,
        difficulty,
        player1: userId,
        status: "waiting",
        problem_id: randomProblem.id,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) throw error;

    return {
      matchId: data.id, // ⭐ the field MainMenu & VS screens expect
      code: data.code,
      problemId: data.problem_id,
      match: data,
    };
  },

  async joinMatch(userId: string, code: string) {
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("code", code)
      .single();

    if (matchError || !match) throw new Error("Match not found.");
    if (match.player1 === userId)
      throw new Error("You cannot join your own match.");
    if (match.player2)
      throw new Error("Match already has 2 players.");

    const { data, error } = await supabase
      .from("matches")
      .update({
        player2: userId,
        status: "ready",
      })
      .eq("id", match.id)
      .select("*")
      .single();

    if (error) throw error;

    return {
      matchId: data.id, // ⭐ ensure consistent return shape
      code: data.code,
      problemId: data.problem_id,
      match: data,
    };
  },
};
