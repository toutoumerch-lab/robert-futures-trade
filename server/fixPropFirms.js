require('dotenv').config();
const { pool } = require('./config/db');

async function fix() {
  try {
    await pool.query('ALTER TABLE prop_firms ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT FALSE');
    console.log('Added hidden column to prop_firms.');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
fix();
