// src/services/judgeService.ts
import axios from "axios";

// RapidAPI Judge0 endpoint
const JUDGE0_URL =
  "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true";

// Only ONE environment variable needed
const API_KEY = import.meta.env.VITE_JUDGE0_KEY;

// Judge0 host MUST be exactly this (RapidAPI requirement)
const API_HOST = "judge0-ce.p.rapidapi.com";

// Map languages → Judge0 IDs
const LANGUAGE_MAP: Record<string, number> = {
  javascript: 63,
  python: 71,
  cpp: 54,
  java: 62,
};

export async function runJudge0(code: string, language: string, input: string) {
  if (!API_KEY) {
    throw new Error("Judge0 API key missing. Add VITE_JUDGE0_KEY to your .env");
  }

  // Case-insensitive lookup
  const langKey = language?.toLowerCase().trim();
  const langId = LANGUAGE_MAP[langKey];

  if (!langId) {
    console.error("❌ Unsupported language:", language);
    throw new Error("Unsupported language: " + language);
  }

  try {
    const response = await axios.post(
      JUDGE0_URL,
      {
        source_code: code || "",
        stdin: input ?? "",
        language_id: langId,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": API_KEY,
          "X-RapidAPI-Host": API_HOST,
        },
      }
    );

    return response.data;
  } catch (err: any) {
    console.error("🔥 Judge0 Error:", err.response?.data || err);

    throw new Error(
      err.response?.data?.message ||
        "Judge0 request failed. Check API key, headers, or request body."
    );
  }
}
