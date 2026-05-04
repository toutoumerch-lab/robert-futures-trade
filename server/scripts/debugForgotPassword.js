require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('../config/db');
const crypto = require('crypto');
const { sendMail } = require('../utils/mailer');

async function run() {
  const email = 'nourabdellaoui2018@gmail.com';

  console.log('=== ENV CHECK ===');
  console.log('GMAIL_USER:', process.env.GMAIL_USER);
  console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '***set***' : 'NOT SET');
  console.log('CLIENT_URL:', process.env.CLIENT_URL);

  console.log('\n=== DB CHECK ===');
  const user = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
  if (!user.rows[0]) { console.log('ERROR: User not found for', email); await pool.end(); return; }
  console.log('User found:', user.rows[0]);

  console.log('\n=== GENERATE TOKEN ===');
  const resetToken   = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 3600000);
  console.log('Token:', resetToken.substring(0, 20) + '...');
  console.log('Expires:', resetExpires);

  console.log('\n=== SAVE TO DB ===');
  await pool.query(
    'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3',
    [resetToken, resetExpires, email]
  );
  // Verify it was saved
  const verify = await pool.query('SELECT reset_password_token, reset_password_expires FROM users WHERE email=$1', [email]);
  console.log('Saved token matches:', verify.rows[0].reset_password_token === resetToken ? 'YES ✓' : 'NO ✗');
  console.log('Expires saved:', verify.rows[0].reset_password_expires);

  console.log('\n=== SEND EMAIL ===');
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
  console.log('Reset URL:', resetUrl);

  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;">
    <h2 style="margin:0 0 8px;color:#111827;">Reset your password</h2>
    <p style="color:#6b7280;margin:0 0 24px;">Hello ${user.rows[0].name}, click the button below to reset your password. This link is valid for 1 hour.</p>
    <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;">Reset Password</a>
    <p style="color:#9ca3af;font-size:13px;margin:24px 0 0;">If you did not request this, please ignore this email.</p>
  </div>`;

  const result = await sendMail(email, 'Password Reset Request – Robert Trades', html);
  console.log('sendMail result:', JSON.stringify(result, null, 2));

  await pool.end();
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
