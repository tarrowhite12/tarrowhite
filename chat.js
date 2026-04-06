/**
 * src/routes/chat.js
 * POST /api/chat  — accepts a conversation history, returns AI reply.
 *
 * Request body:
 *   { messages: [ { role: "user"|"assistant"|"system", content: string }, ... ] }
 *
 * Response (JSON):
 *   { reply: string }
 */

const express = require("express");
const openai = require("../openaiClient");

const router = express.Router();

// ── Config ────────────────────────────────────────────────────────────────────
const MODEL = "gpt-4o-mini";
const MAX_TOKENS = 1024;
const SYSTEM_PROMPT = {
  role: "system",
  content:
    "You are a helpful, knowledgeable, and concise assistant. " +
    "Format responses using Markdown when it improves readability. " +
    "Be direct and avoid filler phrases.",
};

// ── POST /api/chat ────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  const { messages } = req.body;

  // Basic validation
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required." });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [SYSTEM_PROMPT, ...messages], // prepend system prompt every time
    });

    const reply = completion.choices[0].message.content.trim();
    return res.json({ reply });

  } catch (err) {
    console.error("[/api/chat error]", err.message);

    // Return helpful error messages to the frontend
    if (err.status === 401) {
      return res.status(401).json({ error: "Invalid OpenAI API key." });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: "Rate limit reached. Please wait a moment." });
    }
    if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
      return res.status(503).json({ error: "Cannot reach OpenAI. Check your internet connection." });
    }

    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

module.exports = router;
