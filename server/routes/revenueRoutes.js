const express = require('express');
const router = express.Router();
const { getRevenueAdmin } = require('../controllers/revenueController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, isAdmin, getRevenueAdmin);

module.exports = router;
