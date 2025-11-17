const dbService = require('../services/dbService');

/**
 * Billing controller - handles billing and usage tracking business logic
 */

/**
 * Get usage summary for authenticated user
 * @route GET /api/billing/usage
 * @returns {UsageSummary} Usage summary with 200 status
 */
const getUsageSummary = async (req, res, next) => {
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

    // Call dbService to calculate usage summary
    let usageSummary;
    try {
      usageSummary = await dbService.calculateUsageSummary(email);
    } catch (error) {
      console.error('Database error during calculateUsageSummary:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Return usage summary with 200 status
    // Return the data directly without wrapping for cleaner API response
    return res.status(200).json(usageSummary);

  } catch (error) {
    // Pass unexpected errors to error handling middleware
    console.error('Unexpected error in getUsageSummary controller:', error);
    next(error);
  }
};

module.exports = {
  getUsageSummary
};
