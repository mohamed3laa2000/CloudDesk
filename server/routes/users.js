const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const preferencesController = require('../controllers/preferencesController');

// Apply authMiddleware to all routes
router.use(authMiddleware);

// GET /api/users/preferences - Get user preferences
router.get('/preferences', preferencesController.getPreferences);

// PUT /api/users/preferences - Update user preferences
router.put('/preferences', preferencesController.updatePreferences);

// PUT /api/users/profile - Update user profile
router.put('/profile', userController.updateProfile);

module.exports = router;
