const { pool } = require('../config/db');

const updatePropFirmsDb = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Drop existing table to ensure clean slate
    await client.query(`DROP TABLE IF EXISTS prop_firms;`);

    // Create the updated table
    await client.query(`
      CREATE TABLE prop_firms (
        id SERIAL PRIMARY KEY,
        name TEXT,
        importance TEXT,
        featured BOOLEAN DEFAULT false,
        rating FLOAT,
        website TEXT,
        affiliate_link TEXT,
        twitter TEXT,
        discord TEXT,
        last_checked DATE,
        promo_frequency TEXT,
        is_affiliate BOOLEAN DEFAULT false,
        discount_code TEXT,
        overall_score FLOAT,
        platforms TEXT,
        account_category TEXT,
        price INTEGER,
        evaluation_fee INTEGER,
        activation_fee INTEGER,
        profit_split TEXT,
        max_withdrawal INTEGER,
        profit_target INTEGER,
        drawdown_limit INTEGER,
        days_to_pass INTEGER,
        days_to_payout INTEGER,
        notes TEXT,
        status_color VARCHAR(10) DEFAULT 'green' CHECK (status_color IN ('green', 'blue', 'yellow', 'red')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('Database updated: prop_firms table has been recreated with all new fields.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating database:', error);
  } finally {
    client.release();
    process.exit(0);
  }
};

updatePropFirmsDb();
