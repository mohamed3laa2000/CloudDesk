const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/login - Login with Firebase ID token
router.post('/login', authController.login);

// POST /api/auth/verify - Verify JWT token
router.post('/verify', authController.verify);

// POST /api/auth/logout - Logout and clear httpOnly cookie
router.post('/logout', authController.logout);

module.exports = router;
