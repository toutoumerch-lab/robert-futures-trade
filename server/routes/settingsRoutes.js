const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public route to get settings
router.get('/', settingsController.getSettings);

// Admin routes
router.put('/', authenticateToken, isAdmin, settingsController.updateSettings);
router.post('/logo', authenticateToken, isAdmin, upload.single('logo'), settingsController.updateLogo);

module.exports = router;
