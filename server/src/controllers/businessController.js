const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

// GET /api/businesses/:id
const getBusinessProfile = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.name, u.avatar_url, u.created_at,
              bp.company_name, bp.description, bp.industry, bp.zone,
              bp.address, bp.website, bp.logo_url,
              bp.avg_rating, bp.total_reviews, bp.total_shifts_posted, bp.verified
       FROM users u
       JOIN business_profiles bp ON bp.user_id = u.id
       WHERE u.id = $1 AND u.type = 'business' AND u.is_active = TRUE`,
      [req.params.id]
    );
    if (!rows[0]) throw new AppError('Business not found', 404);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/businesses/me
const updateMyProfile = async (req, res, next) => {
  try {
    const {
      name, phone, language, avatar_url,
      company_name, description, industry, zone, address, website, logo_url,
    } = req.body;

    if (name || phone || language || avatar_url) {
      const sets = [], params = [];
      if (name) { params.push(name); sets.push(`name = $${params.length}`); }
      if (phone) { params.push(phone); sets.push(`phone = $${params.length}`); }
      if (language) { params.push(language); sets.push(`language = $${params.length}`); }
      if (avatar_url) { params.push(avatar_url); sets.push(`avatar_url = $${params.length}`); }
      params.push(req.user.id);
      await query(`UPDATE users SET ${sets.join(',')} WHERE id = $${params.length}`, params);
    }

    const bpSets = [], bpParams = [];
    const bpFields = { company_name, description, industry, zone, address, website, logo_url };
    for (const [k, v] of Object.entries(bpFields)) {
      if (v !== undefined) { bpParams.push(v); bpSets.push(`${k} = $${bpParams.length}`); }
    }

    if (bpSets.length) {
      bpParams.push(req.user.id);
      await query(`UPDATE business_profiles SET ${bpSets.join(',')} WHERE user_id = $${bpParams.length}`, bpParams);
    }

    const { rows } = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.language, u.avatar_url,
              bp.*
       FROM users u JOIN business_profiles bp ON bp.user_id = u.id WHERE u.id = $1`,
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// GET /api/businesses/me/dashboard
const businessDashboard = async (req, res, next) => {
  try {
    const [profileRes, activeShiftsRes, spendRes, recentReviewsRes] = await Promise.all([
      query(
        `SELECT u.name, u.email, u.avatar_url, bp.*
         FROM users u JOIN business_profiles bp ON bp.user_id = u.id WHERE u.id = $1`,
        [req.user.id]
      ),
      query(
        `SELECT s.*,
          (SELECT COUNT(*) FROM applications a WHERE a.shift_id = s.id AND a.status = 'accepted') AS confirmed,
          (SELECT COUNT(*) FROM applications a WHERE a.shift_id = s.id AND a.status = 'pending') AS pending
         FROM shifts s WHERE s.business_id = $1 AND s.status IN ('open','filled','in_progress')
         ORDER BY s.shift_date ASC`,
        [req.user.id]
      ),
      query(
        `SELECT
           SUM(gross_amount) AS total_spent,
           SUM(platform_fee) AS total_fees,
           COUNT(*) AS total_payments
         FROM payments WHERE business_id = $1 AND status = 'succeeded'`,
        [req.user.id]
      ),
      query(
        `SELECT r.rating, r.comment, r.created_at,
                u.name AS worker_name, wp.avg_rating AS worker_avg_rating, s.role
         FROM reviews r
         JOIN users u ON u.id = r.reviewer_id
         LEFT JOIN worker_profiles wp ON wp.user_id = r.reviewer_id
         JOIN shifts s ON s.id = r.shift_id
         WHERE r.reviewee_id = $1
         ORDER BY r.created_at DESC LIMIT 5`,
        [req.user.id]
      ),
    ]);

    res.json({
      profile: profileRes.rows[0],
      active_shifts: activeShiftsRes.rows,
      spend_summary: spendRes.rows[0],
      recent_reviews: recentReviewsRes.rows,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getBusinessProfile, updateMyProfile, businessDashboard };
