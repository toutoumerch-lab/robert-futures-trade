const { pool } = require('../config/db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT
      );
    `);

    // Insert default settings if they don't exist
    await client.query(`
      INSERT INTO settings (key, value)
      VALUES ('site_name', 'Robert''s Trades')
      ON CONFLICT (key) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('Migration successful: settings table created.');
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Migration failed:', error);
  } finally {
    if (client) client.release();
    process.exit(0);
  }
};

migrate();
