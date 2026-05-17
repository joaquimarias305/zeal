const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { AppError } = require('./errorHandler');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ─── Storage: local disk (dev) or swappable for Cloudinary (prod) ───────────

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomBytes(16).toString('hex');
    cb(null, `${name}${ext}`);
  },
});

const memoryStorage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG and WebP images are allowed', 400), false);
  }
};

// Use memory storage when CLOUDINARY_URL is set (prod), disk otherwise
const storage = process.env.CLOUDINARY_URL ? memoryStorage : diskStorage;

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
});

module.exports = { upload };
