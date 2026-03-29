const express = require('express');
const router = express.Router();
const { getPropFirms, getPropFirmsAdmin, createPropFirm, bulkCreatePropFirms, updatePropFirm, deletePropFirm, getPlatforms } = require('../controllers/propFirmController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/platforms', getPlatforms);
router.get('/', getPropFirms);
router.get('/admin', authenticateToken, isAdmin, getPropFirmsAdmin);
router.post('/bulk', authenticateToken, isAdmin, bulkCreatePropFirms);
router.post('/', authenticateToken, isAdmin, createPropFirm);
router.put('/:id', authenticateToken, isAdmin, updatePropFirm);
router.delete('/:id', authenticateToken, isAdmin, deletePropFirm);

module.exports = router;
