const { Pool } = require('pg');
const logger = require('./logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  // Force IPv4 — Render free tier has no IPv6 support
  ...(process.env.NODE_ENV === 'production' && { family: 4 }),
});

pool.on('error', (err) => {
  logger.error('Unexpected PG pool error', err);
});

pool.on('connect', () => {
  logger.debug('New PG connection established');
});

const query = (text, params) => pool.query(text, params);

const getClient = () => pool.connect();

module.exports = { pool, query, getClient };
