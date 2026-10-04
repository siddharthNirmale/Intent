import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { getDbStatus } from '../config/db.js';
import { encryptApiKey } from '../services/cryptoService.js';
import { validateGeminiKey } from '../services/ai/geminiService.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  try {
    if (!getDbStatus()) {
      return res.status(503).json({
        success: false,
        message: 'Database is currently offline. Please ensure MongoDB is running or configure MONGO_URI in server/.env',
      });
    }

    const { name, email, password } = req.body;

    // Basic Input Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        createdAt: user.createdAt,
      },
      usage: {
        attemptsCount: 0,
        maxFreeAttempts: 3,
        remainingAttempts: 3,
        hasPersonalKey: false,
        trialExhausted: false,
      },
      token,
    });
  } catch (error) {
    console.error('[Register Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again.',
    });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  try {
    if (!getDbStatus()) {
      return res.status(503).json({
        success: false,
        message: 'Database is currently offline. Please ensure MongoDB is running or configure MONGO_URI in server/.env',
      });
    }

    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check for user (explicitly selecting password and apiKeys fields which are hidden by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password +apiKeys.gemini.encryptedKey +apiKeys.gemini.isValid'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials',
      });
    }

    // Check password match
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials',
      });
    }

    const token = generateToken(user._id);
    const hasPersonalKey = Boolean(
      user.apiKeys?.gemini?.encryptedKey &&
      user.apiKeys?.gemini?.isValid !== false
    );
    const attemptsCount = user.usage?.attemptsCount || 0;
    const maxFreeAttempts = user.usage?.maxFreeAttempts || 3;
    const remainingAttempts = Math.max(0, maxFreeAttempts - attemptsCount);
    const trialExhausted = !hasPersonalKey && attemptsCount >= maxFreeAttempts;

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        createdAt: user.createdAt,
      },
      usage: {
        attemptsCount,
        maxFreeAttempts,
        remainingAttempts,
        hasPersonalKey,
        trialExhausted,
      },
      token,
    });
  } catch (error) {
    console.error('[Login Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.',
    });
  }
};

/**
 * @desc    Get current authenticated user profile and usage limits
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const user = req.user;
    const hasPersonalKey = Boolean(
      user.apiKeys?.gemini?.encryptedKey &&
      user.apiKeys?.gemini?.isValid !== false
    );
    const attemptsCount = user.usage?.attemptsCount || 0;
    const maxFreeAttempts = user.usage?.maxFreeAttempts || 3;
    const remainingAttempts = Math.max(0, maxFreeAttempts - attemptsCount);
    const trialExhausted = !hasPersonalKey && attemptsCount >= maxFreeAttempts;

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        createdAt: user.createdAt,
      },
      usage: {
        attemptsCount,
        maxFreeAttempts,
        remainingAttempts,
        hasPersonalKey,
        trialExhausted,
      },
    });
  } catch (error) {
    console.error('[GetMe Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving user profile',
    });
  }
};

/**
 * @desc    Update user profile (name, avatar)
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    if (!getDbStatus()) {
      return res.status(503).json({
        success: false,
        message: 'Database is currently offline.',
      });
    }

    const { name, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (name && typeof name === 'string' && name.trim()) {
      user.name = name.trim();
    }

    if (avatar !== undefined && typeof avatar === 'string') {
      user.avatar = avatar.trim();
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Update Profile Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating profile',
    });
  }
};

/**
 * @desc    Get API key status (Never exposes raw keys)
 * @route   GET /api/auth/api-key
 * @access  Private
 */
export const getApiKey = async (req, res) => {
  try {
    if (!getDbStatus()) {
      return res.status(503).json({
        success: false,
        message: 'Database is currently offline.',
      });
    }

    const user = await User.findById(req.user._id).select(
      '+apiKeys.gemini.encryptedKey +apiKeys.gemini.isValid +apiKeys.gemini.lastValidatedAt'
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const geminiConfig = user.apiKeys?.gemini;
    const hasPersonalKey = Boolean(geminiConfig?.encryptedKey || user.apiKey);
    const isValid = hasPersonalKey ? Boolean(geminiConfig?.isValid) : false;
    const lastValidatedAt = geminiConfig?.lastValidatedAt || null;

    const attemptsCount = user.usage?.attemptsCount || 0;
    const maxFreeAttempts = user.usage?.maxFreeAttempts || 3;
    const remainingAttempts = Math.max(0, maxFreeAttempts - attemptsCount);
    const trialExhausted = !hasPersonalKey && attemptsCount >= maxFreeAttempts;

    // SECURITY: Never return raw API key in response payload
    return res.status(200).json({
      success: true,
      provider: 'gemini',
      hasPersonalKey,
      hasKey: hasPersonalKey, // strictly reflects personal key status
      isValid,
      lastValidatedAt,
      trialStatus: {
        attemptsCount,
        maxFreeAttempts,
        remainingAttempts,
        trialExhausted,
      },
    });
  } catch (error) {
    console.error('[Get API Key Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving API key status',
    });
  }
};

/**
 * @desc    Validate and securely store personal Gemini API key
 * @route   PUT /api/auth/api-key
 * @access  Private
 */
export const updateApiKey = async (req, res) => {
  try {
    if (!getDbStatus()) {
      return res.status(503).json({
        success: false,
        message: 'Database is currently offline.',
      });
    }

    const { apiKey } = req.body;
    const cleanKey = typeof apiKey === 'string' ? apiKey.trim() : '';

    const user = await User.findById(req.user._id).select(
      '+apiKeys.gemini.encryptedKey +apiKeys.gemini.iv +apiKeys.gemini.authTag'
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If key is empty, clear personal key
    if (!cleanKey) {
      if (!user.apiKeys) user.apiKeys = {};
      user.apiKeys.gemini = {
        encryptedKey: '',
        iv: '',
        authTag: '',
        isValid: false,
        lastValidatedAt: null,
      };
      user.apiKey = '';
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Personal Gemini API key cleared successfully',
        provider: 'gemini',
        hasKey: false,
        hasPersonalKey: false,
        isValid: false,
        lastValidatedAt: null,
      });
    }

    // 1. Sanitize input: require valid length, no internal spaces. Avoid overly restrictive hardcoded regex.
    if (cleanKey.length < 10 || cleanKey.length > 512 || /\s/.test(cleanKey)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Google Gemini API key without spaces.',
      });
    }

    // 2. Verify that the key is genuine and usable with Google's API
    const validation = await validateGeminiKey(cleanKey);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error || 'Gemini API key verification failed. Please check your key.',
      });
    }

    // 3. Encrypt the key with AES-256-GCM before database storage
    const encryptedPacket = encryptApiKey(cleanKey);

    if (!user.apiKeys) user.apiKeys = {};
    // Only one personal API key per user: cleanly replace the existing personal key
    user.apiKeys.gemini = {
      encryptedKey: encryptedPacket.encrypted,
      iv: encryptedPacket.iv,
      authTag: encryptedPacket.authTag,
      isValid: true,
      lastValidatedAt: new Date(),
    };
    user.apiKey = ''; // ensure legacy plaintext is cleared
    await user.save();

    const attemptsCount = user.usage?.attemptsCount || 0;
    const maxFreeAttempts = user.usage?.maxFreeAttempts || 3;

    // SECURITY: Never expose raw API key in response
    return res.status(200).json({
      success: true,
      message: 'Personal Gemini API key verified and securely saved',
      provider: 'gemini',
      hasKey: true,
      hasPersonalKey: true,
      isValid: true,
      lastValidatedAt: user.apiKeys.gemini.lastValidatedAt,
      usage: {
        attemptsCount,
        maxFreeAttempts,
        remainingAttempts: Math.max(0, maxFreeAttempts - attemptsCount),
        hasPersonalKey: true,
        trialExhausted: false,
      },
    });
  } catch (error) {
    console.error('[Update API Key Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error saving API key',
    });
  }
};

/**
 * @desc    Clear personal Gemini API key
 * @route   DELETE /api/auth/api-key
 * @access  Private
 */
export const clearApiKey = async (req, res) => {
  try {
    if (!getDbStatus()) {
      return res.status(503).json({
        success: false,
        message: 'Database is currently offline.',
      });
    }

    const user = await User.findById(req.user._id).select(
      '+apiKeys.gemini.encryptedKey +apiKeys.gemini.iv +apiKeys.gemini.authTag'
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.apiKeys) user.apiKeys = {};
    user.apiKeys.gemini = {
      encryptedKey: '',
      iv: '',
      authTag: '',
      isValid: false,
      lastValidatedAt: null,
    };
    user.apiKey = '';
    await user.save();

    const attemptsCount = user.usage?.attemptsCount || 0;
    const maxFreeAttempts = user.usage?.maxFreeAttempts || 3;
    const trialExhausted = attemptsCount >= maxFreeAttempts;

    return res.status(200).json({
      success: true,
      message: 'Personal Gemini API key removed successfully',
      provider: 'gemini',
      hasKey: false,
      hasPersonalKey: false,
      isValid: false,
      lastValidatedAt: null,
      usage: {
        attemptsCount,
        maxFreeAttempts,
        remainingAttempts: Math.max(0, maxFreeAttempts - attemptsCount),
        hasPersonalKey: false,
        trialExhausted,
      },
    });
  } catch (error) {
    console.error('[Clear API Key Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error removing API key',
    });
  }
};

/**
 * @desc    Logout user / clear token on client
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logoutUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};
