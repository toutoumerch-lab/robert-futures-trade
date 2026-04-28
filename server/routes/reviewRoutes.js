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
  getCourseRatings,
  getMyAllReviews,
} = require('../controllers/reviewController');

// ── Public
router.get('/satisfaction',         getSatisfactionRate);
router.get('/course-ratings',       getCourseRatings);
router.get('/lesson/:lessonId',     getLessonReviews);

// ── Authenticated users
router.post('/',                    auth, submitReview);
router.get('/my/:lessonId',         auth, getMyReview);
router.get('/my-all',               auth, getMyAllReviews);

// ── Admin only
router.get('/admin',                auth, isAdmin, getAdminReviews);
router.delete('/admin/:id',         auth, isAdmin, deleteReview);

module.exports = router;
