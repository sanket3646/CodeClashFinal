// src/services/judgeService.ts
import axios from "axios";

// Local → Netlify serverless function
const NETLIFY_JUDGE = "/.netlify/functions/judge";

// Mapping human language → Judge0 language ID
const LANGUAGE_MAP: Record<string, number> = {
  javascript: 63,
  python: 71,
  cpp: 54,
  java: 62,
};

// Main Judge runner (client → Netlify → Judge0)
export async function runJudge0(
  code: string,
  language: string,
  input: string
) {
  const langId = LANGUAGE_MAP[language.toLowerCase().trim()];
  if (!langId) throw new Error("Unsupported language: " + language);

  try {
    const response = await axios.post(NETLIFY_JUDGE, {
      source_code: code ?? "",
      stdin: input ?? "",
      language_id: langId,
    });

    return response.data;
  } catch (err: any) {
    console.error("🔥 JUDGE ERROR:", err.response?.data || err);

    throw new Error(
      err.response?.data?.message ||
        "Judge0 failed (serverless call). Check Netlify logs."
    );
  }
}
