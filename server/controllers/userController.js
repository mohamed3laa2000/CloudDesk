const dbService = require('../services/dbService');

/**
 * User controller - handles user profile business logic
 */

/**
 * Update user profile
 * @route PUT /api/users/profile
 * @body {Object} profileData - Profile data to update (name)
 * @returns {Object} Updated user object with 200 status
 */
const updateProfile = async (req, res, next) => {
  try {
    // Extract user email from JWT (attached by authMiddleware)
    const { email } = req.user;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'User email not found in request'
      });
    }

    // Extract name from request body
    const { name } = req.body;

    // Validate that name is provided
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Name is required'
      });
    }

    // Validate that name is not empty (after trimming)
    if (name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Name cannot be empty'
      });
    }

    // Call dbService to update user profile
    let updatedUser;
    try {
      updatedUser = await dbService.updateUserProfile(email, { name });
    } catch (error) {
      console.error('Database error during updateUserProfile:', error);
      
      // Check if error is due to user not found
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'User not found'
        });
      }
      
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Return updated user object with 200 status
    return res.status(200).json({
      user: {
        email: updatedUser.email,
        name: updatedUser.name
      },
      message: 'Profile updated successfully'
    });

  } catch (error) {
    // Pass unexpected errors to error handling middleware
    console.error('Unexpected error in updateProfile controller:', error);
    next(error);
  }
};

module.exports = {
  updateProfile
};
