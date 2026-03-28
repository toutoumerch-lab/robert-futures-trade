const express = require('express');
const router = express.Router();
const { getCourses, getCourse, createCourse, updateCourse, deleteCourse } = require('../controllers/courseController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/', getCourses);
router.get('/:id', getCourse);
router.post('/', authenticateToken, isAdmin, createCourse);
router.put('/:id', authenticateToken, isAdmin, updateCourse);
router.delete('/:id', authenticateToken, isAdmin, deleteCourse);

module.exports = router;
