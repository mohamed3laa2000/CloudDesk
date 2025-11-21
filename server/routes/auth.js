const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passkeyController = require('../controllers/passkeyController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/auth/login - Login with Firebase ID token
router.post('/login', authController.login);

// POST /api/auth/verify - Verify JWT token
router.post('/verify', authController.verify);

// POST /api/auth/logout - Logout and clear httpOnly cookie
router.post('/logout', authController.logout);

// Passkey registration endpoints (require JWT authentication)
// POST /api/auth/passkey/register-options - Generate registration options
router.post('/passkey/register-options', authMiddleware, passkeyController.registerOptions);

// POST /api/auth/passkey/register-verify - Verify registration and store passkey
router.post('/passkey/register-verify', authMiddleware, passkeyController.registerVerify);

// Passkey authentication endpoints (public endpoints)
// POST /api/auth/passkey/login-options - Generate authentication options
router.post('/passkey/login-options', passkeyController.loginOptions);

// POST /api/auth/passkey/login-verify - Verify authentication and generate JWT
router.post('/passkey/login-verify', passkeyController.loginVerify);

// Passkey management endpoints (require JWT authentication)
// GET /api/auth/passkey/list - List all passkeys for authenticated user
router.get('/passkey/list', authMiddleware, passkeyController.listPasskeys);

// DELETE /api/auth/passkey/:id - Delete a passkey
router.delete('/passkey/:id', authMiddleware, passkeyController.deletePasskey);

// PATCH /api/auth/passkey/:id/name - Update passkey friendly name
router.patch('/passkey/:id/name', authMiddleware, passkeyController.updatePasskeyName);

// 2FA status endpoints (require JWT authentication)
// GET /api/auth/passkey/2fa-status - Get user's 2FA status
router.get('/passkey/2fa-status', authMiddleware, passkeyController.get2FAStatus);

// PUT /api/auth/passkey/2fa-status - Update user's 2FA status
router.put('/passkey/2fa-status', authMiddleware, passkeyController.set2FAStatus);

module.exports = router;
