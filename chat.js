const express = require("express");
const router = express.Router();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-pro" });

router.post("/", async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required." });
  }

  try {
    const userMessage = messages[messages.length - 1].content;

    const result = await model.generateContent(userMessage);
    const response = await result.response;
    const text = response.text();

    return res.json({ reply: text });

  } catch (err) {
    console.error("[Gemini error]", err.message);
    return res.status(500).json({ error: "AI response failed." });
  }
});

module.exports = router; 
