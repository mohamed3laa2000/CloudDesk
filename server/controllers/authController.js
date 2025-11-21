const firebaseAdmin = require('../services/firebaseAdmin');
const jwtService = require('../services/jwtService');
const dbService = require('../services/dbService');

/**
 * Auth controller - handles authentication business logic
 */

/**
 * Login endpoint - verifies Firebase ID token and generates JWT
 * @route POST /api/auth/login
 * @param {Object} req.body.idToken - Firebase ID token from client
 * @returns {Object} JWT access token and user data
 */
const login = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    // Validate request body
    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Firebase ID token is required'
      });
    }

    // Step 1: Verify Firebase ID token using Firebase Admin service
    let decodedToken;
    try {
      decodedToken = await firebaseAdmin.verifyIdToken(idToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: error.message || 'Invalid Firebase token'
      });
    }

    // Step 2: Extract email and name from verified token
    const { email, name } = decodedToken;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Email not found in Firebase token'
      });
    }

    // Step 3: Query database to check if email is approved
    let isApproved;
    try {
      isApproved = await dbService.isEmailApproved(email);
    } catch (error) {
      console.error('Database error during email approval check:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Step 4: Return 403 if email not approved with error message
    if (!isApproved) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Access Denied: Your email is not authorized'
      });
    }

    // Step 5: Check if user has 2FA enabled
    let twoFAStatus;
    try {
      twoFAStatus = await dbService.get2FAStatus(email);
    } catch (error) {
      console.error('Database error during 2FA status check:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Step 6: If 2FA is enabled, return temp token instead of full JWT
    if (twoFAStatus.enabled) {
      let tempToken;
      try {
        tempToken = jwtService.generateTempToken({ email, name });
      } catch (error) {
        console.error('Error generating temp token:', error);
        return res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to generate temporary token'
        });
      }

      // Return temp token and indicate 2FA is required
      return res.status(200).json({
        success: true,
        requires2FA: true,
        tempToken,
        user: {
          email,
          name
        }
      });
    }

    // Step 7: Generate full JWT if 2FA is not enabled
    let accessToken;
    try {
      accessToken = jwtService.generateAccessToken({ email, name });
    } catch (error) {
      console.error('Error generating JWT:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to generate access token'
      });
    }

    // Step 8: Update last_login timestamp in database
    try {
      await dbService.updateLastLogin(email);
    } catch (error) {
      // Log error but don't fail the login if timestamp update fails
      console.error('Error updating last login timestamp:', error);
    }

    // Step 9: Set JWT in httpOnly cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour in milliseconds
    });

    // Step 10: Return JWT and user data in response
    return res.status(200).json({
      success: true,
      accessToken,
      user: {
        email,
        name
      }
    });

  } catch (error) {
    // Pass unexpected errors to error handling middleware
    console.error('Unexpected error in login controller:', error);
    next(error);
  }
};

/**
 * Verify endpoint - validates JWT token
 * @route POST /api/auth/verify
 * @returns {Object} User data if token is valid
 */
const verify = async (req, res, next) => {
  try {
    // Step 1: Extract JWT from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authorization header with Bearer token is required'
      });
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'JWT token is required'
      });
    }

    // Step 2: Validate JWT using JWT service
    let decoded;
    try {
      decoded = jwtService.verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: error.message || 'Invalid or expired token'
      });
    }

    // Step 3: Return user data if valid
    return res.status(200).json({
      success: true,
      user: {
        email: decoded.email,
        name: decoded.name
      }
    });

  } catch (error) {
    // Pass unexpected errors to error handling middleware
    console.error('Unexpected error in verify controller:', error);
    next(error);
  }
};

/**
 * Logout endpoint - clears httpOnly cookie
 * @route POST /api/auth/logout
 * @returns {Object} Success message
 */
const logout = async (req, res, next) => {
  try {
    // Clear the httpOnly cookie by setting it with maxAge 0
    res.cookie('accessToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0 // Expire immediately
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    // Pass unexpected errors to error handling middleware
    console.error('Unexpected error in logout controller:', error);
    next(error);
  }
};

module.exports = {
  login,
  verify,
  logout
};
