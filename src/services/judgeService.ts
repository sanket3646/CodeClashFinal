// src/services/judgeService.ts
import axios from "axios";

// Call Netlify serverless function (this runs Judge0)
const NETLIFY_JUDGE = "/.netlify/functions/judge";

// Map human-readable languages → Judge0 language IDs
const LANGUAGE_MAP: Record<string, number> = {
  javascript: 63,
  python: 71,
  cpp: 54,
  java: 62,
};

export async function runJudge0(
  code: string,
  language: string,
  input: string
) {
  // Normalize language
  const langKey = language?.toLowerCase().trim();
  const langId = LANGUAGE_MAP[langKey];

  if (!langId) {
    console.error("❌ Unsupported language:", language);
    throw new Error("Unsupported language: " + language);
  }

  try {
    // Forward request to Netlify → Judge0
    const response = await axios.post(NETLIFY_JUDGE, {
      source_code: code || "",
      stdin: input ?? "",
      language_id: langId,
    });

    return response.data;
  } catch (err: any) {
    console.error("🔥 JUDGE ERROR:", err.response?.data || err);

    throw new Error(
      err.response?.data?.error ||
        err.response?.data?.message ||
        "Judge0 failed (via Netlify function). Check Netlify logs."
    );
  }
}
