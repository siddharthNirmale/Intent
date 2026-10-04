import express from 'express';
import {
  compileIntent,
  getIntentTasks,
  getSupportedAgents,
} from '../controllers/intentController.js';
import protect from '../middleware/authMiddleware.js';
import { compileLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Supported AI coding agents
router.get('/agents', getSupportedAgents);

// Compile intent (Strictly protected by authentication, authorization, and rate limiting)
router.post('/compile', protect, compileLimiter, compileIntent);

// Protected endpoint to retrieve history (Strict data isolation: only current user's tasks)
router.get('/tasks', protect, getIntentTasks);

export default router;
