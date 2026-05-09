const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'roberts_trades_db',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
});

pool.query('ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;')
  .then(() => {
    console.log('Added is_published column successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error adding column:', err);
    process.exit(1);
  });
