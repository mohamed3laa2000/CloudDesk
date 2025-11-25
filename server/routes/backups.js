const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const backupController = require('../controllers/backupController');

// Apply authMiddleware to all routes
router.use(authMiddleware);

// GET /api/backups - Get all backups for authenticated user
router.get('/', backupController.getBackups);

// POST /api/backups - Create new backup
router.post('/', backupController.createBackup);

// GET /api/backups/:id - Get single backup
router.get('/:id', backupController.getBackup);

// DELETE /api/backups/:id - Delete backup
router.delete('/:id', backupController.deleteBackup);

// POST /api/backups/:id/restore - Restore backup to create new instance
router.post('/:id/restore', backupController.restoreBackup);

module.exports = router;
