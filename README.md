# ⬡ Aether — Full-Stack AI Chatbot

A production-quality ChatGPT-style chatbot built with **Node.js + Express** on the backend and vanilla **HTML/CSS/JS** on the frontend. Ready to extend with image generation, internet search, and AI agent tools.

---

## ✨ Features

- 💬 Full chat UI (user right, AI left) with Markdown rendering
- 🌙 Dark / Light mode toggle (persisted in localStorage)
- ⌨️ Animated typing indicator
- 🕐 Session history in the sidebar
- 📱 Mobile-friendly responsive design
- ⚠️ Graceful error handling (bad API key, no internet, rate limits)
- 🧩 Stub routes for image gen, web search, and AI agents

---

## 📁 Project Structure

```
chatgpt-clone/
├── server.js               ← Express entry point
├── package.json
├── .env.example            ← Copy → .env and add your key
├── .gitignore
│
├── src/
│   ├── openaiClient.js     ← Shared OpenAI client
│   └── routes/
│       ├── chat.js         ← POST /api/chat  (active)
│       ├── image.js        ← POST /api/image (stub)
│       ├── search.js       ← POST /api/search (stub)
│       └── agent.js        ← POST /api/agent (stub)
│
└── public/                 ← Static frontend
    ├── index.html
    ├── style.css
    └── app.js
```

---

## 🚀 Quick Start

### 1 — Install Node.js

Download from [nodejs.org](https://nodejs.org) (LTS recommended).

### 2 — Install dependencies

```bash
cd chatgpt-clone
npm install
```

### 3 — Add your OpenAI API key

```bash
# Copy the template
cp .env.example .env
```

Open `.env` and replace the placeholder:
```
OPENAI_API_KEY=sk-...your-key-here...
```

Get a key at → https://platform.openai.com/api-keys

### 4 — Run the server

```bash
# Production
npm start

# Development (auto-reload on save)
npm run dev
```

### 5 — Open the app

Visit **http://localhost:3000** in your browser.

---

## 🔌 API Endpoints

| Method | Route          | Description              | Status  |
|--------|----------------|--------------------------|---------|
| POST   | `/api/chat`    | Chat with gpt-4o-mini    | ✅ Live  |
| POST   | `/api/image`   | Generate image (DALL·E)  | 🔜 Stub |
| POST   | `/api/search`  | Web search via OpenAI    | 🔜 Stub |
| POST   | `/api/agent`   | Run tool-using AI agent  | 🔜 Stub |
| GET    | `/api/health`  | Server health check      | ✅ Live  |

---

## 🔮 Enabling Future Features

### Image Generation
1. Uncomment `const imageRouter = require("./src/routes/image");` in `server.js`
2. Uncomment `app.use("/api/image", imageRouter);`
3. Add a button in the frontend that POSTs to `/api/image`

### Internet Search
1. Uncomment the search router in `server.js`
2. The route uses OpenAI's `web_search_preview` tool — no extra API key needed

### AI Agent Tools
1. Uncomment the agent router in `server.js`
2. Add your custom tool definitions and implementations in `src/routes/agent.js`

---

## 🛡️ Security Notes

- The API key is stored in `.env` — **never commit this file**
- `.gitignore` already excludes `.env`
- The key is only used server-side; the browser never sees it

---

## 🧰 Tech Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Backend   | Node.js + Express             |
| AI        | OpenAI API (gpt-4o-mini)      |
| Frontend  | HTML + CSS + Vanilla JS       |
| Markdown  | marked.js                     |
| Syntax HL | highlight.js                  |
| Fonts     | Syne, Inter, JetBrains Mono   |
