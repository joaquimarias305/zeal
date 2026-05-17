/**
 * Cloudinary upload helper.
 * Only used when CLOUDINARY_URL env var is set (production).
 * Falls back to returning a local /uploads/:filename URL in dev.
 */

let cloudinary = null;

if (process.env.CLOUDINARY_URL) {
  try {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
  } catch {
    // cloudinary package not installed â€“ silently ignore in dev
  }
}

const uploadBuffer = async (buffer, { folder = 'zeal', public_id } = {}) => {
  if (!cloudinary) {
    throw new Error('Cloudinary not configured');
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

module.exports = { uploadBuffer };
