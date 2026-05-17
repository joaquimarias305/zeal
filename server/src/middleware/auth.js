const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const { query } = require('../config/db');

const authenticate = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await query(
      'SELECT id, type, name, email, language, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!rows[0]) throw new AppError('User not found', 401);
    if (!rows[0].is_active) throw new AppError('Account suspended', 403);

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') return next(new AppError('Invalid token', 401));
    if (err.name === 'TokenExpiredError') return next(new AppError('Token expired', 401));
    next(err);
  }
};

const requireRole = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.type)) {
    return next(new AppError('Forbidden: insufficient role', 403));
  }
  next();
};

module.exports = { authenticate, requireRole };
