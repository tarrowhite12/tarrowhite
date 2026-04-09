const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const axios = require("axios");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Model names ───────────────────────────────────────────────
const MODELS = {
  PRO:   "llama-3.3-70b-versatile",
  FLASH: "llama-3.1-8b-instant",
  LITE:  "llama-3.1-8b-instant",
};

// ── Smart model selector ──────────────────────────────────────
function chooseModel(prompt) {
  const lower = prompt.toLowerCase();
  const codingKeywords = [
    "code","coding","program","function","algorithm","debug",
    "error","syntax","javascript","python","java","typescript",
    "html","css","sql","api","backend","frontend","framework",
    "ai","machine learning","neural","model","llm","gpt",
    "deep learning","dataset","training","inference",
  ];

  const isComplex = codingKeywords.some(kw => lower.includes(kw));

  if (isComplex || prompt.length > 200) return MODELS.PRO;
  if (prompt.length > 50) return MODELS.FLASH;
  return MODELS.LITE;
}

// ── Single generation call ────────────────────────────────────
async function generate(modelName, messages) {
  const completion = await groq.chat.completions.create({
    model: modelName,
    messages,
    max_tokens: 1024,
    temperature: 0.85, // 🔥 more creative
  });

  return completion.choices[0]?.message?.content?.trim() || "";
}

// ── POST /api/chat ────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const incomingMessages = req.body.messages || [];
    const userQuery = incomingMessages[incomingMessages.length - 1]?.content || "";

    // 🔍 ── SERP API (LATEST NEWS FIXED) ────────────────────────
    let searchContext = "";

    try {
      const response = await axios.get("https://serpapi.com/search", {
        params: {
          q: userQuery + " latest news",
          api_key: process.env.SERP_API_KEY,
          tbm: "nws",       // 🔥 news mode
          tbs: "qdr:d"      // 🔥 last 24 hours
        },
        timeout: 5000
      });

      const results = response.data.news_results || [];

      searchContext = results
        .slice(0, 5)
        .map((r, i) => `
Result ${i + 1}:
Title: ${r.title}
Snippet: ${r.snippet}
Source: ${r.link}
Date: ${r.date}
`)
        .join("\n");

    } catch (err) {
      console.log("Search failed:", err.message);
    }

    // ── Messages build ────────────────────────────────────────
    const messages = [
      {
        role: "system",
        content: `
You are TarroWhite AI.
Your developer is Ayushh Kaurav.

You have access to latest internet news.

Latest News Data:
${searchContext}

Instructions:
- Use latest news if relevant
- Do NOT copy, explain in your own words
- Make answers interesting and engaging
- Add examples when possible
- Be conversational like ChatGPT
- If no news available, answer normally

Format using Markdown.
`
      },
      ...incomingMessages
        .filter(m => m.role === "user" || m.role === "assistant")
        .map(m => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content
        })),
    ];

    // ── Model select ─────────────────────────────────────────
    let selectedModel = chooseModel(userQuery);
    console.log(`[chat] Model selected: ${selectedModel}`);

    let text = await generate(selectedModel, messages);

    // 🔁 Retry if weak
    if (!text || text.trim().length < 20) {
      selectedModel = MODELS.PRO;
      text = await generate(selectedModel, messages);
    }

    return res.json({ reply: text, model: selectedModel });

  } catch (error) {
    console.error("[chat] Error:", error.message);

    if (error.status === 401)
      return res.status(401).json({ error: "Invalid GROQ_API_KEY" });

    if (error.status === 429)
      return res.status(429).json({ error: "Rate limit reached" });

    return res.status(500).json({ error: error.message });
  }
});

module.exports = router; 
