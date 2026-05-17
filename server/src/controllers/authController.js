const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');
const { createCustomer } = require('../services/stripeService');
const logger = require('../config/logger');

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, type, language = 'en', phone } = req.body;

    const { rows: existing } = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length) throw new AppError('Email already registered', 409);

    const password_hash = await bcrypt.hash(password, 12);
    const verifyToken = crypto.randomBytes(32).toString('hex');

    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, type, language, phone, verify_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, type, name, email, language`,
      [name, email, password_hash, type, language, phone || null, verifyToken]
    );
    const user = rows[0];

    // Create role-specific profile
    if (type === 'worker') {
      await query('INSERT INTO worker_profiles (user_id) VALUES ($1)', [user.id]);
    } else if (type === 'business') {
      const stripeCustomer = await createCustomer({ email, name });
      await query(
        `INSERT INTO business_profiles (user_id, company_name, stripe_customer_id)
         VALUES ($1, $2, $3)`,
        [user.id, name, stripeCustomer.id]
      );
    }

    const verifyLink = `${process.env.CLIENT_URL}/verify-email?token=${verifyToken}`;
    await emailService.send({
      to: email,
      templateKey: 'verifyEmail',
      lang: language,
      templateVars: [name, verifyLink],
    });

    const token = signToken(user.id);
    logger.info(`New ${type} registered: ${email}`);

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { rows } = await query(
      'SELECT id, type, name, email, password_hash, language, email_verified, is_active FROM users WHERE email = $1',
      [email]
    );

    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new AppError('Invalid email or password', 401);
    }
    if (!user.is_active) throw new AppError('Account suspended', 403);

    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = signToken(user.id);
    const { password_hash: _ph, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/verify-email?token=xxx
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) throw new AppError('Token required', 400);

    const { rows } = await query(
      'UPDATE users SET email_verified = TRUE, verify_token = NULL WHERE verify_token = $1 RETURNING id',
      [token]
    );
    if (!rows.length) throw new AppError('Invalid or expired token', 400);

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const { rows } = await query('SELECT id, name, language FROM users WHERE email = $1', [email]);

    // Always respond OK to prevent email enumeration
    if (!rows.length) return res.json({ message: 'If that email exists, a reset link was sent.' });

    const user = rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

    await query(
      'UPDATE users SET reset_token = $1, reset_expires = $2 WHERE id = $3',
      [resetToken, expires, user.id]
    );

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    await emailService.send({
      to: email,
      templateKey: 'passwordReset',
      lang: user.language,
      templateVars: [user.name, resetLink],
    });

    res.json({ message: 'If that email exists, a reset link was sent.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const { rows } = await query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_expires > NOW()',
      [token]
    );
    if (!rows.length) throw new AppError('Invalid or expired reset token', 400);

    const password_hash = await bcrypt.hash(password, 12);
    await query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_expires = NULL WHERE id = $2',
      [password_hash, rows[0].id]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, type, name, email, phone, language, email_verified, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, verifyEmail, forgotPassword, resetPassword, getMe };
