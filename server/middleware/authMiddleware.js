const jwtService = require('../services/jwtService');

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header and attaches user data to request
 * 
 * Expected header format: Authorization: Bearer <token>
 * 
 * On success: Attaches req.user = { email, name }
 * On failure: Returns 401 Unauthorized with error message
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Extract Authorization header
    const authHeader = req.headers.authorization;
    
    // Check if Authorization header exists
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authorization header required'
      });
    }
    
    // Check if header follows Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid authorization format. Expected: Bearer <token>'
      });
    }
    
    // Extract token (remove "Bearer " prefix)
    const token = authHeader.substring(7);
    
    // Check if token is present after Bearer prefix
    if (!token || token.trim() === '') {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Token not provided'
      });
    }
    
    // Verify token using jwtService
    const decoded = jwtService.verifyToken(token);
    
    // Attach user data to request object
    req.user = {
      email: decoded.email,
      name: decoded.name
    };
    
    // Continue to next middleware/route handler
    next();
  } catch (error) {
    // Handle JWT verification errors
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: error.message || 'Invalid or expired token'
    });
  }
};

module.exports = authMiddleware;
