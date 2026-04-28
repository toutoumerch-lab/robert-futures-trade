require('dotenv').config();
const { pool } = require('../config/db');

(async () => {
  try {
    const r = await pool.query(
      "UPDATE users SET country = 'Tunisia', country_code = 'TN' WHERE country_code IS NULL RETURNING id, name, email"
    );
    console.log('Updated ' + r.rowCount + ' users:');
    r.rows.forEach(u => console.log(' - ' + u.name + ' (' + u.email + ')'));

    // Verify
    const check = await pool.query('SELECT id, name, country, country_code FROM users');
    console.log('\nAll users after update:');
    check.rows.forEach(u => console.log(' ' + u.name + ' -> ' + u.country + ' (' + u.country_code + ')'));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
})();
