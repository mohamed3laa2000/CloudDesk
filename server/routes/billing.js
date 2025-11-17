const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const billingController = require('../controllers/billingController');

// Apply authMiddleware to all routes
router.use(authMiddleware);

// GET /api/billing/usage - Get usage summary for authenticated user
router.get('/usage', billingController.getUsageSummary);

module.exports = router;
