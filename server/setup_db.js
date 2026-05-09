const { pool } = require('./config/db');

pool.query('CREATE TABLE IF NOT EXISTS contact_messages (id SERIAL PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), subject VARCHAR(255), message TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)')
  .then(() => {
    console.log('Table contact_messages created successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to create table:', err);
    process.exit(1);
  });
