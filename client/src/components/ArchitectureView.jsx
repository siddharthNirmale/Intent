import React from 'react';
import Badge from './ui/Badge';
import {
  ArrowDown,
  ArrowRight,
  ShieldCheck,
  Server,
  Layers,
  Database,
  Cpu,
  CheckCircle,
} from 'lucide-react';

export const ArchitectureView = () => {
  return (
    <div className="space-y-12 max-w-4xl">
      {/* Overview */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
          Clean MERN + AI Intent Compiler Architecture
        </h2>
        <p className="text-xs text-zinc-500 leading-relaxed max-w-2xl">
          A modern developer tool foundation separating the React client and Express API, with stateless JWT authentication and an extensible pipeline for compiling developer intent into coding-agent execution.
        </p>
      </div>

      {/* 1. MERN Request Flow */}
      <div className="bg-zinc-50/80 p-6 rounded-2xl space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Authentication & Request Lifecycle
            </span>
            <Badge variant="primary">MERN Pipeline</Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Stateless JSON Web Tokens with bcrypt password hashing and express middleware.
          </p>
        </div>

        {/* Pipeline Diagram Cards - Zero Borders */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Step 1 */}
          <div className="bg-white p-4 rounded-xl shadow-subtle space-y-2">
            <span className="text-[10px] font-mono text-zinc-400 block uppercase">
              Step 1 • Client
            </span>
            <p className="font-semibold text-zinc-900">React Frontend</p>
            <p className="text-[11px] text-zinc-500 leading-normal">
              Collects user credentials or intent prompt. Injects JWT in Bearer Authorization header.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-4 rounded-xl shadow-subtle space-y-2">
            <span className="text-[10px] font-mono text-zinc-400 block uppercase">
              Step 2 • Gateway
            </span>
            <p className="font-semibold text-zinc-900">Express API Router</p>
            <p className="text-[11px] text-zinc-500 leading-normal">
              Validates payload format, applies CORS rules, routes to /api/auth or /api/intent.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-4 rounded-xl shadow-subtle space-y-2">
            <span className="text-[10px] font-mono text-zinc-400 block uppercase">
              Step 3 • Security
            </span>
            <p className="font-semibold text-zinc-900">JWT Middleware</p>
            <p className="text-[11px] text-zinc-500 leading-normal">
              Verifies token signature via jsonwebtoken. Rehydrates authenticated req.user without exposing password hash.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-4 rounded-xl shadow-subtle space-y-2">
            <span className="text-[10px] font-mono text-zinc-400 block uppercase">
              Step 4 • Persistence
            </span>
            <p className="font-semibold text-zinc-900">Mongoose / Mongo</p>
            <p className="text-[11px] text-zinc-500 leading-normal">
              Executes schema-enforced queries. Hashes passwords on save hook with salt factor 10.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Future Product Flow: AI Intent Compiler */}
      <div className="bg-zinc-50/80 p-6 rounded-2xl space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Future Product Architecture
            </span>
            <Badge variant="success">AI Intent Compiler</Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            How developer natural language translates into deterministic coding agent tasks.
          </p>
        </div>

        {/* Step-by-step product hierarchy */}
        <div className="space-y-2">
          {[
            {
              step: 'Developer',
              desc: 'Enters raw, messy, or contradictory technical instructions.',
              tag: 'Input Stage',
            },
            {
              step: 'Intent Compiler Engine',
              desc: 'Parses semantics, detects missing constraints, resolves ambiguities, reads project rules (AGENTS.md).',
              tag: 'Analysis Stage',
            },
            {
              step: 'Structured Task Plan',
              desc: 'Breaks execution into atomic, verifiable steps with explicit target files and criteria.',
              tag: 'Decomposition',
            },
            {
              step: 'Target Coding Agent',
              desc: 'Dispatches targeted prompts to Claude Code, Cursor, Cline, or Codex.',
              tag: 'Dispatch',
            },
            {
              step: 'Verification & Diff',
              desc: 'Reviews generated patch diffs against original project rules before applying.',
              tag: 'Validation',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-3.5 rounded-xl shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-mono text-zinc-600">
                  {idx + 1}
                </span>
                <div>
                  <span className="font-medium text-xs text-zinc-900">
                    {item.step}
                  </span>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 self-start sm:self-auto">
                {item.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Folder Separation Reference */}
      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
          Clean Directory Separation
        </span>
        <div className="bg-zinc-50/80 p-5 rounded-2xl">
          <pre className="font-mono text-xs text-zinc-800 leading-relaxed overflow-x-auto pb-2">
{`project/
├── client/                     # Vite + React (JavaScript, Tailwind, Zero-border UI)
│   ├── src/
│   │   ├── api/                # Token injection & REST client
│   │   ├── context/            # AuthContext state provider
│   │   ├── components/         # Studio, Navbar, AuthModal, Flat UI
│   │   └── index.css           # Clean white-first baseline
│   └── package.json            # Separate client dependencies
│
├── server/                     # Node.js + Express (JavaScript, Mongoose, JWT)
│   ├── config/db.js            # Resilient MongoDB connector
│   ├── controllers/            # authController, intentController
│   ├── middleware/             # authMiddleware (Bearer verification)
│   ├── models/                 # User.js, IntentTask.js
│   ├── routes/                 # authRoutes.js, intentRoutes.js
│   ├── utils/generateToken.js  # JWT signing helper
│   ├── server.js               # Express application entry
│   └── package.json            # Separate server dependencies
│
├── .gitignore                  # Clean root ignoring node_modules & .env
└── README.md                   # Setup and API documentation`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureView;
