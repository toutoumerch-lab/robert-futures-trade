const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { createCheckoutSession, verifySession } = require('../controllers/checkoutController');

router.post('/create-session', authenticateToken, createCheckoutSession);
router.get('/verify', verifySession);

module.exports = router;
