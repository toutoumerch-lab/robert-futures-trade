const express = require('express');
const router = express.Router();
const { getAboutStats } = require('../controllers/aboutController');

// Public — no auth needed
router.get('/stats', getAboutStats);

module.exports = router;
