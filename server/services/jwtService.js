const jwt = require('jsonwebtoken');

/**
 * JWT Service - handles JWT generation and validation
 * Uses HS256 algorithm with JWT_SECRET from environment variables
 */

/**
 * Generate an access token with 1 hour expiration
 * @param {Object} payload - Token payload containing email and name
 * @param {string} payload.email - User email address
 * @param {string} payload.name - User display name
 * @returns {string} Signed JWT token
 * @throws {Error} If JWT_SECRET is not configured
 */
const generateAccessToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  // Generate token with 1 hour expiration
  const token = jwt.sign(
    {
      email: payload.email,
      name: payload.name
    },
    secret,
    {
      algorithm: 'HS256',
      expiresIn: '1h'
    }
  );
  
  return token;
};

/**
 * Generate a temporary token for 2FA flow with 5 minute expiration
 * @param {Object} payload - Token payload containing email and name
 * @param {string} payload.email - User email address
 * @param {string} payload.name - User display name
 * @returns {string} Signed temporary JWT token
 * @throws {Error} If JWT_SECRET is not configured
 */
const generateTempToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  // Generate temporary token with 5 minute expiration and temp flag
  const token = jwt.sign(
    {
      email: payload.email,
      name: payload.name,
      temp: true // Flag to indicate this is a temporary token requiring 2FA completion
    },
    secret,
    {
      algorithm: 'HS256',
      expiresIn: '5m'
    }
  );
  
  return token;
};

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid, expired, or JWT_SECRET is not configured
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  try {
    // Verify token signature and expiration
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256']
    });
    
    return decoded;
  } catch (error) {
    // Re-throw with more specific error messages
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw error;
    }
  }
};

module.exports = {
  generateAccessToken,
  generateTempToken,
  verifyToken
};
