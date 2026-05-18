const dns = require('dns');
const { Pool } = require('pg');
const logger = require('./logger');

// Render free tier has no IPv6 routing — patch dns.lookup to always prefer IPv4
if (process.env.NODE_ENV === 'production') {
  const _lookup = dns.lookup.bind(dns);
  dns.lookup = (hostname, options, callback) => {
    if (typeof options === 'function') { callback = options; options = {}; }
    if (typeof options === 'number') { options = { family: options }; }
    return _lookup(hostname, { ...options, family: 4 }, callback);
  };
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
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
