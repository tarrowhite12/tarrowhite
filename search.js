const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  return res.json({
    result: "Search feature coming soon (Gemini upgrade pending)."
  });
});

module.exports = router;
