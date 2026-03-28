const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

const createAdmin = async () => {
  const name = 'Admin User';
  const email = 'admin@example.com';
  const password = 'password123';
  const role = 'admin';

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const res = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET role = $4 RETURNING id, name, email, role',
      [name, email, hashedPassword, role]
    );

    console.log('✅ Admin user created/updated:', res.rows[0]);
  } catch (err) {
    console.error('Error creating admin user:', err.message);
  } finally {
    process.exit(0);
  }
};

createAdmin();
