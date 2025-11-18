const dbService = require('../services/dbService');

/**
 * Preferences controller - handles user preferences business logic
 */

// Default preferences to return when none exist
const DEFAULT_PREFERENCES = {
  theme: 'light',
  accentColor: '#14b8a6' // Teal - current primary color
};

/**
 * Validate theme value
 * @param {string} theme - Theme value to validate
 * @returns {boolean} - True if valid
 */
const isValidTheme = (theme) => {
  const validThemes = ['light', 'dark', 'system'];
  return validThemes.includes(theme);
};

/**
 * Validate hex color format
 * @param {string} color - Hex color to validate
 * @returns {boolean} - True if valid hex color
 */
const isValidHexColor = (color) => {
  // Regex for hex color: # followed by exactly 6 hex digits
  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
  return hexColorRegex.test(color);
};

/**
 * Get user preferences
 * @route GET /api/users/preferences
 * @returns {Object} User preferences with 200 status
 */
const getPreferences = async (req, res, next) => {
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

    // Call dbService to get preferences for this user
    let preferences;
    try {
      preferences = await dbService.getUserPreferences(email);
    } catch (error) {
      console.error('Database error during getUserPreferences:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // If no preferences exist, return defaults
    if (!preferences) {
      return res.status(200).json({
        preferences: DEFAULT_PREFERENCES
      });
    }

    // Return preferences with 200 status
    return res.status(200).json({
      preferences: {
        theme: preferences.theme,
        accentColor: preferences.accentColor
      }
    });

  } catch (error) {
    // Pass unexpected errors to error handling middleware
    console.error('Unexpected error in getPreferences controller:', error);
    next(error);
  }
};

/**
 * Update user preferences
 * @route PUT /api/users/preferences
 * @body {Object} preferences - Preferences to update (theme, accentColor)
 * @returns {Object} Updated preferences with 200 status
 */
const updatePreferences = async (req, res, next) => {
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

    // Extract preferences from request body
    const { theme, accentColor } = req.body;

    // Validate that at least one field is provided
    if (!theme && !accentColor) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'At least one preference field (theme or accentColor) must be provided'
      });
    }

    // Validate theme if provided
    if (theme && !isValidTheme(theme)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid theme value. Must be one of: light, dark, system'
      });
    }

    // Validate accent color if provided
    if (accentColor && !isValidHexColor(accentColor)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid accent color format. Must be a valid hex color (e.g., #14b8a6)'
      });
    }

    // Prepare preferences data for update
    const preferencesData = {};
    if (theme) preferencesData.theme = theme;
    if (accentColor) preferencesData.accentColor = accentColor;

    // Call dbService to update preferences
    let updatedPreferences;
    try {
      updatedPreferences = await dbService.updateUserPreferences(email, preferencesData);
    } catch (error) {
      console.error('Database error during updateUserPreferences:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Return updated preferences with 200 status
    return res.status(200).json({
      preferences: {
        theme: updatedPreferences.theme,
        accentColor: updatedPreferences.accentColor
      },
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    // Pass unexpected errors to error handling middleware
    console.error('Unexpected error in updatePreferences controller:', error);
    next(error);
  }
};

module.exports = {
  getPreferences,
  updatePreferences
};
