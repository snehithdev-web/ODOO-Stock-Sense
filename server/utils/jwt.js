import jwt from 'jsonwebtoken';

/**
 * Read the configured signing key.
 *
 * config/env.js refuses to boot when JWT_SECRET is missing, so by the time
 * anything here runs the variable is guaranteed to be set. The check is kept
 * anyway so a direct import of this module still fails loudly rather than
 * signing with an empty secret.
 */
export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not set.');
  }

  return secret;
};

/**
 * Generate JWT token for user authentication
 * @param {string} userId - Mongo user ID
 * @param {string} role - User role
 * @returns {string} JWT Token
 */
export const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};
