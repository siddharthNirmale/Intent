import express from 'express';
import { compileIntent, getIntentTasks } from '../controllers/intentController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / optional auth endpoint to compile intent
router.post('/compile', compileIntent);

// Protected endpoint to retrieve history
router.get('/tasks', protect, getIntentTasks);

export default router;
