import axios from "axios";

const JUDGE0_URL =
  "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true";

const API_HOST = "judge0-ce.p.rapidapi.com";
const API_KEY = "4424eea569msh14e525c909e2ea4p120474jsna199b2f052bd"; // replace this

export async function runJudge0(code: string, language: string, input: string) {
  const langId = {
    javascript: 63,
    python: 71,
    cpp: 54,
    java: 62,
  }[language];

  const response = await axios.post(
    JUDGE0_URL,
    {
      source_code: code,
      stdin: input,
      language_id: langId,
    },
    {
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Key": API_KEY,
        "X-RapidAPI-Host": API_HOST,
      },
    }
  );

  return response.data;
}
