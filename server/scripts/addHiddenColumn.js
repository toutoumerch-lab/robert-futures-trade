require('dotenv').config({ path: '../.env' });
const { pool } = require('../config/db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE prop_firms
      ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT FALSE;
    `);
    console.log('✅  hidden column added to prop_firms');
  } catch (err) {
    console.error('❌  Error:', err.message);
  } finally {
    client.release();
    process.exit(0);
  }
};

migrate();
