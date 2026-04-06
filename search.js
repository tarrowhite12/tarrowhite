/**
 * src/routes/search.js  (FUTURE FEATURE — stub)
 *
 * POST /api/search
 * Body: { query: string }
 *
 * Uses OpenAI with the web_search_preview tool to get real-time info.
 * Uncomment in server.js when ready.
 * Add BRAVE_API_KEY (or similar) to .env if you prefer a direct search API.
 */

const express = require("express");
const openai  = require("../openaiClient");

const router = express.Router();

router.post("/", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "query is required." });

  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      tools: [{ type: "web_search_preview" }],
      input: query,
    });

    const text = response.output
      .filter(b => b.type === "message")
      .flatMap(b => b.content)
      .filter(c => c.type === "output_text")
      .map(c => c.text)
      .join("\n");

    return res.json({ result: text });

  } catch (err) {
    console.error("[/api/search error]", err.message);
    return res.status(500).json({ error: "Search failed." });
  }
});

module.exports = router;
