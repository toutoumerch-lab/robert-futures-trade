const { pool } = require('../config/db');

const addTwoFields = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE prop_firms 
      ADD COLUMN IF NOT EXISTS max_accounts INTEGER,
      ADD COLUMN IF NOT EXISTS dll INTEGER;
    `);
    console.log('Added max_accounts and dll to prop_firms table.');
  } catch (error) {
    console.error('Error altering table:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
};

addTwoFields();
