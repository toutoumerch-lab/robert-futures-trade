require('dotenv').config();
const { pool } = require('./config/db');

async function migrate() {
  try {
    console.log('Migrating database...');
    await pool.query('ALTER TABLE prop_firms ADD COLUMN IF NOT EXISTS plan_name TEXT');
    console.log('Column "plan_name" added successfully to "prop_firms" table.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();
