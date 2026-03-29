require('dotenv').config({ path: '../.env' });
const { pool } = require('../config/db');

const alterFields = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE prop_firms 
      ALTER COLUMN profit_target TYPE TEXT USING profit_target::TEXT,
      ALTER COLUMN max_withdrawal TYPE TEXT USING max_withdrawal::TEXT,
      ALTER COLUMN days_to_pass TYPE TEXT USING days_to_pass::TEXT,
      ALTER COLUMN days_to_payout TYPE TEXT USING days_to_payout::TEXT,
      ALTER COLUMN max_accounts TYPE TEXT USING max_accounts::TEXT,
      ALTER COLUMN dll TYPE TEXT USING dll::TEXT;
    `);
    
    // Also drop evaluation_fee and promo_frequency if we want (optional, but requested to be deleted from form, might be good to keep DB clean, but keeping them doesn't hurt).
    await client.query(`
      ALTER TABLE prop_firms
      DROP COLUMN IF EXISTS evaluation_fee,
      DROP COLUMN IF EXISTS promo_frequency;
    `);
    console.log('Altered columns to TEXT and dropped unused columns.');
  } catch (error) {
    console.error('Error altering table:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
};

alterFields();
