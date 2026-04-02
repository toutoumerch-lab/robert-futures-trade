const { pool } = require('../config/db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    // Change reset_fee from INTEGER to TEXT so values like "N/A" can be stored
    await client.query('ALTER TABLE prop_firms ALTER COLUMN reset_fee TYPE TEXT USING reset_fee::TEXT');
    console.log('SUCCESS: reset_fee column changed from INTEGER to TEXT');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    client.release();
    process.exit(0);
  }
};

migrate();
