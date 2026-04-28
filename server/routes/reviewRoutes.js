const express = require('express');
const router = express.Router();
const { authenticateToken: auth, isAdmin } = require('../middleware/auth');
const {
  submitReview,
  getLessonReviews,
  getMyReview,
  getSatisfactionRate,
  getAdminReviews,
  deleteReview,
} = require('../controllers/reviewController');

// ── Public
router.get('/satisfaction',         getSatisfactionRate);
router.get('/lesson/:lessonId',     getLessonReviews);

// ── Authenticated users
router.post('/',                    auth, submitReview);
router.get('/my/:lessonId',         auth, getMyReview);

// ── Admin only
router.get('/admin',                auth, isAdmin, getAdminReviews);
router.delete('/admin/:id',         auth, isAdmin, deleteReview);

module.exports = router;
