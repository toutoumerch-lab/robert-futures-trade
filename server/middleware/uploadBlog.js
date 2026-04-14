const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'public/uploads/blog';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'blog-cover-' + unique + path.extname(file.originalname));
  },
});

const uploadBlog = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|webp|gif/.test(file.mimetype) &&
               /jpeg|jpg|png|webp|gif/.test(path.extname(file.originalname).toLowerCase());
    ok ? cb(null, true) : cb(new Error('Only image files are allowed!'));
  },
});

module.exports = uploadBlog;
