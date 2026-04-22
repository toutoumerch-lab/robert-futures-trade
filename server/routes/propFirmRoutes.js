const express = require('express');
const router = express.Router();
const { getPropFirms, getPropFirmsAdmin, createPropFirm, bulkCreatePropFirms, updatePropFirm, deletePropFirm, getPlatforms, getGroups, patchGroupName, upsertGroupImage } = require('../controllers/propFirmController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const uploadPropFirm = require('../middleware/uploadPropFirm');
const uploadGroupLogo = require('../middleware/uploadGroupLogo');
const { trackPropFirmClick } = require('../controllers/analyticsController');

router.get('/platforms', getPlatforms);
router.get('/groups', getGroups);
router.get('/', getPropFirms);
router.get('/admin', authenticateToken, isAdmin, getPropFirmsAdmin);
router.post('/bulk', authenticateToken, isAdmin, bulkCreatePropFirms);
router.post('/', authenticateToken, isAdmin, uploadPropFirm.single('logo'), createPropFirm);
router.post('/groups/:name/image', authenticateToken, isAdmin, uploadGroupLogo.single('logo'), upsertGroupImage);
router.put('/:id', authenticateToken, isAdmin, uploadPropFirm.single('logo'), updatePropFirm);
router.patch('/:id/group', authenticateToken, isAdmin, patchGroupName);
router.delete('/:id', authenticateToken, isAdmin, deletePropFirm);

// Public click tracking — no auth required (fire-and-forget)
router.post('/:id/click', trackPropFirmClick);

module.exports = router;
