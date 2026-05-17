const router = require('express').Router();
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { sendPush, isEnabled } = require('../services/pushService');

// GET /api/notifications
router.get('/', authenticate, async (req, res, next) => {
  try {
    const lang = req.user.language === 'es' ? 'es' : 'en';
    const { rows } = await query(
      `SELECT id, type, link, read, created_at,
        CASE WHEN $2 = 'es' THEN title_es ELSE title_en END AS title,
        CASE WHEN $2 = 'es' THEN body_es  ELSE body_en  END AS body
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 50`,
      [req.user.id, lang]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', authenticate, async (req, res, next) => {
  try {
    await query('UPDATE notifications SET read = TRUE WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'All notifications marked read' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    await query(
      'UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification read' });
  } catch (err) {
    next(err);
  }
});

// POST /api/notifications/push-subscribe
router.post('/push-subscribe', authenticate, async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }
    await query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET p256dh = $3, auth = $4`,
      [req.user.id, endpoint, keys.p256dh, keys.auth]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// POST /api/notifications/push-unsubscribe
router.post('/push-unsubscribe', authenticate, async (req, res, next) => {
  try {
    await query('DELETE FROM push_subscriptions WHERE user_id = $1', [req.user.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// POST /api/notifications/push-send (admin / internal use)
router.post('/push-send', authenticate, async (req, res, next) => {
  try {
    if (req.user.type !== 'admin') return res.status(403).json({ error: 'Admin only' });
    if (!isEnabled) return res.status(503).json({ error: 'Push not configured' });

    const { user_id, title, body, url } = req.body;
    const { rows } = await query(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1',
      [user_id]
    );

    const results = await Promise.allSettled(
      rows.map(sub => sendPush(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        { title, body, url: url || '/' }
      ))
    );

    // Clean up expired subscriptions
    const expired = rows.filter((_, i) => results[i].value === 'expired');
    for (const sub of expired) {
      await query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]);
    }

    res.json({ sent: rows.length - expired.length, expired: expired.length });
  } catch (err) { next(err); }
});

module.exports = router;
