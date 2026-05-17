require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');
const logger = require('./logger');

async function migrate() {
  const schemaPath = path.join(__dirname, '../../../database/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  logger.info('Running migrations…');
  await pool.query(sql);
  logger.info('Migrations complete.');
  await pool.end();
}

migrate().catch((err) => {
  logger.error('Migration failed', err);
  process.exit(1);
});
