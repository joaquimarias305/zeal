require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');
const logger = require('./logger');

async function seed() {
  const seedPath = path.join(__dirname, '../../../database/seed.sql');
  const sql = fs.readFileSync(seedPath, 'utf8');
  logger.info('Running seed…');
  await pool.query(sql);
  logger.info('Seed complete.');
  await pool.end();
}

seed().catch((err) => {
  logger.error('Seed failed', err);
  process.exit(1);
});
