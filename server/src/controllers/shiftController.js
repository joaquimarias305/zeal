const { query, getClient } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');
const { sendPush } = require('../services/pushService');
const logger = require('../config/logger');

const pushToUser = async (userId, payload) => {
  try {
    const { rows } = await query(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );
    for (const sub of rows) {
      await sendPush(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
    }
  } catch { /* non-fatal */ }
};

// GET /api/shifts – browse open shifts (workers + public)
const listShifts = async (req, res, next) => {
  try {
    const { role, zone, date, lang, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = ["s.status = 'open'", 's.shift_date >= CURRENT_DATE'];

    if (role)  { params.push(role);  conditions.push(`s.role = $${params.length}`); }
    if (zone)  { params.push(zone);  conditions.push(`s.zone = $${params.length}`); }
    if (date)  { params.push(date);  conditions.push(`s.shift_date = $${params.length}`); }
    if (lang)  { params.push(lang);  conditions.push(`s.language_req IN ($${params.length}, 'both')`); }

    const where = conditions.join(' AND ');
    params.push(limit, offset);

    const { rows } = await query(
      `SELECT s.*, bp.company_name, bp.zone AS business_zone, bp.logo_url,
              bp.avg_rating AS business_rating,
              (SELECT COUNT(*) FROM applications a WHERE a.shift_id = s.id AND a.status = 'accepted') AS confirmed_count
       FROM shifts s
       JOIN business_profiles bp ON bp.user_id = s.business_id
       WHERE ${where}
       ORDER BY s.shift_date ASC, s.start_time ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const { rows: countRows } = await query(
      `SELECT COUNT(*) FROM shifts s WHERE ${where}`,
      params.slice(0, -2)
    );

    res.json({
      shifts: rows,
      total: parseInt(countRows[0].count),
      page: parseInt(page),
      pages: Math.ceil(countRows[0].count / limit),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/shifts/:id
const getShift = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT s.*, bp.company_name, bp.description AS business_desc, bp.logo_url,
              bp.zone AS business_zone, bp.avg_rating AS business_rating, bp.verified AS business_verified
       FROM shifts s
       JOIN business_profiles bp ON bp.user_id = s.business_id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) throw new AppError('Shift not found', 404);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// POST /api/shifts – business creates shift
const createShift = async (req, res, next) => {
  try {
    const {
      role, title, description, zone, address,
      shift_date, start_time, end_time, pay_rate,
      workers_needed = 1, language_req = 'both',
      dress_code, notes,
    } = req.body;

    const { rows } = await query(
      `INSERT INTO shifts (business_id, role, title, description, zone, address,
         shift_date, start_time, end_time, pay_rate, workers_needed, language_req, dress_code, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [req.user.id, role, title, description, zone, address,
       shift_date, start_time, end_time, pay_rate, workers_needed, language_req, dress_code, notes]
    );

    await query(
      'UPDATE business_profiles SET total_shifts_posted = total_shifts_posted + 1 WHERE user_id = $1',
      [req.user.id]
    );

    logger.info(`Shift created: ${rows[0].id} by ${req.user.id}`);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/shifts/:id – business updates shift
const updateShift = async (req, res, next) => {
  try {
    const { rows: existing } = await query(
      'SELECT * FROM shifts WHERE id = $1 AND business_id = $2',
      [req.params.id, req.user.id]
    );
    if (!existing[0]) throw new AppError('Shift not found or unauthorized', 404);
    if (['completed', 'cancelled'].includes(existing[0].status)) {
      throw new AppError('Cannot edit a completed or cancelled shift', 400);
    }

    const allowed = ['title','description','zone','address','shift_date','start_time',
                     'end_time','pay_rate','workers_needed','language_req','dress_code','notes','status'];
    const sets = [], params = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        params.push(req.body[key]);
        sets.push(`${key} = $${params.length}`);
      }
    }
    if (!sets.length) throw new AppError('No valid fields to update', 400);

    params.push(req.params.id);
    const { rows } = await query(
      `UPDATE shifts SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/shifts/:id – business cancels shift
const cancelShift = async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE shifts SET status = 'cancelled'
       WHERE id = $1 AND business_id = $2 AND status IN ('draft','open')
       RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) throw new AppError('Shift not found or cannot be cancelled', 404);
    res.json({ message: 'Shift cancelled' });
  } catch (err) {
    next(err);
  }
};

// GET /api/shifts/business/mine – business sees own shifts
const businessShifts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [req.user.id];
    let statusClause = '';
    if (status) { params.push(status); statusClause = `AND s.status = $${params.length}`; }
    params.push(limit, offset);

    const { rows } = await query(
      `SELECT s.*,
        (SELECT COUNT(*) FROM applications a WHERE a.shift_id = s.id AND a.status = 'pending') AS pending_apps,
        (SELECT COUNT(*) FROM applications a WHERE a.shift_id = s.id AND a.status = 'accepted') AS accepted_apps
       FROM shifts s
       WHERE s.business_id = $1 ${statusClause}
       ORDER BY s.shift_date DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// ─── APPLICATIONS ────────────────────────────────────────────────────────────

// POST /api/shifts/:id/apply – worker applies
const applyToShift = async (req, res, next) => {
  try {
    const { rows: shift } = await query(
      `SELECT * FROM shifts WHERE id = $1 AND status = 'open'`,
      [req.params.id]
    );
    if (!shift[0]) throw new AppError('Shift not available', 404);

    const { rows: existing } = await query(
      'SELECT id FROM applications WHERE shift_id = $1 AND worker_id = $2',
      [req.params.id, req.user.id]
    );
    if (existing.length) throw new AppError('Already applied to this shift', 409);

    const { rows } = await query(
      `INSERT INTO applications (shift_id, worker_id, message)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.params.id, req.user.id, req.body.message || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// GET /api/shifts/:id/applications – business sees applicants
const getApplications = async (req, res, next) => {
  try {
    const { rows: shift } = await query(
      'SELECT id FROM shifts WHERE id = $1 AND business_id = $2',
      [req.params.id, req.user.id]
    );
    if (!shift[0]) throw new AppError('Shift not found or unauthorized', 404);

    const { rows } = await query(
      `SELECT a.*, u.name, u.avatar_url, wp.skills, wp.languages,
              wp.avg_rating, wp.total_shifts, wp.miami_verified, wp.top_worker
       FROM applications a
       JOIN users u ON u.id = a.worker_id
       JOIN worker_profiles wp ON wp.user_id = a.worker_id
       WHERE a.shift_id = $1
       ORDER BY wp.avg_rating DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/shifts/:shiftId/applications/:appId – business accepts/rejects
const updateApplication = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      throw new AppError('Status must be accepted or rejected', 400);
    }

    const { rows: shift } = await client.query(
      'SELECT * FROM shifts WHERE id = $1 AND business_id = $2',
      [req.params.shiftId, req.user.id]
    );
    if (!shift[0]) throw new AppError('Shift not found or unauthorized', 404);

    const { rows: app } = await client.query(
      `UPDATE applications SET status = $1 WHERE id = $2 AND shift_id = $3 RETURNING *`,
      [status, req.params.appId, req.params.shiftId]
    );
    if (!app[0]) throw new AppError('Application not found', 404);

    if (status === 'accepted') {
      await client.query(
        `UPDATE shifts SET workers_confirmed = workers_confirmed + 1 WHERE id = $1`,
        [req.params.shiftId]
      );

      const { rows: shiftCheck } = await client.query(
        'SELECT workers_needed, workers_confirmed FROM shifts WHERE id = $1',
        [req.params.shiftId]
      );
      if (shiftCheck[0].workers_confirmed >= shiftCheck[0].workers_needed) {
        await client.query(`UPDATE shifts SET status = 'filled' WHERE id = $1`, [req.params.shiftId]);
      }

      // Notify worker via email + push
      const { rows: workerData } = await client.query(
        `SELECT u.email, u.name, u.language FROM users u WHERE u.id = $1`,
        [app[0].worker_id]
      );
      if (workerData[0]) {
        emailService.send({
          to: workerData[0].email,
          templateKey: 'shiftConfirmed',
          lang: workerData[0].language,
          templateVars: [workerData[0].name, shift[0].title || shift[0].role, shift[0].shift_date],
        });
        pushToUser(app[0].worker_id, {
          title: workerData[0].language === 'es' ? '¡Turno confirmado! ✅' : 'Shift confirmed! ✅',
          body: workerData[0].language === 'es'
            ? `Tu turno en ${shift[0].title || shift[0].role} fue aceptado.`
            : `Your shift at ${shift[0].title || shift[0].role} was accepted.`,
          url: '/worker',
        });
      }
    }

    await client.query('COMMIT');
    res.json(app[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// GET /api/shifts/worker/mine – worker sees their applications
const workerApplications = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT a.*, s.role, s.title, s.shift_date, s.start_time, s.end_time,
              s.pay_rate, s.address, s.zone, s.status AS shift_status,
              bp.company_name, bp.logo_url
       FROM applications a
       JOIN shifts s ON s.id = a.shift_id
       JOIN business_profiles bp ON bp.user_id = s.business_id
       WHERE a.worker_id = $1
       ORDER BY s.shift_date DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listShifts, getShift, createShift, updateShift, cancelShift,
  businessShifts, applyToShift, getApplications, updateApplication, workerApplications,
};
