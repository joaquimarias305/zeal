const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

// POST /api/reviews – submit review after shift
const createReview = async (req, res, next) => {
  try {
    const { shift_id, reviewee_id, rating, comment } = req.body;

    // Verify the shift is completed and reviewer participated
    const { rows: shiftRows } = await query(
      `SELECT s.status, s.business_id,
              (SELECT COUNT(*) FROM applications a
               WHERE a.shift_id = s.id AND a.worker_id = $2 AND a.status = 'accepted') AS worker_participated
       FROM shifts s WHERE s.id = $1`,
      [shift_id, req.user.type === 'worker' ? req.user.id : reviewee_id]
    );

    const shift = shiftRows[0];
    if (!shift) throw new AppError('Shift not found', 404);
    if (!['completed', 'in_progress'].includes(shift.status)) {
      throw new AppError('Reviews can only be submitted after shift completion', 400);
    }

    // Validate reviewer is either the business or a worker who participated
    if (req.user.type === 'business' && shift.business_id !== req.user.id) {
      throw new AppError('Unauthorized', 403);
    }

    const { rows } = await query(
      `INSERT INTO reviews (shift_id, reviewer_id, reviewee_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (shift_id, reviewer_id, reviewee_id) DO NOTHING
       RETURNING *`,
      [shift_id, req.user.id, reviewee_id, rating, comment || null]
    );

    if (!rows[0]) throw new AppError('Review already submitted for this shift', 409);

    // Recalculate average rating for reviewee
    if (req.user.type === 'business') {
      await query(
        `UPDATE worker_profiles wp SET
           avg_rating = (SELECT ROUND(AVG(r.rating)::numeric, 2) FROM reviews r WHERE r.reviewee_id = $1),
           total_reviews = (SELECT COUNT(*) FROM reviews r WHERE r.reviewee_id = $1)
         WHERE wp.user_id = $1`,
        [reviewee_id]
      );
    } else {
      await query(
        `UPDATE business_profiles bp SET
           avg_rating = (SELECT ROUND(AVG(r.rating)::numeric, 2) FROM reviews r WHERE r.reviewee_id = $1),
           total_reviews = (SELECT COUNT(*) FROM reviews r WHERE r.reviewee_id = $1)
         WHERE bp.user_id = $1`,
        [reviewee_id]
      );
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// GET /api/reviews/worker/:workerId
const getWorkerReviews = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT r.*, u.name AS reviewer_name, u.type AS reviewer_type,
              bp.company_name, bp.logo_url,
              s.role, s.shift_date
       FROM reviews r
       JOIN users u ON u.id = r.reviewer_id
       LEFT JOIN business_profiles bp ON bp.user_id = r.reviewer_id
       JOIN shifts s ON s.id = r.shift_id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.workerId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/reviews/business/:businessId
const getBusinessReviews = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT r.*, u.name AS reviewer_name, wp.avg_rating AS worker_rating,
              s.role, s.shift_date
       FROM reviews r
       JOIN users u ON u.id = r.reviewer_id
       LEFT JOIN worker_profiles wp ON wp.user_id = r.reviewer_id
       JOIN shifts s ON s.id = r.shift_id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.businessId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

module.exports = { createReview, getWorkerReviews, getBusinessReviews };
