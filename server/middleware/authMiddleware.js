import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getDbStatus } from '../config/db.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, no token provided',
        });
      }

      const secret = process.env.JWT_SECRET || 'intent_compiler_dev_secret_jwt_key_987654321';
      const decoded = jwt.verify(token, secret);

      if (!getDbStatus()) {
        return res.status(503).json({
          success: false,
          message: 'Database is currently unreachable. Please check MongoDB connection.',
        });
      }

      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('[Auth Middleware Error]:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token invalid or expired',
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no Bearer token provided in authorization header',
    });
  }
};

/**
 * Optional authentication middleware:
 * Attaches user to req.user if a valid token is provided, but does not block requests if not.
 */
export const optionalAuth = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      if (token) {
        const secret = process.env.JWT_SECRET || 'intent_compiler_dev_secret_jwt_key_987654321';
        const decoded = jwt.verify(token, secret);

        if (getDbStatus()) {
          const user = await User.findById(decoded.id)
            .select('-password +apiKeys.gemini.encryptedKey +apiKeys.gemini.iv +apiKeys.gemini.authTag');
          if (user) {
            req.user = user;
          }
        }
      }
    } catch {
      // Quietly ignore invalid tokens for optional auth endpoints
    }
  }
  next();
};

export default protect;

