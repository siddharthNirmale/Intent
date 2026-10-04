import express from 'express';
import {
  compileIntent,
  getIntentTasks,
  getSupportedAgents,
} from '../controllers/intentController.js';
import protect, { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Supported AI coding agents
router.get('/agents', getSupportedAgents);

// Compile intent with optional authentication (to use user's saved Gemini key if logged in)
router.post('/compile', optionalAuth, compileIntent);

// Protected endpoint to retrieve history
router.get('/tasks', protect, getIntentTasks);

export default router;
