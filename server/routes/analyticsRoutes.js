const express = require('express');
const router  = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const {
  getOverview,
  getCourseAnalytics,
  getUserAnalytics,
  getActivity,
  getAIInsights,
  getPropFirmAnalytics,
  getCountriesAnalytics,
} = require('../controllers/analyticsController');

router.get('/overview',    authenticateToken, isAdmin, getOverview);
router.get('/courses',     authenticateToken, isAdmin, getCourseAnalytics);
router.get('/users',       authenticateToken, isAdmin, getUserAnalytics);
router.get('/activity',    authenticateToken, isAdmin, getActivity);
router.get('/ai-insights', authenticateToken, isAdmin, getAIInsights);
router.get('/prop-firms',  authenticateToken, isAdmin, getPropFirmAnalytics);
router.get('/countries',   authenticateToken, isAdmin, getCountriesAnalytics);

module.exports = router;
