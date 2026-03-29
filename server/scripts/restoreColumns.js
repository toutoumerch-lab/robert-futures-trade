require('dotenv').config({ path: '../.env' });
const { pool } = require('../config/db');

const addMissingColumns = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE prop_firms
      ADD COLUMN IF NOT EXISTS evaluation_fee TEXT,
      ADD COLUMN IF NOT EXISTS promo_frequency TEXT;
    `);
    console.log('Restored dropped columns to fix the 500 error from the running old Node server.');
  } catch (error) {
    console.error('Error altering table:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
};

addMissingColumns();
