# 🧠 DSA Mentor — *Think · Solve · Master*

> An AI-powered **Data Structures & Algorithms** mentor that **teaches you how to think**, instead of dumping ready-made solutions. Built with a modern **serverless JAMstack** architecture and powered by **Google Gemini 2.5 Flash** via the Lovable AI Gateway.

🔗 **Live App:** https://dsamentorai.lovable.app

---

## 📌 Table of Contents
1. [Problem Statement](#-problem-statement)
2. [Solution](#-solution)
3. [Key Features](#-key-features)
4. [Novelty](#-novelty)
5. [Architecture](#-architecture)
6. [Tech Stack](#-tech-stack)
7. [Project Structure](#-project-structure)
8. [Workflow / Request Lifecycle](#-workflow--request-lifecycle)
9. [Getting Started](#-getting-started)
10. [Environment Variables](#-environment-variables)
11. [Deployment](#-deployment)
12. [Future Scope](#-future-scope)

---

## 🎯 Problem Statement
Students learning DSA often paste questions into ChatGPT/Google and receive **direct answers**, which:
- Kills independent problem-solving ability
- Provides no **progressive hints** (concept → approach → pseudocode → code)
- Does not enforce **DSA-only scope** (general chatbots get distracted)
- Does not understand the **student's own code** in context

---

## 💡 Solution
**DSA Mentor** is a focused, guided AI tutor that:
- Strictly answers **only DSA-related** queries (Arrays, Trees, DP, Graphs, etc.)
- Reviews the **user's live code** from a built-in editor
- **Streams** answers token-by-token for an interactive feel
- Uses a **strong system prompt** to enforce mentoring behavior, complexity analysis, and clarification over guessing

---

## ✨ Key Features
| Feature | Description |
|---|---|
| 💬 **Real-time Chat** | SSE-based token streaming for instant feedback |
| 👨‍💻 **Live Code Editor** | Multi-language editor (Java, Python, C++, JS) with syntax highlighting |
| 🎯 **DSA-Locked Scope** | Refuses non-DSA queries — built into system prompt |
| 🧠 **Code-Aware Mentoring** | Editor contents are auto-injected into the latest user message |
| ⚡ **One-Click Starters** | Sliding window, Graph traversal, DP intuition, Code review |
| ⏹ **Stop Generation** | Cancel mid-stream via `AbortController` |
| 📊 **Auto Complexity Analysis** | Time + space complexity included where applicable |
| 🎨 **Polished UI** | Resizable split-pane, dark theme, semantic design tokens |

---

## 🌟 Novelty
1. **Mentor, not solver** — teaches *thinking* via Socratic hints
2. **Editor + chat in one screen** — code context flows automatically into the AI
3. **Domain-locked LLM** — system prompt blocks off-topic drift (a common AI tutor failure)
4. **Zero-backend deployment** — fully serverless, scales to zero, no DB to maintain
5. **Streaming UX** — feels like a live human tutor typing back

---

## 🏛️ Architecture

This project follows a **Serverless JAMstack architecture** with a **streaming AI inference layer**.

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1 — Presentation (Browser)                           │
│  React 18 · Vite · Tailwind · shadcn/ui                     │
│  • ChatPanel  • CodeEditor  • streamChat.ts (SSE reader)    │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS POST + SSE
┌──────────────────────────▼──────────────────────────────────┐
│  Layer 2 — Edge / API (Supabase Edge Function · Deno)       │
│  /functions/v1/dsa-chat                                     │
│  • Injects SYSTEM_PROMPT  • Attaches editor code            │
│  • Forwards to AI gateway with Bearer token                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS POST (stream=true)
┌──────────────────────────▼──────────────────────────────────┐
│  Layer 3 — AI Inference (Lovable AI Gateway)                │
│  Model: google/gemini-2.5-flash                             │
│  • Token-by-token streaming (OpenAI-compatible SSE)         │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Layer 4 — Infrastructure (Lovable Cloud)                   │
│  • Auto-deploy edge functions  • Secret management          │
│  • Global CDN  • Scales to zero                             │
└─────────────────────────────────────────────────────────────┘
```

> ⚠️ **Note:** This is **not a MERN stack** project. There is no MongoDB or Express server. Instead, it uses a **modern serverless pattern**: static React frontend + edge function backend + managed AI gateway.

---

## 🛠️ Tech Stack

**Frontend**
- React 18 + TypeScript 5
- Vite 5 (build tool)
- Tailwind CSS v3 + shadcn/ui
- lucide-react (icons), sonner (toasts)
- Server-Sent Events (native `fetch` + `ReadableStream`)

**Backend (Serverless)**
- Supabase Edge Functions (Deno runtime)
- Lovable AI Gateway (OpenAI-compatible API)

**AI Model**
- `google/gemini-2.5-flash` (streaming)

**Infra**
- Lovable Cloud (one-click deploy + secrets)

---

## 📁 Project Structure
```
dsa_chatbot_v3/
├── src/
│   ├── pages/
│   │   └── Index.tsx              # Main split-view (chat + editor)
│   ├── components/dsa/
│   │   ├── ChatPanel.tsx          # Chat UI + starters + input
│   │   ├── CodeEditor.tsx         # Code editor + language picker
│   │   └── MarkdownMessage.tsx    # Renders AI markdown + code blocks
│   ├── lib/
│   │   └── streamChat.ts          # SSE client → edge function
│   ├── integrations/supabase/     # Auto-generated client
│   └── index.css                  # Design tokens (HSL)
├── supabase/
│   ├── functions/dsa-chat/
│   │   └── index.ts               # Edge function (Deno)
│   └── config.toml
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

---

## 🔄 Workflow / Request Lifecycle

1. **User** types a question (and optionally writes code in the editor)
2. **`Index.tsx`** appends the message to state, calls `streamChat()`
3. **`streamChat.ts`** sends `POST` to the Supabase Edge Function with:
   ```json
   { "messages": [...], "code": "...", "language": "java" }
   ```
4. **Edge function (`dsa-chat`)**:
   - Prepends the **DSA-only system prompt**
   - If code present → appends a fenced code block to the latest user message
   - Forwards to `https://ai.gateway.lovable.dev/v1/chat/completions` with `stream: true`
5. **Gemini 2.5 Flash** streams tokens back as SSE
6. The edge function **pipes the stream** straight to the browser
7. Browser reads chunks, parses `data: {...}` lines, and **appends tokens live** to the assistant message
8. User can **stop** anytime via `AbortController`

Errors handled: `429` (rate limit), `402` (credits exhausted), network failures → toast notifications.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and `bun` or `npm`

### Local Development
```bash
# Install dependencies
bun install      # or: npm install

# Run dev server
bun run dev      # or: npm run dev
```
App runs at **http://localhost:8080**

### Build
```bash
bun run build
bun run preview
```

---

## 🔐 Environment Variables

The `.env` file is **auto-managed by Lovable Cloud** — do **not** edit manually.

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Edge function endpoint |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public anon key (safe in client) |
| `LOVABLE_API_KEY` | **Server-side secret** for AI Gateway (set in Cloud, never in code) |

---

## 🌐 Deployment

This project deploys automatically through **Lovable Cloud**:
- Frontend → global CDN
- Edge function → deployed automatically on every change
- Secrets → managed via Cloud settings

**Live URL:** https://dsamentorai.lovable.app

---

## 🔮 Future Scope
- 📈 Progress tracker & spaced-repetition of solved patterns
- 🏆 Mock interview mode with timer
- 👥 Classroom dashboards for teachers
- 🔊 Voice-based mentoring
- 🧪 In-browser code execution & test-case runner
- 💾 Persisted conversation history (Lovable Cloud DB)

---

## 📝 License
MIT — built with ❤️ on [Lovable](https://lovable.dev).
