import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getDbStatus, getDbErrorMessage } from '../config/db.js';

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
          message: 'Please sign in to continue.',
        });
      }

      const secret = process.env.JWT_SECRET || 'intent_compiler_dev_secret_jwt_key_987654321';
      const decoded = jwt.verify(token, secret);

      if (!getDbStatus()) {
        return res.status(503).json({
          success: false,
          message: getDbErrorMessage(),
        });
      }

      const user = await User.findById(decoded.id).select(
        '+apiKeys.groq.encryptedKey +apiKeys.groq.iv +apiKeys.groq.authTag +apiKeys.groq.isValid +apiKeys.groq.lastValidatedAt +apiKeys.gemini.encryptedKey +apiKeys.gemini.iv +apiKeys.gemini.authTag +apiKeys.gemini.isValid +apiKeys.gemini.lastValidatedAt'
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Account not found. Please sign in again.',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('[Auth Middleware Error]:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please sign in again.',
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Please sign in to continue.',
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
          const user = await User.findById(decoded.id).select(
            '+apiKeys.groq.encryptedKey +apiKeys.groq.iv +apiKeys.groq.authTag +apiKeys.groq.isValid +apiKeys.groq.lastValidatedAt +apiKeys.gemini.encryptedKey +apiKeys.gemini.iv +apiKeys.gemini.authTag +apiKeys.gemini.isValid +apiKeys.gemini.lastValidatedAt'
          );
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

