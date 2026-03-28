/**
 * Migration: add ticker_speed column to promotions table
 * Run once: node server/scripts/addTickerSpeed.js
 */
require('dotenv').config();
const { pool } = require('../config/db');

(async () => {
  try {
    await pool.query(`
      ALTER TABLE promotions
        ADD COLUMN IF NOT EXISTS ticker_speed INTEGER NOT NULL DEFAULT 40;
    `);
    console.log('✅  ticker_speed column added (default 40s).');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await pool.end();
  }
})();
