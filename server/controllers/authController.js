import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { getDbStatus } from '../config/db.js';

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

    // Check for user (explicitly selecting password field which is hidden by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

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
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar || '',
        createdAt: req.user.createdAt,
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
 * @desc    Get API key status & masked value
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

    const user = await User.findById(req.user._id).select('+apiKey');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const key = user.apiKey || '';
    const hasKey = Boolean(key);
    const maskedKey = key && key.length > 8 ? `${key.slice(0, 4)}••••••••${key.slice(-4)}` : key ? '••••••••' : '';

    return res.status(200).json({
      success: true,
      hasKey,
      maskedKey,
      apiKey: key,
    });
  } catch (error) {
    console.error('[Get API Key Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving API key',
    });
  }
};

/**
 * @desc    Update or clear API key
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
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.apiKey = typeof apiKey === 'string' ? apiKey.trim() : '';
    await user.save();

    const key = user.apiKey || '';
    const hasKey = Boolean(key);
    const maskedKey = key && key.length > 8 ? `${key.slice(0, 4)}••••••••${key.slice(-4)}` : key ? '••••••••' : '';

    return res.status(200).json({
      success: true,
      message: hasKey ? 'API key updated successfully' : 'API key cleared',
      hasKey,
      maskedKey,
      apiKey: key,
    });
  } catch (error) {
    console.error('[Update API Key Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating API key',
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
