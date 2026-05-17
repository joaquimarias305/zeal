const router  = require('express').Router();
const path    = require('path');
const fs      = require('fs');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const logger  = require('../config/logger');

// Ensure uploads dir exists (dev only)
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// POST /api/uploads/avatar
router.post('/avatar', authenticate, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('No file provided', 400);

    let avatarUrl;

    if (process.env.CLOUDINARY_URL && req.file.buffer) {
      // Production: upload to Cloudinary
      const { uploadBuffer } = require('../services/cloudinaryService');
      avatarUrl = await uploadBuffer(req.file.buffer, {
        folder: 'zeal/avatars',
        public_id: `user_${req.user.id}`,
      });
    } else {
      // Development: serve from /uploads
      const filename = req.file.filename;
      avatarUrl = `/uploads/${filename}`;
    }

    await query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, req.user.id]);

    logger.info(`Avatar updated for user ${req.user.id}: ${avatarUrl}`);
    res.json({ avatar_url: avatarUrl });
  } catch (err) {
    next(err);
  }
});

// POST /api/uploads/logo  (business only)
router.post('/logo', authenticate, upload.single('logo'), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('No file provided', 400);
    if (req.user.type !== 'business') throw new AppError('Business accounts only', 403);

    let logoUrl;

    if (process.env.CLOUDINARY_URL && req.file.buffer) {
      const { uploadBuffer } = require('../services/cloudinaryService');
      logoUrl = await uploadBuffer(req.file.buffer, {
        folder: 'zeal/logos',
        public_id: `business_${req.user.id}`,
      });
    } else {
      logoUrl = `/uploads/${req.file.filename}`;
    }

    await query('UPDATE business_profiles SET logo_url = $1 WHERE user_id = $2', [logoUrl, req.user.id]);

    res.json({ logo_url: logoUrl });
  } catch (err) {
    next(err);
  }
});

// Serve local uploads in dev
router.use('/files', (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Use Cloudinary in production' });
  }
  next();
}, require('express').static(uploadsDir));

module.exports = router;
