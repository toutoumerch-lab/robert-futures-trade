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

const ALLOWED_MIME = /jpeg|jpg|png|webp|gif|svg\+xml/;
const ALLOWED_EXT  = /jpeg|jpg|png|webp|gif|svg/;

const uploadBlog = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const mimeOk = ALLOWED_MIME.test(file.mimetype);
    const extOk  = ALLOWED_EXT.test(path.extname(file.originalname).toLowerCase());
    if (mimeOk && extOk) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type "${file.mimetype}". Allowed: JPG, PNG, WebP, GIF, SVG.`));
    }
  },
});

/** Drop into a route AFTER uploadBlog.single() to return a proper JSON error on rejection */
const handleUploadError = (err, req, res, next) => {
  if (err) {
    return res.status(400).json({ error: err.message || 'File upload failed.' });
  }
  next();
};

module.exports = uploadBlog;
module.exports.handleUploadError = handleUploadError;
