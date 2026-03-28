const express = require('express');
const router = express.Router();
const {
  getActivePromotion,
  getAllPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} = require('../controllers/promotionController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Public – used by the banner
router.get('/active', getActivePromotion);

// Admin-only
router.get('/', authenticateToken, isAdmin, getAllPromotions);
router.post('/', authenticateToken, isAdmin, createPromotion);
router.put('/:id', authenticateToken, isAdmin, updatePromotion);
router.delete('/:id', authenticateToken, isAdmin, deletePromotion);

module.exports = router;
