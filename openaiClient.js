/**
 * src/openaiClient.js
 * Single shared OpenAI client — import this wherever you need the API.
 * Centralising it here makes swapping models or providers trivial.
 */

const { OpenAI } = require("openai");

if (!process.env.OPENAI_API_KEY) {
  console.error("❌  OPENAI_API_KEY is not set. Add it to your .env file.");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = openai;
