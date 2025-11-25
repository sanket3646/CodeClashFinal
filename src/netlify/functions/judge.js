// netlify/functions/judge.js
const axios = require("axios");

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { source_code, stdin = "", language_id } = body;

    const resp = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
      { source_code, stdin, language_id },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": process.env.JUDGE0_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      }
    );

    return { statusCode: 200, body: JSON.stringify(resp.data) };
  } catch (e) {
    return {
      statusCode: e.response?.status || 500,
      body: JSON.stringify(e.response?.data || e.message),
    };
  }
};
