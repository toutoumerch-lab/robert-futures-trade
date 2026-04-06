const express = require('express');
const router = express.Router();
const { getPropFirms, getPropFirmsAdmin, createPropFirm, bulkCreatePropFirms, updatePropFirm, deletePropFirm, getPlatforms, getGroups, patchGroupName } = require('../controllers/propFirmController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const uploadPropFirm = require('../middleware/uploadPropFirm');

router.get('/platforms', getPlatforms);
router.get('/groups', getGroups);
router.get('/', getPropFirms);
router.get('/admin', authenticateToken, isAdmin, getPropFirmsAdmin);
router.post('/bulk', authenticateToken, isAdmin, bulkCreatePropFirms);
router.post('/', authenticateToken, isAdmin, uploadPropFirm.single('logo'), createPropFirm);
router.put('/:id', authenticateToken, isAdmin, uploadPropFirm.single('logo'), updatePropFirm);
router.patch('/:id/group', authenticateToken, isAdmin, patchGroupName);
router.delete('/:id', authenticateToken, isAdmin, deletePropFirm);

module.exports = router;
