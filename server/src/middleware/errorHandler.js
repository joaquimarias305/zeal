const logger = require('../config/logger');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, _next) => {
  const status = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  if (status >= 500) {
    logger.error(`${req.method} ${req.path} – ${err.message}`, { stack: err.stack });
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { AppError, errorHandler };
