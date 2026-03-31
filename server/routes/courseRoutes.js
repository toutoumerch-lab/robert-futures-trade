const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getCourses, getCourse, createCourse, updateCourse, deleteCourse } = require('../controllers/courseController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Setup multer for courses multi-file uploading
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    // secure file nomenclature
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
    storage, 
    limits: { fileSize: 1024 * 1024 * 500 } // 500MB allowing massive MP4s
});

// Helper fields to map multer form parses
const courseUploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'pdf_file', maxCount: 1 },
  { name: 'video_file', maxCount: 1 }
]);

router.get('/', getCourses);
router.get('/:id', getCourse);
router.post('/', authenticateToken, isAdmin, courseUploadFields, createCourse);
router.put('/:id', authenticateToken, isAdmin, courseUploadFields, updateCourse);
router.delete('/:id', authenticateToken, isAdmin, deleteCourse);

module.exports = router;
