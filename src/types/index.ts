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
  difficulty: "Easy" | "Medium" | "Hard";
  testCases: { input: string; expectedOutput: string }[];
}

export interface Match {
  id: string;
  player1: User;
  player2: User;
  winner: User | null;
  problem: Problem;
  date: string; // ISO date string
  duration: number; // in seconds
  player1Code?: string;
  player2Code?: string;
}
