require('dotenv').config();
const { pool } = require('./config/db');

async function check() {
  try {
    const res = await pool.query('SELECT id, email, role, created_at FROM users');
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

check();
