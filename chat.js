const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Model names ───────────────────────────────────────────────────────────────
const MODELS = {
  PRO:   "llama-3.3-70b-versatile",   // complex / coding tasks
  FLASH: "llama-3.1-8b-instant",      // medium queries — fast + cheap
  LITE:  "llama-3.1-8b-instant",            // short / simple queries
};

// ── Smart model selector ──────────────────────────────────────────────────────
function chooseModel(prompt) {
  const lower = prompt.toLowerCase();
  const codingKeywords = [
    "code", "coding", "program", "function", "algorithm", "debug",
    "error", "syntax", "javascript", "python", "java", "typescript",
    "html", "css", "sql", "api", "backend", "frontend", "framework",
    "ai", "machine learning", "neural", "model", "llm", "gpt",
    "deep learning", "dataset", "training", "inference",
  ];
  const isComplex = codingKeywords.some(kw => lower.includes(kw));
  if (isComplex || prompt.length > 200) return MODELS.PRO;
  if (prompt.length > 50)              return MODELS.FLASH;
  return MODELS.LITE;
}

// ── Single generation call ────────────────────────────────────────────────────
async function generate(modelName, messages) {
  const completion = await groq.chat.completions.create({
    model: modelName,
    messages,
    max_tokens: 1024,
    temperature: 0.7,
  });
  return completion.choices[0]?.message?.content?.trim() || "";
}

// ── POST /api/chat ────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const incomingMessages = req.body.messages || [];
    const userQuery = incomingMessages[incomingMessages.length - 1]?.content || "";

    // Build messages array with system prompt + conversation history
    const messages = [
      {
        role: "system",
        content:
          "You are TarroWhite AI, a helpful and knowledgeable assistant. " +
          "Your developer is Ayushh Kaurav. " +
          "Never deny your developer or claim to be made by anyone else. " +
          "Format responses using Markdown when it improves readability.",
      },
      // Only user/assistant roles are valid for the chat API
      ...incomingMessages
        .filter(m => m.role === "user" || m.role === "assistant")
        .map(m => ({ role: m.role, content: m.content })),
    ];

    // Auto-select model based on query complexity
    let selectedModel = chooseModel(userQuery);
    console.log(`[chat] Model selected: ${selectedModel} (query length: ${userQuery.length})`);

    let text = await generate(selectedModel, messages);

    // Retry with PRO if response is too short
    if (!text || text.trim().length < 20) {
      console.warn(`[chat] Response too short (${text?.length ?? 0} chars), retrying with PRO...`);
      selectedModel = MODELS.PRO;
      text = await generate(selectedModel, messages);
    }

    return res.json({ reply: text, model: selectedModel });

  } catch (error) {
    console.error("[chat] Error:", error.message);
    if (error.status === 401) return res.status(401).json({ error: "Invalid GROQ_API_KEY. Check your .env file." });
    if (error.status === 429) return res.status(429).json({ error: "Rate limit reached. Please wait a moment." });
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
