require('dotenv').config({ path: '../.env' });
const { pool } = require('../config/db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE prop_firms
      ADD COLUMN IF NOT EXISTS group_name  TEXT,
      ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP DEFAULT NOW();
    `);
    console.log('✅  Missing columns added: group_name, updated_at');
  } catch (err) {
    console.error('❌  Error:', err.message);
  } finally {
    client.release();
    process.exit(0);
  }
};

migrate();
