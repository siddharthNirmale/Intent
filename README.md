# Intent Studio — AI Intent Compiler

[![Live Demo](https://img.shields.io/badge/Demo-intent--tau.vercel.app-black?style=flat&logo=vercel)](https://intent-tau.vercel.app)
[![Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Vite%20%2B%20Tailwind-emerald?style=flat)](https://github.com)
[![Inference](https://img.shields.io/badge/Inference-Groq%20Cloud-orange?style=flat)](https://groq.com)
[![Security](https://img.shields.io/badge/Encryption-AES--256--GCM-zinc?style=flat)](https://nodejs.org/api/crypto.html)

> **Built for Hackathon Submission**  
> A dedicated developer workbench that translates ambiguous human intent, raw specs, and terminal errors into structured, high-precision execution directives for autonomous coding agents (Antigravity, Cursor, Claude Code, and Codex).

---

## The Problem

Autonomous coding agents are powerful, but they are only as good as the prompt they receive:

* **Vague Human Instructions**: Developers type messy prompts like *"fix authentication"* or *"add users table"*, which leads agents into hallucinated architectures, circular edits, and broken builds.
* **Unwanted Refactoring**: Agents frequently overstep their mandate—unnecessarily modifying `package.json`, rewriting working utility files, or altering public API signatures.
* **Context Blindness**: Raw error logs pasted into an agent lack domain scope, reproduction parameters, and verification constraints.

---

## The Solution: Intent Studio

**Intent Studio** acts as an **Intent Compiler**—a deterministic compilation layer between human thought and autonomous coding agents.

```mermaid
flowchart LR
    A[Human Thought / Error Log] --> B[Intent Compiler]
    B -->|De-ambiguate| C[Target Agent Profile]
    B -->|Apply Guardrails| D[Surgical Directives]
    C --> E[Actionable Agent Command]
    D --> E
    E --> F[Coding Agent: Antigravity / Cursor / Claude Code]
    F --> G[Verified Output: Zero Hallucination]
```

Instead of sending messy prompts directly to an agent, developers run them through Intent Studio to:
1. **Disambiguate Intent**: Automatically identify missing technical requirements, inferred dependencies, and edge cases.
2. **Inject Strict Guardrails**: Prevent agents from touching unrelated files, preserving API signatures and existing test suites.
3. **Format for Target Agent**: Structure the prompt specifically for the selected agent's execution style (Antigravity, Cursor, Claude Code, Codex).

---

## Key Features

### 1. Dual Specialized Compiler Modes
* **Initial Build Mode**:
  * **Tech Stack Inference**: Incurs technology choices (MERN, Next.js 15, FastAPI, Go Gin, Bun Elysia) directly from prompt context or manual specification.
  * **Design & Theme Contextualization**: Injects UI tokens, minimal palettes, and design baselines.
  * **Dependency Guardrails**: Restricts agents to curated libraries (Tailwind, Mongoose, Zod, TanStack Query).
  * **Precision Control**: Configurable temperature slider from strict (0.0) to creative (1.0).
* **Command Fix Mode**:
  * **Fix Strategy Selection**: Surgical Patch (minimal edits, zero refactor), Root-Cause Fix, Defensive Guard, or Diagnostic Trace.
  * **Issue Domain Scoping**: Backend/API, Frontend/DOM, Database/Storage, Process/Lifecycle (`EADDRINUSE`), or Build/Bundler.
  * **Automated Verification**: Generates explicit verification instructions for the agent (command exit code checks, reproduction steps).
  * **Safety Guardrails**: Automatically appends constraints like *"Preserve existing API signatures"*, *"Do not touch package.json dependencies"*, and *"Preserve working code & file structure"*.

### 2. High-Speed AI Inference (Groq Cloud)
* Utilizes ultra-fast Groq LPU inference (`openai/gpt-oss-120b`, `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`).
* **Zero Conversational Fluff**: System instructions strip preamble (`"Here is your command..."`) and markdown wrappers, outputting pure, copy-ready agent prompts.
* Automatic fallback to a local rule-based compilation engine if external networks are unreachable.

### 3. Zero Client-Side Secret Storage & AES-256-GCM
* API keys are **never stored** in `localStorage`, `sessionStorage`, or cookies.
* Personal keys are validated live against Groq's models API, encrypted at rest using **AES-256-GCM** authenticated encryption with scrypt key derivation on the server.
* Includes a built-in 3-attempt free trial quota with seamless bring-your-own-key (BYOK) for unlimited compilations.

### 4. Minimalist, White-First Developer UX
* **Zero visible borders**, zero glow/neon, and zero decorative AI fluff.
* **Keyboard-First Workflow**: `⌘↵` / `Ctrl+↵` to compile.
* **Smart Auto-Clear**: Automatically wipes the prompt when switching sections (`Initial Build` ↔ `Command Fix`, Studio ↔ Settings) or on page reload, preventing stale prompt leakage.
* **Clear Buttons**: Dedicated clear buttons both inside the input field and on the toolbar.

---

## System Architecture

```text
Intent Studio/
├── client/                          # Frontend SPA (React 18 + Vite)
│   ├── src/
│   │   ├── api/client.js            # Centralized API client with JWT injection & dual fallback
│   │   ├── components/
│   │   │   ├── IntentCompiler/      # CompilerStudio workbench & parameter drawers
│   │   │   ├── ui/                  # Zero-border UI primitives (PromptBox, Button, Input)
│   │   │   └── Navbar.jsx           # Clean header with auth state & account management
│   │   ├── context/                 # AuthContext (JWT session) & RouterContext (Hash/Path)
│   │   ├── pages/SettingsPage.jsx   # BYOK Groq API key configuration & account profile
│   │   └── index.css                # White-first utility design system
│   └── vercel.json                  # Edge rewrites for SPA routing & same-origin /api proxy
│
└── server/                          # Backend API (Node.js + Express)
    ├── config/db.js                 # Serverless Mongoose connection pooling & caching
    ├── controllers/
    │   ├── authController.js        # Auth, JWT issuance, profile updates, encrypted BYOK
    │   └── intentController.js      # Intent compiler engine, quota tracking & task storage
    ├── middleware/
    │   ├── authMiddleware.js        # Bearer token verification & optional auth
    │   └── rateLimiter.js           # Sliding-window DDoS & brute-force protection
    ├── models/
    │   ├── User.js                  # User schema with encrypted subdocuments
    │   └── IntentTask.js            # Structured task schema for compiled prompts
    ├── services/
    │   ├── ai/groqService.js        # Multi-model Groq compiler with prompt engineering
    │   └── cryptoService.js         # AES-256-GCM encryption & decryption
    └── server.js                    # Express app with dynamic CORS & serverless export
```

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite | High-performance SPA with instant HMR |
| **Styling** | Vanilla CSS, Tailwind CSS | Custom white-first, zero-border developer design system |
| **Icons** | Lucide React | Clean, lightweight developer iconography |
| **Backend** | Node.js, Express.js | Modular REST API with serverless export |
| **Database** | MongoDB Atlas, Mongoose | Persistent user state, task history, and usage quotas |
| **AI Inference** | Groq Cloud SDK / REST API | Ultra-low latency LLM inference for real-time prompt compilation |
| **Security** | JSON Web Tokens (JWT), bcryptjs | Stateless auth & password hashing |
| **Encryption** | Node.js Crypto (`aes-256-gcm`) | Military-grade authenticated encryption for personal API keys |
| **Deployment** | Vercel Serverless Functions | Decoupled client & serverless backend deployments |

---

## Getting Started (Local Development)

### Prerequisites
* **Node.js** >= 18.0.0
* **npm** >= 9.0.0
* **MongoDB** (Local instance or free [MongoDB Atlas](https://cloud.mongodb.com/) cluster)
* *(Optional)* A free [Groq API Key](https://console.groq.com/keys)

---

### Step 1: Clone Repository
```bash
git clone https://github.com/siddharthNirmale/Intent.git
cd Intent
```

---

### Step 2: Backend Setup
```bash
cd server
npm install
```

Create a `.env` file inside `server/` (or copy from `.env.example`):
```bash
cp .env.example .env
```

Configure your `server/.env`:
```env
PORT=5000
NODE_ENV=development

# MongoDB Connection String (Atlas or Local)
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/intent_compiler?retryWrites=true&w=majority

# Authentication Secrets
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
ENCRYPTION_SECRET=your_aes256_encryption_secret_key_32bytes

# Allowed Frontend Origins for CORS
CLIENT_URL=http://localhost:5173

# Groq Cloud API Key
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
```

Start the backend server:
```bash
# Development mode with auto-reload
npm run dev
```
The API will start at `http://localhost:5000` (Health check: `http://localhost:5000/api/health`).

---

### Step 3: Frontend Setup
In a separate terminal:
```bash
cd client
npm install
```

Create `client/.env.local` (optional for local dev, as Vite proxies `/api` to port 5000):
```env
VITE_API_URL=http://localhost:5000/api
```

Start the development server:
```bash
npm run dev
```
Open [`http://localhost:5173`](http://localhost:5173) in your browser.

---

## Environment Variables Reference

### Backend (`server/.env`)
| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (defaults to `5000`) |
| `NODE_ENV` | Yes | `development` or `production` |
| `MONGO_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Secret key used to sign authentication tokens |
| `JWT_EXPIRE` | No | Token expiration duration (defaults to `30d`) |
| `ENCRYPTION_SECRET` | Yes | Secret used for AES-256-GCM API key encryption |
| `CLIENT_URL` | Yes | Allowed CORS origins (comma-separated for multiple) |
| `GROQ_API_KEY` | Recommended | Server fallback key for free-trial users |
| `GROQ_MODEL` | No | Default model (defaults to `openai/gpt-oss-120b`) |

### Frontend (`client/.env.production`)
| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes (Prod) | Base URL pointing to deployed backend API |

---

## API Endpoints Overview

### Health Check
* `GET /api/health` — Returns server uptime and MongoDB connection state (`connected` / `offline`).

### Authentication (`/api/auth`)
* `POST /api/auth/register` — Create account with name, email, and password.
* `POST /api/auth/login` — Sign in and obtain JWT Bearer token.
* `GET /api/auth/me` — Retrieve authenticated user profile and remaining attempt quota.
* `PUT /api/auth/profile` — Update account profile details and avatar.
* `GET /api/auth/api-key` — Check personal API key status (never exposes the raw key).
* `PUT /api/auth/api-key` — Validate and securely encrypt user's personal Groq API key.
* `DELETE /api/auth/api-key` — Remove saved personal API key.
* `POST /api/auth/logout` — Invalidate client-side session.

### Intent Compiler (`/api/intent`)
* `POST /api/intent/compile` — Compile instructions into structured coding agent prompts.
* `GET /api/intent/agents` — Fetch supported AI agents (Antigravity, Claude Code, Cursor, Codex).
* `GET /api/intent/tasks` — Fetch user's compiled prompt history.

---

## Hackathon Innovation & Value Proposition

1. **Solving the "Agent Steering" Bottleneck**: While hundreds of hackathon projects build wrappers *around* LLMs, **Intent Studio** focuses on the input bottleneck—ensuring the instructions fed to coding agents produce working code on the first attempt without hallucinations.
2. **Speed & Latency**: By partnering prompt compilation with **Groq LPU hardware**, prompt refinement happens in sub-second timeframes (~300ms–800ms), fitting naturally into real developer workflows.
3. **Security-First Architecture**: Implements true authenticated encryption (AES-256-GCM) and stateless token flows rather than leaving developer credentials in client storage.
4. **Resilient Production Engineering**: Incorporates serverless connection pooling, graceful fallback rule engines, automated preflight CORS handling, and Vercel edge reverse proxies.

---

## Future Roadmap & Scalability

* [ ] **IDE Extensions**: Direct integration with VS Code and Cursor extension marketplaces.
* [ ] **CLI Tool (`intent-cli`)**: Direct terminal pipe `intent "add stripe webhooks" | cursor --agent`.
* [ ] **Repo Context Ingestion**: Automatic parsing of `README.md` and `package.json` from GitHub URLs to auto-populate framework constraints.
* [ ] **Multi-Agent Evaluation**: Side-by-side prompt testing across multiple target agents simultaneously.

---

## License

This project is licensed under the MIT License. Built for the developer community.
