const express = require('express');
const router = express.Router();
const { getPropFirms, getPropFirmsAdmin, createPropFirm, bulkCreatePropFirms, updatePropFirm, deletePropFirm, toggleHidden, getPlatforms, getGroups, patchGroupName, upsertGroupImage } = require('../controllers/propFirmController');
const { authenticateToken, isAdmin, optionalAuth } = require('../middleware/auth');
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
router.patch('/:id/hidden', authenticateToken, isAdmin, toggleHidden);
router.delete('/:id', authenticateToken, isAdmin, deletePropFirm);

// Click tracking — optionalAuth so logged-in users get views recorded
router.post('/:id/click', optionalAuth, trackPropFirmClick);

module.exports = router;
