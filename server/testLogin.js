require('dotenv').config();
const { pool } = require('./config/db');
const bcrypt = require('bcrypt');

async function test() {
  const email = 'admin@roberttrades.com';
  const password = 'Admin@1234!';
  try {
    const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (res.rows.length === 0) {
      console.log('User not found!');
      return;
    }
    const user = res.rows[0];
    console.log('User found:', user.email, 'Role:', user.role);
    const valid = await bcrypt.compare(password, user.password_hash);
    console.log('Password valid:', valid);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
test();
