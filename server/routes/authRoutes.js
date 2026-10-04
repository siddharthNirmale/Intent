import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  getApiKey,
  updateApiKey,
  logoutUser,
} from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/api-key', protect, getApiKey);
router.put('/api-key', protect, updateApiKey);

export default router;
