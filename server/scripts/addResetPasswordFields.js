const { pool } = require('../config/db');

const addResetFields = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;
    `);

    await client.query('COMMIT');
    console.log('✅ Successfully added reset password fields to users table.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating users table:', error);
  } finally {
    client.release();
    process.exit(0);
  }
};

addResetFields();
