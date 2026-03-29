const { pool } = require('../config/db');

const addMoreFields = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE prop_firms 
      ADD COLUMN IF NOT EXISTS buffer BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS eval TEXT,
      ADD COLUMN IF NOT EXISTS pa TEXT,
      ADD COLUMN IF NOT EXISTS reset_fee INTEGER,
      ADD COLUMN IF NOT EXISTS copy_trade BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS vpn BOOLEAN DEFAULT false;
    `);
    console.log('Added new fields to prop_firms table.');
  } catch (error) {
    console.error('Error altering table:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
};

addMoreFields();
