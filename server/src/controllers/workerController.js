const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

// GET /api/workers/:id – public profile
const getWorkerProfile = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.name, u.avatar_url, u.created_at,
              wp.bio, wp.skills, wp.languages, wp.years_experience,
              wp.avg_rating, wp.total_reviews, wp.total_shifts,
              wp.miami_verified, wp.top_worker, wp.stripe_onboarded
       FROM users u
       JOIN worker_profiles wp ON wp.user_id = u.id
       WHERE u.id = $1 AND u.type = 'worker' AND u.is_active = TRUE`,
      [req.params.id]
    );
    if (!rows[0]) throw new AppError('Worker not found', 404);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/workers/me – update own profile
const updateMyProfile = async (req, res, next) => {
  try {
    const {
      name, phone, language, avatar_url,
      bio, skills, languages, years_experience,
    } = req.body;

    if (name || phone || language || avatar_url) {
      const userSets = [], userParams = [];
      if (name) { userParams.push(name); userSets.push(`name = $${userParams.length}`); }
      if (phone) { userParams.push(phone); userSets.push(`phone = $${userParams.length}`); }
      if (language) { userParams.push(language); userSets.push(`language = $${userParams.length}`); }
      if (avatar_url) { userParams.push(avatar_url); userSets.push(`avatar_url = $${userParams.length}`); }
      userParams.push(req.user.id);
      await query(`UPDATE users SET ${userSets.join(',')} WHERE id = $${userParams.length}`, userParams);
    }

    const wpSets = [], wpParams = [];
    if (bio !== undefined) { wpParams.push(bio); wpSets.push(`bio = $${wpParams.length}`); }
    if (skills)    { wpParams.push(skills);    wpSets.push(`skills = $${wpParams.length}`); }
    if (languages) { wpParams.push(languages); wpSets.push(`languages = $${wpParams.length}`); }
    if (years_experience !== undefined) { wpParams.push(years_experience); wpSets.push(`years_experience = $${wpParams.length}`); }

    if (wpSets.length) {
      wpParams.push(req.user.id);
      await query(`UPDATE worker_profiles SET ${wpSets.join(',')} WHERE user_id = $${wpParams.length}`, wpParams);
    }

    const { rows } = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.language, u.avatar_url,
              wp.bio, wp.skills, wp.languages, wp.years_experience,
              wp.avg_rating, wp.total_shifts, wp.total_earnings,
              wp.miami_verified, wp.top_worker, wp.stripe_onboarded, wp.instant_pay_enabled
       FROM users u JOIN worker_profiles wp ON wp.user_id = u.id WHERE u.id = $1`,
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// GET /api/workers/me/dashboard
const workerDashboard = async (req, res, next) => {
  try {
    const [profileRes, upcomingRes, earningsRes, recentReviewsRes] = await Promise.all([
      query(
        `SELECT u.name, u.avatar_url, u.email, wp.*
         FROM users u JOIN worker_profiles wp ON wp.user_id = u.id WHERE u.id = $1`,
        [req.user.id]
      ),
      query(
        `SELECT a.id AS app_id, a.status, s.id AS shift_id, s.role, s.title,
                s.shift_date, s.start_time, s.end_time, s.pay_rate, s.address, s.zone,
                bp.company_name, bp.logo_url
         FROM applications a
         JOIN shifts s ON s.id = a.shift_id
         JOIN business_profiles bp ON bp.user_id = s.business_id
         WHERE a.worker_id = $1 AND a.status = 'accepted' AND s.shift_date >= CURRENT_DATE
         ORDER BY s.shift_date ASC LIMIT 5`,
        [req.user.id]
      ),
      query(
        `SELECT DATE_TRUNC('month', paid_at) AS month, SUM(worker_amount) AS earned
         FROM payments WHERE worker_id = $1 AND status = 'succeeded'
         GROUP BY month ORDER BY month DESC LIMIT 6`,
        [req.user.id]
      ),
      query(
        `SELECT r.rating, r.comment, r.created_at, u.name AS reviewer_name,
                bp.company_name, s.role
         FROM reviews r
         JOIN users u ON u.id = r.reviewer_id
         LEFT JOIN business_profiles bp ON bp.user_id = r.reviewer_id
         JOIN shifts s ON s.id = r.shift_id
         WHERE r.reviewee_id = $1
         ORDER BY r.created_at DESC LIMIT 5`,
        [req.user.id]
      ),
    ]);

    res.json({
      profile: profileRes.rows[0],
      upcoming_shifts: upcomingRes.rows,
      earnings_by_month: earningsRes.rows,
      recent_reviews: recentReviewsRes.rows,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/workers/me/availability
const updateAvailability = async (req, res, next) => {
  try {
    const { slots } = req.body; // array of { day_of_week?, specific_date?, start_time, end_time, is_available }
    await query('DELETE FROM worker_availability WHERE worker_id = $1', [req.user.id]);
    for (const slot of slots) {
      await query(
        `INSERT INTO worker_availability (worker_id, day_of_week, specific_date, start_time, end_time, is_available)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [req.user.id, slot.day_of_week || null, slot.specific_date || null,
         slot.start_time, slot.end_time, slot.is_available !== false]
      );
    }
    res.json({ message: 'Availability updated' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getWorkerProfile, updateMyProfile, workerDashboard, updateAvailability };
