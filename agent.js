/**
 * src/routes/agent.js  (FUTURE FEATURE — stub)
 *
 * POST /api/agent
 * Body: { task: string }
 *
 * Runs an AI agent with custom tools (calculator, file writer, API caller, etc.).
 * Define your tools below and let the model decide when to call them.
 * Uncomment in server.js when ready.
 */

const express = require("express");
const openai  = require("./openaiClient");

const router = express.Router();

// ── Tool definitions (shown to the model) ──────────────────────────────────
const tools = [
  {
    type: "function",
    function: {
      name: "get_current_time",
      description: "Returns the current UTC time.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  // Add more tools here: database lookup, weather API, code runner, etc.
];

// ── Tool implementations ───────────────────────────────────────────────────
function executeTool(name, _args) {
  if (name === "get_current_time") {
    return new Date().toUTCString();
  }
  return "Tool not implemented.";
}

// ── Agent loop ─────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  const { task } = req.body;
  if (!task) return res.status(400).json({ error: "task is required." });

  const messages = [{ role: "user", content: task }];

  try {
    // Run the agent loop (max 5 iterations to avoid infinite loops)
    for (let i = 0; i < 5; i++) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        tools,
        tool_choice: "auto",
      });

      const choice = completion.choices[0];
      messages.push(choice.message);

      if (choice.finish_reason === "stop") {
        return res.json({ result: choice.message.content });
      }

      if (choice.finish_reason === "tool_calls") {
        for (const tc of choice.message.tool_calls) {
          const output = executeTool(tc.function.name, JSON.parse(tc.function.arguments || "{}"));
          messages.push({ role: "tool", tool_call_id: tc.id, content: String(output) });
        }
      }
    }

    return res.status(500).json({ error: "Agent exceeded maximum iterations." });

  } catch (err) {
    console.error("[/api/agent error]", err.message);
    return res.status(500).json({ error: "Agent task failed." });
  }
});

module.exports = router;
