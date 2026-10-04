import jwt from 'jsonwebtoken';

/**
 * Generate a JWT access token for an authenticated user
 * @param {string} id - The user ID from database
 * @returns {string} Signed JWT token
 */
export const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'intent_compiler_dev_secret_jwt_key_987654321';
  const expiresIn = process.env.JWT_EXPIRE || '30d';

  return jwt.sign({ id }, secret, {
    expiresIn,
  });
};

export default generateToken;
