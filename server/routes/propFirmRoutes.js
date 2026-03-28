const express = require('express');
const router = express.Router();
const { getPropFirms, createPropFirm, updatePropFirm, deletePropFirm } = require('../controllers/propFirmController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/', getPropFirms);
router.post('/', authenticateToken, isAdmin, createPropFirm);
router.put('/:id', authenticateToken, isAdmin, updatePropFirm);
router.delete('/:id', authenticateToken, isAdmin, deletePropFirm);

module.exports = router;
