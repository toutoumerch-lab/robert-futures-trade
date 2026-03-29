const { pool } = require('../config/db');

const addStatusColor = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE prop_firms 
      ADD COLUMN status_color VARCHAR(10) DEFAULT 'green';
    `);
    console.log('Added status_color column to prop_firms table.');
  } catch (error) {
    console.error('Error altering table:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
};

addStatusColor();
