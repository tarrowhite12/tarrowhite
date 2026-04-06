/**
 * src/routes/image.js  (FUTURE FEATURE — stub)
 *
 * POST /api/image
 * Body: { prompt: string }
 *
 * Generates an image using DALL·E 3 and returns a URL.
 * Uncomment in server.js when ready.
 */

const express = require("express");
const openai  = require("./openaiClient");

const router = express.Router();

router.post("/", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt is required." });

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
    });

    return res.json({ url: response.data[0].url });

  } catch (err) {
    console.error("[/api/image error]", err.message);
    return res.status(500).json({ error: "Image generation failed." });
  }
});

module.exports = router;
