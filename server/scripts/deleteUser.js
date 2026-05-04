const { pool } = require('../config/db');
pool.query("DELETE FROM users WHERE email = 'nourelhouda.abdellaoui2023@gmail.com'").then(() => {
  console.log('Deleted');
  process.exit(0);
});
