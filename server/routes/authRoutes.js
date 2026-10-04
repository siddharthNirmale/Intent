import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  getApiKey,
  updateApiKey,
  clearApiKey,
  logoutUser,
} from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';
import { authLimiter, apiKeyLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes (Rate-limited against brute force and automated registration)
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/logout', logoutUser);

// Protected routes (Require authentication & authorization)
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/api-key', protect, getApiKey);
router.put('/api-key', protect, apiKeyLimiter, updateApiKey);
router.delete('/api-key', protect, apiKeyLimiter, clearApiKey);

export default router;
