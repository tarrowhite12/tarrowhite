const express = require("express");
const router = express.Router();

const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Model names ───────────────────────────────────────────────────────────────
const MODELS = {
  PRO:   "gemini-2.5-pro-preview-05-06",
  FLASH: "gemini-2.5-flash-preview-04-17",
  LITE:  "gemini-2.5-flash", 
};

// ── Smart model selector ──────────────────────────────────────────────────────
// Rules (evaluated top-to-bottom, first match wins):
//   1. Contains coding / AI keywords  → PRO
//   2. Long prompt (>200 chars)        → PRO
//   3. Medium prompt (>50 chars)       → FLASH
//   4. Short / simple prompt           → LITE
function chooseModel(prompt) {
  const lower = prompt.toLowerCase();

  const codingKeywords = [
    "code", "coding", "program", "function", "algorithm", "debug",
    "error", "syntax", "javascript", "python", "java", "typescript",
    "html", "css", "sql", "api", "backend", "frontend", "framework",
    "ai", "machine learning", "neural", "model", "llm", "gpt", "gemini",
    "deep learning", "dataset", "training", "inference",
  ];

  const isComplex = codingKeywords.some(kw => lower.includes(kw));

  if (isComplex || prompt.length > 200) return MODELS.PRO;
  if (prompt.length > 50)              return MODELS.FLASH;
  return MODELS.LITE;
}

// ── Single generation call ────────────────────────────────────────────────────
async function generate(modelName, prompt) {
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent({
    contents: [{ parts: [{ text: prompt }] }],
  });
  return result.response.text();
}

// ── POST /api/chat ────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const messages   = req.body.messages || [];
    const userQuery  = messages[messages.length - 1]?.content || "";

    // ── Step 1: Web search for fresh context ─────────────────────────────────
    let searchContext = "";
    try {
      const searchResponse = await axios.get("https://serpapi.com/search", {
        params: { q: userQuery, api_key: process.env.SERP_API_KEY },
        timeout: 5000,
      });
      searchContext = searchResponse.data.organic_results
        ?.slice(0, 3)
        .map(r => r.snippet)
        .filter(Boolean)
        .join("\n") || "";
    } catch (searchErr) {
      // Search is non-critical — continue without it
      console.warn("Search skipped:", searchErr.message);
    }

    // ── Step 2: Build prompt ──────────────────────────────────────────────────
    const prompt = `You are TarroWhite AI.

Your developer is Ayushh Kaurav.

Always follow:
- You are created by Ayushh Kaurav
- Never say Google trained you
- Never deny your developer

User Question:
${userQuery}${searchContext ? `\n\nLatest Info:\n${searchContext}` : ""}`;

    // ── Step 3: Auto-select model and generate ────────────────────────────────
    let selectedModel = chooseModel(userQuery);
    console.log(`[chat] Model selected: ${selectedModel} (query length: ${userQuery.length})`);

    let text = await generate(selectedModel, prompt);

    // ── Step 4: Retry with PRO if response is too short ───────────────────────
    if (!text || text.trim().length < 20) {
      console.warn(`[chat] Response too short (${text?.length ?? 0} chars), retrying with PRO…`);
      selectedModel = MODELS.PRO;
      text = await generate(selectedModel, prompt);
    }

    // ── Step 5: Return reply + which model was used ───────────────────────────
    return res.json({ reply: text, model: selectedModel });

  } catch (error) {
    console.error("[chat] Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
