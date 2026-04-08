/**
 * app.js — Aether Chat Frontend
 *
 * Responsibilities:
 *  - Manage conversation state (history array)
 *  - Send messages to /api/chat and render responses
 *  - Dark/light theme toggle
 *  - Sidebar + session history UI
 *  - Typing indicator, Markdown rendering, code highlighting
 *  - Auto-resizing textarea, keyboard shortcuts
 */

// ── Config ─────────────────────────────────────────────────────────────────
const API_URL = "/api/chat";

// Marked.js: render Markdown with code highlighting
marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true,
});

// ── State ───────────────────────────────────────────────────────────────────
let conversationHistory = []; // [{role, content}, ...]
let isLoading = false;
let sessions = [];           // saved session list
let currentSessionId = null;

// ── DOM refs ────────────────────────────────────────────────────────────────
const chatArea      = document.getElementById("chatArea");
const userInput     = document.getElementById("userInput");
const sendBtn       = document.getElementById("sendBtn");
const clearBtn      = document.getElementById("clearBtn");
const newChatBtn    = document.getElementById("newChatBtn");
const themeToggle   = document.getElementById("themeToggle");
const themeIcon     = document.getElementById("themeIcon");
const themeLabel    = document.getElementById("themeLabel");
const sidebar       = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarOpen   = document.getElementById("sidebarOpen");
const chatHistory   = document.getElementById("chatHistory");

// ── Theme ───────────────────────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem("theme") || "dark";
  setTheme(saved);
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  if (theme === "dark") {
    themeIcon.textContent  = "☀";
    themeLabel.textContent = "Light mode";
  } else {
    themeIcon.textContent  = "☾";
    themeLabel.textContent = "Dark mode";
  }
}

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  setTheme(current === "dark" ? "light" : "dark");
});

// ── Sidebar ─────────────────────────────────────────────────────────────────
sidebarToggle.addEventListener("click", () => sidebar.classList.add("collapsed"));
sidebarOpen.addEventListener("click",   () => sidebar.classList.remove("collapsed"));

// ── Session management ───────────────────────────────────────────────────────
function createSession(firstMessage) {
  const id      = Date.now().toString();
  const label   = firstMessage.slice(0, 40) + (firstMessage.length > 40 ? "…" : "");
  const session = { id, label, history: [] };
  sessions.unshift(session);
  currentSessionId = id;
  renderHistoryList();
  return session;
}

function renderHistoryList() {
  chatHistory.innerHTML = "";
  sessions.forEach(session => {
    const item = document.createElement("div");
    item.className = "history-item" + (session.id === currentSessionId ? " active" : "");
    item.textContent = session.label;
    item.addEventListener("click", () => loadSession(session.id));
    chatHistory.appendChild(item);
  });
}

function loadSession(id) {
  const session = sessions.find(s => s.id === id);
  if (!session) return;
  currentSessionId = id;
  conversationHistory = [...session.history];

  // Rebuild chat area
  clearChatArea();
  conversationHistory.forEach(msg => {
    if (msg.role !== "system") appendMessage(msg.role, msg.content, false);
  });
  renderHistoryList();
  scrollToBottom();
}

function saveCurrentSession() {
  const session = sessions.find(s => s.id === currentSessionId);
  if (session) session.history = [...conversationHistory];
}

// ── Clear chat ───────────────────────────────────────────────────────────────
function clearChatArea() {
  chatArea.innerHTML = "";
}

function clearChat() {
  conversationHistory = [];
  currentSessionId    = null;
  clearChatArea();

  // Re-add welcome screen
  const welcome = document.createElement("div");
  welcome.id = "welcome";
  welcome.className = "welcome";
  welcome.innerHTML = `
    <div class="welcome-icon">⬡</div>
    <h1>Good to see you.</h1>
    <p>Ask me anything — code, ideas, analysis, or just a chat.</p>
    <div class="suggestion-pills">
      <button class="pill" data-text="Explain quantum entanglement simply">Explain quantum entanglement</button>
      <button class="pill" data-text="Write a Python function to flatten a nested list">Flatten a nested list in Python</button>
      <button class="pill" data-text="Give me 5 creative startup ideas for 2025">Startup ideas for 2025</button>
      <button class="pill" data-text="What are the key differences between React and Vue?">React vs Vue</button>
    </div>`;
  chatArea.appendChild(welcome);
  bindPills();
}

clearBtn.addEventListener("click", clearChat);
newChatBtn.addEventListener("click", clearChat);

// ── Message rendering ────────────────────────────────────────────────────────
function appendMessage(role, content, animate = true) {
  // Hide welcome on first real message
  const welcome = document.getElementById("welcome");
  if (welcome) welcome.remove();

  const wrapper = document.createElement("div");
  wrapper.className = `message-wrapper ${role}`;
  if (!animate) wrapper.style.animation = "none";

  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const html = role === "ai"
    ? marked.parse(content)          // render Markdown for AI
    : escapeHtml(content);           // plain text for user

  wrapper.innerHTML = `
    <div class="avatar ${role}">${role === "ai" ? "⬡" : "You"}</div>
    <div class="message-bubble">
      <div class="bubble-text">${html}</div>
      <div class="msg-time">${now}</div>
    </div>`;

  chatArea.appendChild(wrapper);

  // Highlight code blocks
  wrapper.querySelectorAll("pre code").forEach(el => hljs.highlightElement(el));

  scrollToBottom();
  return wrapper;
}

function appendError(message) {
  const welcome = document.getElementById("welcome");
  if (welcome) welcome.remove();

  const wrapper = document.createElement("div");
  wrapper.className = "message-wrapper ai";
  wrapper.innerHTML = `
    <div class="avatar ai">⬡</div>
    <div class="message-bubble">
      <div class="error-msg">${escapeHtml(message)}</div>
    </div>`;
  chatArea.appendChild(wrapper);
  scrollToBottom();
}

function showTypingIndicator() {
  const wrapper = document.createElement("div");
  wrapper.className = "message-wrapper ai";
  wrapper.id = "typingIndicator";
  wrapper.innerHTML = `
    <div class="avatar ai">⬡</div>
    <div class="message-bubble">
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>`;
  chatArea.appendChild(wrapper);
  scrollToBottom();
}

function removeTypingIndicator() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

// ── Send message ─────────────────────────────────────────────────────────────
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || isLoading) return;

  // Create session on first message
  if (!currentSessionId) createSession(text);

  // Update UI
  userInput.value = "";
  resizeTextarea();
  isLoading = true;
  sendBtn.disabled = true;

  // Show user message
  appendMessage("user", text);

  // Update history
  conversationHistory.push({ role: "user", content: text });

  // Typing indicator
  showTypingIndicator();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversationHistory }),
    });

    const data = await response.json();
    removeTypingIndicator();

    if (!response.ok) {
      appendError(data.error || "An error occurred. Please try again.");
    } else {
      appendMessage("ai", data.reply);
      conversationHistory.push({ role: "assistant", content: data.reply });
      saveCurrentSession();

      // ── Update model badge with which Gemini model was used ──
      if (data.model) {
        const badge = document.getElementById("modelBadge");
        if (badge) badge.textContent = "⚡ " + data.model;
      }
    }

  } catch (err) {
    removeTypingIndicator();
    const msg = err.name === "TypeError"
      ? "Cannot connect to server. Make sure it's running."
      : "Network error. Please check your connection.";
    appendError(msg);
  } finally {
    isLoading = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
}

// ── Event listeners ──────────────────────────────────────────────────────────
sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Auto-resize textarea
function resizeTextarea() {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 180) + "px";
}
userInput.addEventListener("input", resizeTextarea);

// ── Suggestion pills ─────────────────────────────────────────────────────────
function bindPills() {
  document.querySelectorAll(".pill").forEach(pill => {
    pill.addEventListener("click", () => {
      userInput.value = pill.dataset.text;
      resizeTextarea();
      sendMessage();
    });
  });
}

// ── Utilities ────────────────────────────────────────────────────────────────
function scrollToBottom() {
  chatArea.scrollTop = chatArea.scrollHeight;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ── Init ─────────────────────────────────────────────────────────────────────
initTheme();
bindPills();
userInput.focus();
