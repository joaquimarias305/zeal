const { query } = require('../config/db');

// GET /api/admin/stats
const getStats = async (_req, res, next) => {
  try {
    const [users, shifts, payments, reviews] = await Promise.all([
      query(`SELECT type, COUNT(*) FROM users GROUP BY type`),
      query(`SELECT status, COUNT(*) FROM shifts GROUP BY status`),
      query(`SELECT status, SUM(gross_amount) AS total, SUM(platform_fee) AS fees, COUNT(*) AS count FROM payments GROUP BY status`),
      query(`SELECT ROUND(AVG(rating)::numeric,2) AS avg_rating, COUNT(*) AS total FROM reviews`),
    ]);
    res.json({
      users: users.rows,
      shifts: shifts.rows,
      payments: payments.rows,
      reviews: reviews.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users
const listUsers = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 50, search } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];
    if (type)   { params.push(type);   conditions.push(`u.type = $${params.length}`); }
    if (search) { params.push(`%${search}%`); conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`); }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    params.push(limit, offset);

    const { rows } = await query(
      `SELECT u.id, u.type, u.name, u.email, u.language, u.email_verified, u.is_active, u.created_at,
              u.last_login
       FROM users u ${where}
       ORDER BY u.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/status
const toggleUserStatus = async (req, res, next) => {
  try {
    const { is_active } = req.body;
    const { rows } = await query(
      'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, name, email, is_active',
      [is_active, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/workers/:id/verify
const verifyWorker = async (req, res, next) => {
  try {
    await query(
      `UPDATE worker_profiles SET miami_verified = TRUE, verified_at = NOW() WHERE user_id = $1`,
      [req.params.id]
    );
    res.json({ message: 'Worker verified' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/businesses/:id/verify
const verifyBusiness = async (req, res, next) => {
  try {
    await query(
      `UPDATE business_profiles SET verified = TRUE, verified_at = NOW() WHERE user_id = $1`,
      [req.params.id]
    );
    res.json({ message: 'Business verified' });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/shifts
const listShifts = async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT s.*, bp.company_name,
        (SELECT COUNT(*) FROM applications a WHERE a.shift_id = s.id) AS total_apps
       FROM shifts s JOIN business_profiles bp ON bp.user_id = s.business_id
       ORDER BY s.created_at DESC LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/shifts/:id/complete
const completeShift = async (req, res, next) => {
  try {
    await query(`UPDATE shifts SET status = 'completed' WHERE id = $1`, [req.params.id]);
    await query(
      `UPDATE applications SET status = 'completed' WHERE shift_id = $1 AND status = 'accepted'`,
      [req.params.id]
    );
    await query(
      `UPDATE worker_profiles SET total_shifts = total_shifts + 1
       WHERE user_id IN (SELECT worker_id FROM applications WHERE shift_id = $1 AND status = 'completed')`,
      [req.params.id]
    );
    res.json({ message: 'Shift marked completed' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats, listUsers, toggleUserStatus, verifyWorker, verifyBusiness, listShifts, completeShift };
