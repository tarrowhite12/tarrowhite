const express = require("express");
const router = express.Router();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest " });

router.post("/", async (req, res) => {
  try {
    const messages = req.body.messages || [];

    // Convert full chat history into text
    const prompt = messages
      .map(m => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
      .join("\n");

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error("REAL ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
