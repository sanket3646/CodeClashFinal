export interface User {
  id: string;
  username: string;
  email: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  averageSolveTime: number;
  favoriteLanguages: string[];
  achievements: string[];
  joinDate: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  testcases: Array<{ input: string; expected: string }>;
  time_limit_ms?: number;
}

export interface Match {
  id: string;
  created_at: string;

  // ---- PLAYER RELATIONS ----
  player1: {
    id: string;
    username: string;
  };

  player2: {
    id: string;
    username: string;
  } | null; // can be null until someone joins

  // ---- WINNER RELATION ----
  winner: {
    id: string;
  } | null;

  // ---- MATCH META ----
  status: string;       // "waiting" | "ready" | "started" | "finished"
  difficulty: string;   // Beginner / Intermediate / Advanced
  code: string | null;  // match join code
  date?: string | null; // if you use this column, otherwise optional

  // ---- PROBLEM ----
  problem_id: string | null; // actual DB field
  problem?: {
    id: string;
    title: string;
    difficulty: string;
  } | null; // optional join if you select it manually

  // ---- PLAYERS' SUBMISSIONS ----
  player1_code?: string | null;
  player2_code?: string | null;

  player1_language?: string | null;
  player2_language?: string | null;

  // ---- SCORES ----
  player1_score?: number | null;
  player2_score?: number | null;

  // ---- TIMING ----
  time_started?: string | null;
  time_ended?: string | null;
}

export interface Submission {
  id: string;
  match_id: string;
  player: string;
  language: "javascript" | "python" | "cpp" | "java";
  code: string;
  verdict?: string;
  results?: any;
  created_at?: string;
}
