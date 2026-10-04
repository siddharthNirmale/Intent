# Intent Studio — AI Intent Compiler

A modern AI developer tool foundation built using a clean, separated **MERN architecture** (React + Express + Node.js + MongoDB + Mongoose) and a minimalist, white-first developer interface with zero borders and zero glow.

---

## Architecture Overview

```text
project/
│
├── client/                     # Frontend (React 18, Vite, JavaScript, Tailwind CSS)
│   ├── src/
│   │   ├── api/                # API client with automatic JWT injection
│   │   ├── context/            # React AuthContext for user session state
│   │   ├── components/         # Studio, Navbar, AuthModal, zero-border UI primitives
│   │   ├── App.jsx             # Main layout & router tabs
│   │   └── index.css           # Clean white-first baseline styling
│   ├── package.json            # Client dependencies
│   └── vite.config.js          # Vite config with /api dev proxy to port 5000
│
├── server/                     # Backend (Node.js, Express.js, MongoDB, Mongoose, JWT)
│   ├── config/
│   │   └── db.js               # Resilient Mongoose connection with status reporting
│   ├── controllers/
│   │   ├── authController.js   # register, login, getMe, logout
│   │   └── intentController.js # AI Intent Compiler pipeline & task persistence
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT verification middleware
│   ├── models/
│   │   ├── User.js             # User schema with bcrypt password hashing
│   │   └── IntentTask.js       # Structured task schema for coding agents
│   ├── routes/
│   │   ├── authRoutes.js       # /api/auth/* endpoints
│   │   └── intentRoutes.js     # /api/intent/* endpoints
│   ├── utils/
│   │   └── generateToken.js    # JWT signing helper
│   ├── server.js               # Express application entrypoint
│   └── package.json            # Server dependencies
│
├── .gitignore                  # Clean root ignoring node_modules & env files
└── README.md
```

---

## Tech Stack

### Frontend
- **React 18** & **Vite**
- **JavaScript** (ES Modules, NO TypeScript)
- **Tailwind CSS** (Custom white-first, zero-border palette)
- **Lucide Icons** (Subtle developer iconography)
- **Zero visible borders**, **No glow / neon**, **No decorative AI graphics**

### Backend
- **Node.js** & **Express.js**
- **JavaScript** (ES Modules, NO TypeScript)
- **MongoDB** & **Mongoose**
- **JSON Web Tokens (JWT)** for stateless authentication
- **bcryptjs** with 10 salt rounds for password hashing
- **CORS** & safe error handling

---

## Getting Started

### 1. Backend Setup

```bash
cd server
npm install
```

Copy the example environment file and configure variables as needed:

```bash
cp .env.example .env
```

Start the backend server:

```bash
# Production start
npm start

# Development mode with nodemon
npm run dev
```

The Express API will start on `http://localhost:5000`.

### 2. Frontend Setup

In a separate terminal:

```bash
cd client
npm install
npm run dev
```

The React Vite application will start on `http://localhost:5173`.

---

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user with name, email, password |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT token |
| `GET` | `/api/auth/me` | Protected | Get profile for currently authenticated user |
| `POST` | `/api/auth/logout` | Public | Clear session on client |

### Intent Compiler (`/api/intent`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/intent/compile` | Public/Auth | Compile messy instructions into structured agent task |
| `GET` | `/api/intent/tasks` | Protected | Fetch user's saved intent compilations |

### Health Check (`/api/health`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Returns server health and database status |

---

## Intent Compiler Pipeline

The project foundation is engineered for the upcoming **AI Intent Compiler for coding agents**:

```text
Developer
   ↓
Messy coding instructions
   ↓
Intent Compiler
   ↓
Understand intent
   ↓
Detect ambiguity
   ↓
Detect contradictions
   ↓
Read project rules
   ↓
Create structured task
   ↓
Agent-specific instructions (Claude Code, Cursor, Cline, Codex)
   ↓
Coding Agent
   ↓
Code / Diff
   ↓
Verification
```

---

## Design System Rules
- **No Borders**: Visual hierarchy is created through comfortable spacing, typography, and subtle tonal shifts (`#ffffff`, `#fafafa`, `#f4f4f5`).
- **No Glow / Neon**: Professional, quiet, distraction-free environment.
- **No Decorative AI Graphics**: No floating blobs, particles, or fake neural nets.
- **Minimalist, White-First**: Crisp typography, high contrast text, calm developer aesthetic.
