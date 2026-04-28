const { pool } = require('../config/db');

(async () => {
  try {
    // Add country and country_code columns to users if they don't exist
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS country      VARCHAR(100),
        ADD COLUMN IF NOT EXISTS country_code CHAR(2);
    `);
    console.log('✅ country + country_code columns added to users table');

    // Index for fast COUNT(DISTINCT country) queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_country_code ON users(country_code);
    `);
    console.log('✅ Index on country_code created');
  } catch (e) {
    console.error('Migration error:', e.message);
  } finally {
    pool.end();
  }
})();
