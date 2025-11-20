const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const instanceController = require('../controllers/instanceController');

// Apply authMiddleware to all routes
router.use(authMiddleware);

// GET /api/instances - Get all instances for authenticated user
router.get('/', instanceController.getInstances);

// POST /api/instances - Create new instance
router.post('/', instanceController.createInstance);

// GET /api/instances/:id - Get single instance
router.get('/:id', instanceController.getInstance);

// PATCH /api/instances/:id/status - Update instance status
router.patch('/:id/status', instanceController.updateStatus);

// POST /api/instances/:id/reset-password - Reset Windows password
router.post('/:id/reset-password', instanceController.resetWindowsPassword);

// DELETE /api/instances/:id - Delete instance (soft delete)
router.delete('/:id', instanceController.deleteInstance);

module.exports = router;
