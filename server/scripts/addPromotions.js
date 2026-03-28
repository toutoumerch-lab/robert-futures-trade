const { pool } = require('../config/db');

const addPromotionsTable = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS promotions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        code VARCHAR(100) NOT NULL UNIQUE,
        status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅  promotions table created (or already exists).');
  } catch (err) {
    console.error('Error creating promotions table:', err.message);
  } finally {
    client.release();
    process.exit(0);
  }
};

addPromotionsTable();
