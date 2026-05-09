const express = require('express');
const router  = express.Router();
const { sendContactMessage, getContactMessages, deleteContactMessage } = require('../controllers/contactController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.post('/', sendContactMessage);
router.get('/admin', authenticateToken, isAdmin, getContactMessages);
router.delete('/admin/:id', authenticateToken, isAdmin, deleteContactMessage);

module.exports = router;
