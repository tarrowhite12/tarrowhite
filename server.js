/**
 * server.js — Entry point
 * Boots Express, mounts middleware and routes, serves the frontend.
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const chatRouter = require("./chat");
// Future routers — uncomment when ready:
// const imageRouter  = require("./src/routes/image");
// const searchRouter = require("./src/routes/search");
// const agentRouter  = require("./src/routes/agent");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));// serve frontend

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/chat", chatRouter);
// app.use("/api/search", searchRouter);
// app.use("/api/agent",  agentRouter);

// ── Image generation — POST /generate-image ───────────────────────────────────
// Uses DeepAI text2img API.
// Requires DEEPAI_API_KEY in .env
// Returns: { imageData: "<image_url>", mimeType: "url" }
//      or: { error: "..." } on failure
{
  const axios = require("axios");

  app.post("/generate-image", async (req, res) => {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "prompt is required." });
    }

    if (!process.env.DEEPAI_API_KEY) {
      return res.status(500).json({ error: "DEEPAI_API_KEY is not set in .env" });
    }

    try {
      const response = await axios.post(
        "https://api.deepai.org/api/text2img",
        { text: prompt.trim() },
        {
          headers: {
            "api-key": process.env.DEEPAI_API_KEY,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      const imageUrl = response.data?.output_url;
      if (!imageUrl) {
        return res.status(500).json({ error: "No image URL returned by DeepAI." });
      }

      return res.json({
        imageData: imageUrl,  // direct URL
        mimeType:  "url",
      });

    } catch (err) {
      console.error("[/generate-image] Error:", err.message);

      if (err.response?.status === 401) return res.status(401).json({ error: "Invalid DEEPAI_API_KEY." });
      if (err.response?.status === 403) return res.status(403).json({ error: "DeepAI API key does not have permission." });
      if (err.code === "ECONNABORTED")   return res.status(504).json({ error: "Request timed out. DeepAI is taking too long." });

      return res.status(500).json({ error: err.response?.data?.err || err.message || "Image generation failed." });
    }
  });
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ── Catch-all: serve frontend for any unmatched route ────────────────────────
app.get("*", (_req, res) =>
  res.sendFile(path.join(__dirname, "index.html")) 
);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  Server running → http://localhost:${PORT}`);
  console.log(`   Groq API loaded:   ${process.env.GROQ_API_KEY   ? "✅" : "❌  (set GROQ_API_KEY in .env)"}`);
  console.log(`   DeepAI loaded:     ${process.env.DEEPAI_API_KEY ? "✅" : "❌  (set DEEPAI_API_KEY in .env — needed for image gen)"}\n`);
});
