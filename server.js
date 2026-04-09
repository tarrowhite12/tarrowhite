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
// Uses Google Imagen 3 via @google/generative-ai SDK.
// Requires GEMINI_API_KEY in .env
// Returns: { imageData: "<base64 string>", mimeType: "image/png" }
//      or: { error: "..." } on failure
{
  const { GoogleGenAI } = require("@google/genai");

  app.post("/generate-image", async (req, res) => {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "prompt is required." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set in .env" });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const response = await ai.models.generateImages({
        model:  "imagen-3.0-generate-002",
        prompt: prompt.trim(),
        config: { numberOfImages: 1, outputMimeType: "image/png" },
      });

      const image = response.generatedImages?.[0]?.image;
      if (!image?.imageBytes) {
        return res.status(500).json({ error: "No image was returned by the API." });
      }

      return res.json({
        imageData: image.imageBytes,   // base64 string
        mimeType:  "image/png",
      });

    } catch (err) {
      console.error("[/generate-image] Error:", err.message);

      if (err.status === 401) return res.status(401).json({ error: "Invalid GEMINI_API_KEY." });
      if (err.status === 400) return res.status(400).json({ error: "Prompt was rejected by the safety filter. Try a different prompt." });

      return res.status(500).json({ error: err.message || "Image generation failed." });
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
  console.log(`   Gemini API loaded: ${process.env.GEMINI_API_KEY ? "✅" : "❌  (set GEMINI_API_KEY in .env — needed for image gen)"}\n`);
});
