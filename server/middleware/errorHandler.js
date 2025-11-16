// Global error handling middleware

const errorHandler = (err, req, res, next) => {
  // Log error in development mode
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Details:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code
    });
  }

  // Handle database connection errors with 503 status
  if (err.code === 'ECONNREFUSED' || 
      err.code === 'ENOTFOUND' || 
      err.code === 'ETIMEDOUT' ||
      err.message?.includes('database') ||
      err.message?.includes('connection')) {
    return res.status(503).json({
      success: false,
      error: 'Service Unavailable',
      message: 'Database service temporarily unavailable'
    });
  }

  // Handle JWT validation errors with 401 status
  if (err.name === 'JsonWebTokenError' || 
      err.name === 'TokenExpiredError' ||
      err.name === 'NotBeforeError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: err.name === 'TokenExpiredError' 
        ? 'Token has expired' 
        : 'Invalid or malformed token'
    });
  }

  // Handle Firebase errors with appropriate status codes
  if (err.code?.startsWith('auth/')) {
    let status = 401;
    let message = 'Authentication failed';

    // Map Firebase error codes to appropriate responses
    switch (err.code) {
      case 'auth/id-token-expired':
        message = 'Firebase token has expired';
        break;
      case 'auth/id-token-revoked':
        message = 'Firebase token has been revoked';
        break;
      case 'auth/invalid-id-token':
        message = 'Invalid Firebase token';
        break;
      case 'auth/user-disabled':
        status = 403;
        message = 'User account has been disabled';
        break;
      case 'auth/user-not-found':
        status = 404;
        message = 'User not found';
        break;
      case 'auth/argument-error':
        status = 400;
        message = 'Invalid authentication argument';
        break;
      default:
        message = err.message || 'Firebase authentication error';
    }

    return res.status(status).json({
      success: false,
      error: 'Firebase Error',
      message: message
    });
  }

  // Default error status and message
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Send error response
  res.status(status).json({
    success: false,
    error: err.name || 'Error',
    message: message
  });
};

module.exports = errorHandler;
