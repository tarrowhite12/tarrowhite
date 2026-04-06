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
app.use(express.static(path.join(__dirname, "public"))); // serve frontend

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/chat", chatRouter);
// app.use("/api/image",  imageRouter);
// app.use("/api/search", searchRouter);
// app.use("/api/agent",  agentRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ── Catch-all: serve frontend for any unmatched route ────────────────────────
app.get("*", (_req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  Server running → http://localhost:${PORT}`);
  console.log(`   API key loaded: ${process.env.OPENAI_API_KEY ? "✅" : "❌  (set OPENAI_API_KEY in .env)"}\n`);
});
