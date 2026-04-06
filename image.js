const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  return res.json({
    url: "Image feature coming soon."
  });
});

module.exports = router;
