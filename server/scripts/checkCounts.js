require('dotenv').config();
const { pool } = require('../config/db');

async function check() {
  try {
    const res = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM courses'),
      pool.query('SELECT COUNT(*) FROM enrollments'),
      pool.query('SELECT COUNT(*) FROM payments')
    ]);
    console.log(`Users: ${res[0].rows[0].count}, Courses: ${res[1].rows[0].count}, Enrollments: ${res[2].rows[0].count}, Payments: ${res[3].rows[0].count}`);
  } catch (e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
}
check();
