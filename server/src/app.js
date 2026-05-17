require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const logger = require('./config/logger');
const { errorHandler } = require('./middleware/errorHandler');

// ─── Routes ─────────────────────────────────────────────────────────────────
const authRoutes     = require('./routes/auth');
const workerRoutes   = require('./routes/workers');
const businessRoutes = require('./routes/businesses');
const shiftRoutes    = require('./routes/shifts');
const paymentRoutes  = require('./routes/payments');
const reviewRoutes   = require('./routes/reviews');
const adminRoutes    = require('./routes/admin');
const notifRoutes    = require('./routes/notifications');
const uploadRoutes   = require('./routes/uploads');

const app = express();

// ─── Security & middleware ───────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Stripe webhooks need raw body — mount BEFORE express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// ─── Global rate limiter ─────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// ─── API routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/workers',       workerRoutes);
app.use('/api/businesses',    businessRoutes);
app.use('/api/shifts',        shiftRoutes);
app.use('/api/payments',      paymentRoutes);
app.use('/api/reviews',       reviewRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/uploads',      uploadRoutes);

// Serve local upload files in dev
if (process.env.NODE_ENV !== 'production') {
  const path = require('path');
  app.use('/uploads', require('express').static(path.join(__dirname, '../uploads')));
}

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ─── Error handler ───────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`ShiftMIA API running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = app;
