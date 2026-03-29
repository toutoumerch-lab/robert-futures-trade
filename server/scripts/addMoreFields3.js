const { pool } = require('../config/db');

const addFields = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE prop_firms 
      ADD COLUMN IF NOT EXISTS fifty_k_all_in INTEGER,
      ADD COLUMN IF NOT EXISTS fifty_k_initial_cost INTEGER,
      ADD COLUMN IF NOT EXISTS without_discount_usd INTEGER,
      ADD COLUMN IF NOT EXISTS discount_usd INTEGER,
      ADD COLUMN IF NOT EXISTS discount_percent INTEGER,
      ADD COLUMN IF NOT EXISTS dca BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS news BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS bots BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS micro_scalping BOOLEAN DEFAULT false;
    `);
    console.log('Added 9 new fields to prop_firms table.');
  } catch (error) {
    console.error('Error altering table:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
};

addFields();
