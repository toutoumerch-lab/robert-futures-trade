const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'admin',
  host: 'localhost',
  port: 5432,
  database: 'roberts_trades_db',
});

const NEW_PASSWORD = 'Admin@1234';
const ADMIN_EMAIL  = 'admin@example.com';

async function resetPassword() {
  const hash = await bcrypt.hash(NEW_PASSWORD, 10);
  const result = await pool.query(
    'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email, role',
    [hash, ADMIN_EMAIL]
  );
  if (result.rows.length === 0) {
    console.log('❌ No user found with email:', ADMIN_EMAIL);
  } else {
    const u = result.rows[0];
    console.log('✅ Password reset successfully!');
    console.log('   Email   :', u.email);
    console.log('   Role    :', u.role);
    console.log('   New pass: ' + NEW_PASSWORD);
  }
  await pool.end();
}

resetPassword().catch(e => { console.error('❌', e.message); pool.end(); });
