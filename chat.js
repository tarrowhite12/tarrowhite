const express = require("express");
const router = express.Router();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

router.post("/", async (req, res) => {
  try {
    const userMessage = req.body.messages?.slice(-1)[0]?.content || "Hello";

    const result = await model.generateContent(userMessage);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error("FULL ERROR:", error); // 👈 important
    res.status(500).json({ error: "AI response failed" });
  }
});

module.exports = router; 
