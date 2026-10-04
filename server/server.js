import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB, { getDbStatus } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import intentRoutes from './routes/intentRoutes.js';

// Load environment variables
dotenv.config();

// Initialize MongoDB connection pool in background
connectDB().catch((err) => {
  console.warn('[MongoDB Initial Connection Warning]:', err.message);
});

const app = express();

// Allowed Origins logic: supports deployed Vercel domain, previews, env overrides, and local dev
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Mobile apps, curl, Postman, server-to-server

  const clean = origin.trim().replace(/\/+$/, '').toLowerCase();

  // Known production client
  if (clean === 'https://intent-tau.vercel.app') return true;

  // Local development
  if (
    clean === 'http://localhost:5173' ||
    clean === 'http://localhost:3000' ||
    clean === 'http://127.0.0.1:5173' ||
    clean === 'http://localhost:5000'
  ) {
    return true;
  }

  // Allow all Vercel deployment preview and production domains for this project
  if (/^https:\/\/intent.*\.vercel\.app$/.test(clean)) return true;
  if (/^https:\/\/.*-siddharthnirmales-projects\.vercel\.app$/.test(clean)) return true;

  // Environment-configured origins (supports comma-separated list or single URL)
  if (process.env.CLIENT_URL) {
    const list = process.env.CLIENT_URL.split(',').map((u) => u.trim().replace(/\/+$/, '').toLowerCase());
    if (list.includes(clean)) return true;
  }

  return false;
};

// CORS Middleware Configuration
const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS Blocked]: Origin not allowed -> ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-CSRF-Token',
  ],
  optionsSuccessStatus: 200,
};

// Attach CORS
app.use(cors(corsOptions));

// Explicit preflight handler with fallbacks
app.options('*', cors(corsOptions));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serverless DB readiness middleware: ensures Mongoose connection is ready before route handlers execute
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.warn('[DB Middleware Readiness Warning]:', err.message);
  }
  next();
});

// Root informational endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Intent Studio API Server',
    status: 'online',
    database: getDbStatus() ? 'connected' : 'offline',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      intent: '/api/intent',
    },
  });
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: getDbStatus() ? 'connected' : 'offline',
    architecture: 'MERN',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/intent', intentRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Safe Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err.message);

  // Guarantee CORS headers are present on error responses so client can read error JSON
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Only bind HTTP listener in non-serverless standalone mode
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`[Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`[Server] API Base URL: http://localhost:${PORT}/api`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Server Error] Port ${PORT} is already in use.`);
      process.exit(1);
    } else {
      console.error('[Server Error]:', err.message);
    }
  });

  const handleShutdown = () => {
    server.close(() => {
      console.log('[Server] Shutdown complete.');
      process.exit(0);
    });
  };

  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
}

export default app;

