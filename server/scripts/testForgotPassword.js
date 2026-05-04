require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('../config/db');
const crypto = require('crypto');
const { sendMail } = require('../utils/mailer');

async function run() {
  // 1. Check columns exist
  const cols = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name IN ('reset_password_token','reset_password_expires')"
  );
  console.log('Reset columns in DB:', cols.rows.map(c => c.column_name));

  // 2. Find the admin user
  const user = await pool.query("SELECT id, name, email FROM users WHERE email='nourabdellaoui2018@gmail.com'");
  if (!user.rows[0]) { console.log('User not found'); await pool.end(); return; }
  console.log('User found:', user.rows[0].name, user.rows[0].email);

  // 3. Generate token and save it
  const token   = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000);
  await pool.query(
    'UPDATE users SET reset_password_token=$1, reset_password_expires=$2 WHERE id=$3',
    [token, expires, user.rows[0].id]
  );
  console.log('Token saved to DB ✓');

  // 4. Test sending the email
  const resetUrl = `http://localhost:5173/reset-password/${token}`;
  const result = await sendMail(
    user.rows[0].email,
    'Test: Password Reset – Robert Trades',
    `<p>Click to reset: <a href="${resetUrl}">${resetUrl}</a></p>`
  );
  console.log('Email result:', result.success ? 'SENT ✓' : 'FAILED ✗', result.error?.message || '');
  console.log('Reset URL:', resetUrl);

  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
