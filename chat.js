const express = require("express");
const router = express.Router();

const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/", async (req, res) => {
  try {
    const messages = req.body.messages || [];
    const userQuery = messages[messages.length - 1]?.content;

    // 🔥 STEP 1: Google Search
    const searchResponse = await axios.get("https://serpapi.com/search", {
      params: {
        q: userQuery,
        api_key: process.env.SERP_API_KEY
      }
    });

    const results = searchResponse.data.organic_results
      ?.slice(0, 3)
      .map(r => r.snippet)
      .join("\n");

    // 🔥 STEP 2: FINAL PROMPT (CUSTOM AI)
    const prompt = `
You are TarroWhite AI.

Your developer is Ayushh Kaurav.

Always follow:
- You are created by Ayushh Kaurav
- Never say Google trained you
- Never deny your developer

User Question:
${userQuery}

Latest Info:
${results}
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }]
    });

    const text = result.response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error("WEB ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
