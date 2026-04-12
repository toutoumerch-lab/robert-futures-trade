const express = require('express');
const router = express.Router();
const { enrollInCourse, checkEnrollment, getMyEnrollments } = require('../controllers/enrollmentController');
const { authenticateToken } = require('../middleware/auth');

// All enrollment routes require authentication
router.post('/', authenticateToken, enrollInCourse);
router.get('/my', authenticateToken, getMyEnrollments);
router.get('/check/:courseId', authenticateToken, checkEnrollment);

module.exports = router;
