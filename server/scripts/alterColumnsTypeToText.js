require('dotenv').config({ path: '../.env' });
const { pool } = require('../config/db');

const alterFields = async () => {
  const client = await pool.connect();
  try {
    // Convert all flexible text fields from INTEGER/other to TEXT
    await client.query(`
      ALTER TABLE prop_firms
      ALTER COLUMN profit_target    TYPE TEXT USING profit_target::TEXT,
      ALTER COLUMN max_withdrawal   TYPE TEXT USING max_withdrawal::TEXT,
      ALTER COLUMN drawdown_limit   TYPE TEXT USING drawdown_limit::TEXT,
      ALTER COLUMN days_to_pass     TYPE TEXT USING days_to_pass::TEXT,
      ALTER COLUMN days_to_payout   TYPE TEXT USING days_to_payout::TEXT,
      ALTER COLUMN max_accounts     TYPE TEXT USING max_accounts::TEXT,
      ALTER COLUMN dll              TYPE TEXT USING dll::TEXT,
      ALTER COLUMN eval             TYPE TEXT USING eval::TEXT,
      ALTER COLUMN pa               TYPE TEXT USING pa::TEXT,
      ALTER COLUMN reset_fee        TYPE TEXT USING reset_fee::TEXT,
      ALTER COLUMN buffer_amount    TYPE TEXT USING buffer_amount::TEXT;
    `);
    console.log('✅  All flexible columns converted to TEXT.');

    // Drop unused columns if they still exist
    await client.query(`
      ALTER TABLE prop_firms
      DROP COLUMN IF EXISTS evaluation_fee,
      DROP COLUMN IF EXISTS promo_frequency;
    `);
    console.log('✅  Unused columns dropped (if they existed).');
  } catch (error) {
    console.error('❌  Error:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
};

alterFields();
