const { pool } = require('../config/db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('ALTER TABLE prop_firms ADD COLUMN IF NOT EXISTS buffer_amount TEXT DEFAULT NULL');
    console.log('SUCCESS: Column buffer_amount added to prop_firms table');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    client.release();
    process.exit(0);
  }
};

migrate();
