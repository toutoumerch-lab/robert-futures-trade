const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const {
  getModules, createModule, updateModule, deleteModule, reorderModules,
  createLesson, updateLesson, deleteLesson, reorderLessons
} = require('../controllers/moduleController');

// Multer setup for lesson file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'lesson-' + file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 500 } // 500MB
});

const lessonUploadFields = upload.fields([
  { name: 'video_file', maxCount: 1 },
  { name: 'pdf_file', maxCount: 1 },
  { name: 'zip_file', maxCount: 1 }
]);

// ── Module Routes ──────────────────────────────────────────────
router.get('/courses/:courseId/modules', getModules);
router.post('/courses/:courseId/modules', authenticateToken, isAdmin, createModule);
router.put('/modules/:id', authenticateToken, isAdmin, updateModule);
router.delete('/modules/:id', authenticateToken, isAdmin, deleteModule);
router.put('/modules/reorder', authenticateToken, isAdmin, reorderModules);

// ── Lesson Routes ──────────────────────────────────────────────
router.post('/modules/:moduleId/lessons', authenticateToken, isAdmin, lessonUploadFields, createLesson);
router.put('/lessons/:id', authenticateToken, isAdmin, lessonUploadFields, updateLesson);
router.delete('/lessons/:id', authenticateToken, isAdmin, deleteLesson);
router.put('/lessons/reorder', authenticateToken, isAdmin, reorderLessons);

module.exports = router;
