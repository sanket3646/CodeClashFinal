// netlify/functions/judge.js
const axios = require("axios");

exports.handler = async (event) => {
  try {
    console.log("▶️ Incoming event:", event.body);

    // Parse request body
    const body = JSON.parse(event.body || "{}");
    const { source_code, stdin = "", language_id } = body;

    console.log("▶️ Parsed fields:", body);

    // Validate required fields
    if (!source_code || !language_id) {
      console.error("❌ Missing fields:", body);
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing required fields: source_code or language_id",
          received: body,
        }),
      };
    }

    if (!process.env.JUDGE0_KEY) {
      console.error("❌ Missing JUDGE0_KEY env var");
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Server missing JUDGE0_KEY",
        }),
      };
    }

    // Send request to Judge0 CE via RapidAPI
    const resp = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
      {
        source_code,
        stdin,
        language_id,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": process.env.JUDGE0_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      }
    );

    console.log("✅ Judge0 response:", resp.data);

    return {
      statusCode: 200,
      body: JSON.stringify(resp.data),
    };
  } catch (e) {
    console.error("🔥 Judge function error:", e.response?.data || e.message);

    return {
      statusCode: e.response?.status || 500,
      body: JSON.stringify(e.response?.data || { error: e.message }),
    };
  }
};
