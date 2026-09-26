import jwt from 'jsonwebtoken';

/**
 * Generate JWT token for user authentication
 * @param {string} userId - Mongo user ID
 * @param {string} role - User role
 * @returns {string} JWT Token
 */
export const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'stocksense_jwt_secret_key_hackathon_2026',
    {
      expiresIn: process.env.JWT_EXPIRE || '30d',
    }
  );
};
