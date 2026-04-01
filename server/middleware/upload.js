const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'public/uploads/branding';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Use 'favicon-' prefix for favicon uploads, 'logo-' for logos
    const prefix = file.fieldname === 'favicon' ? 'favicon-' : 'logo-';
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|svg|webp|ico|x-icon|vnd\.microsoft\.icon/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = /jpeg|jpg|png|svg|webp|ico/.test(path.extname(file.originalname).toLowerCase().replace('.', ''));

    if (mimetype || extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files (JPG, PNG, SVG, ICO) are allowed!"));
  }
});

module.exports = upload;
