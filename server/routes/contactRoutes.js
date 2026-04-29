const express = require('express');
const router  = express.Router();
const { sendContactMessage } = require('../controllers/contactController');

// Public — no auth needed
router.post('/', sendContactMessage);

module.exports = router;
