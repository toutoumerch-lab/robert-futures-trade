const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const https  = require('https');
const crypto = require('crypto');
const { sendMail, sendSmtpMail } = require('../utils/mailer');
const { pool } = require('../config/db');

/* ─────────────────────────────────────────────────────────────────
   Geo helpers
───────────────────────────────────────────────────────────────── */

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || null;
};

const lookupCountry = async (ip) => {
  if (!ip) return null;

  // Strip IPv6-mapped IPv4 prefix (::ffff:x.x.x.x)
  const cleanIp = ip.replace(/^::ffff:/, '');

  // Never geolocate loopback or private IPs — return null, not the server's country
  const isUnroutable = cleanIp === '::1' || cleanIp === '127.0.0.1' ||
    cleanIp.startsWith('127.') || cleanIp.startsWith('192.168.') ||
    cleanIp.startsWith('10.') || cleanIp.startsWith('172.');
  if (isUnroutable) return null;

  return new Promise((resolve) => {
    const url = `https://ipwho.is/${cleanIp}`;
    https.get(url, { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.success && json.country) {
            resolve({ country: json.country, country_code: json.country_code || null });
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null))
      .on('timeout', () => resolve(null));
  });
};

/* ─────────────────────────────────────────────────────────────────
   OTP email template
───────────────────────────────────────────────────────────────── */
const otpEmailHtml = (name, code) => `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;">
  <h2 style="margin:0 0 8px;color:#111827;font-size:22px;">Verify your email</h2>
  <p style="color:#6b7280;font-size:15px;margin:0 0 28px;">Hi ${name}, enter the code below to verify your Robert Trades account.</p>
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:28px;text-align:center;margin-bottom:28px;">
    <span style="font-size:44px;font-weight:800;letter-spacing:14px;color:#111827;font-family:monospace;">${code}</span>
  </div>
  <p style="color:#9ca3af;font-size:13px;margin:0;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
  <p style="color:#9ca3af;font-size:13px;margin:8px 0 0;">If you didn't create an account, you can safely ignore this email.</p>
</div>`;

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

/* ─────────────────────────────────────────────────────────────────
   POST /api/auth/register
───────────────────────────────────────────────────────────────── */
const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await pool.query('SELECT id, is_verified FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0 && userExists.rows[0].is_verified) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt          = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const verificationCode    = generateOtp();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const ip  = getClientIp(req);
    const geo = await lookupCountry(ip);

    if (userExists.rows.length > 0) {
      // Unverified user retrying — update their record
      await pool.query(
        `UPDATE users
         SET name = $1, password_hash = $2, verification_code = $3, verification_code_expires = $4
         WHERE email = $5`,
        [name, password_hash, verificationCode, verificationExpires, email]
      );
    } else {
      await pool.query(
        `INSERT INTO users
           (name, email, password_hash, role, country, country_code, is_verified, verification_code, verification_code_expires)
         VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8)`,
        [name, email, password_hash, 'user',
         geo?.country ?? null, geo?.country_code ?? null,
         verificationCode, verificationExpires]
      );
    }

    // Send email via SMTP (as requested, Resend removed)
    const mailResult = await sendMail(
      email,
      'Your verification code – Robert Trades',
      otpEmailHtml(name, verificationCode)
    );

    if (!mailResult.success) {
      console.log(`\n=== [MAIL FAILURE] DEV OTP for ${email}: ${verificationCode} ===\n`);
    }

    res.status(201).json({
      message: 'Registration successful. Please check your email for your 6-digit verification code.',
      email,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/* ─────────────────────────────────────────────────────────────────
   POST /api/auth/verify-otp
───────────────────────────────────────────────────────────────── */
const verifyOtp = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

  try {
    const result = await pool.query(
      `SELECT * FROM users
       WHERE email = $1
         AND verification_code = $2
         AND verification_code_expires > NOW()`,
      [email, code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const user = result.rows[0];
    await pool.query(
      `UPDATE users
       SET is_verified = true, verification_code = NULL, verification_code_expires = NULL
       WHERE id = $1`,
      [user.id]
    );

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, is_verified: true },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, is_verified: true },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/* ─────────────────────────────────────────────────────────────────
   POST /api/auth/resend-otp
───────────────────────────────────────────────────────────────── */
const resendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    if (user.is_verified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    const verificationCode    = generateOtp();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      `UPDATE users
       SET verification_code = $1, verification_code_expires = $2
       WHERE id = $3`,
      [verificationCode, verificationExpires, user.id]
    );

    const mailResult = await sendMail(
      email,
      'Your new verification code – Robert Trades',
      otpEmailHtml(user.name, verificationCode)
    );

    if (!mailResult.success) {
      console.log(`\n=== [MAIL FAILURE] DEV RESEND OTP for ${email}: ${verificationCode} ===\n`);
    }

    res.json({ message: 'Verification code resent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/* ─────────────────────────────────────────────────────────────────
   POST /api/auth/login
───────────────────────────────────────────────────────────────── */
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user          = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    pool.query('UPDATE users SET last_active_at = NOW() WHERE id = $1', [user.id]).catch(() => {});

    if (!user.country_code) {
      const ip = getClientIp(req);
      lookupCountry(ip).then(geo => {
        if (geo) {
          pool.query(
            'UPDATE users SET country = $1, country_code = $2 WHERE id = $3',
            [geo.country, geo.country_code, user.id]
          ).catch(() => {});
        }
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, is_verified: user.is_verified },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, is_verified: user.is_verified }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/* ─────────────────────────────────────────────────────────────────
   GET /api/auth/me
───────────────────────────────────────────────────────────────── */
const me = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, avatar_url, country, country_code, is_verified FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

/* ─────────────────────────────────────────────────────────────────
   POST /api/auth/backfill-countries  (admin only)
───────────────────────────────────────────────────────────────── */
const backfillCountries = async (req, res) => {
  try {
    const reqIp = getClientIp(req);
    const geo   = await lookupCountry(reqIp);
    if (!geo) {
      return res.status(503).json({ error: 'Could not detect location. Check internet connectivity.' });
    }
    const result = await pool.query(
      `UPDATE users SET country = $1, country_code = $2
       WHERE country_code IS NULL
       RETURNING id, name, email`,
      [geo.country, geo.country_code]
    );
    res.json({ updated: result.rowCount, country: geo.country, country_code: geo.country_code, users: result.rows });
  } catch (err) {
    console.error('[backfillCountries]', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/* ─────────────────────────────────────────────────────────────────
   PATCH /api/auth/users/:id/country  (admin only)
───────────────────────────────────────────────────────────────── */
const setUserCountry = async (req, res) => {
  const { id } = req.params;
  const { country, country_code } = req.body;
  if (!country || !country_code) {
    return res.status(400).json({ error: 'country and country_code are required' });
  }
  try {
    await pool.query(
      'UPDATE users SET country = $1, country_code = $2 WHERE id = $3',
      [country, country_code.toUpperCase(), id]
    );
    res.json({ success: true, country, country_code: country_code.toUpperCase() });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

/* ─────────────────────────────────────────────────────────────────
   POST /api/auth/forgot-password
───────────────────────────────────────────────────────────────── */
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const user = await pool.query('SELECT id, name FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(200).json({ message: 'If that email is registered, we have sent a reset link.' });
    }

    const resetToken   = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000);

    await pool.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3',
      [resetToken, resetExpires, email]
    );

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    const mailResult = await sendMail(
      email,
      'Password Reset Request – Robert Trades',
      `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;">
        <h2 style="margin:0 0 8px;color:#111827;">Reset your password</h2>
        <p style="color:#6b7280;margin:0 0 24px;">Hello ${user.rows[0].name}, click the button below to reset your password. This link is valid for 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;">Reset Password</a>
        <p style="color:#9ca3af;font-size:13px;margin:24px 0 0;">If you did not request this, please ignore this email.</p>
      </div>`
    );

    if (!mailResult.success) {
      console.log('--- FALLBACK: PASSWORD RESET ---');
      console.log('Reset Link:', resetUrl);
      return res.status(200).json({ message: 'Email failed to send', devResetUrl: resetUrl });
    }

    return res.status(200).json({
      message: 'If that email is registered, we have sent a reset link.',
      devResetUrl: resetUrl,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/* ─────────────────────────────────────────────────────────────────
   POST /api/auth/reset-password/:token
───────────────────────────────────────────────────────────────── */
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }
  try {
    const user = await pool.query(
      'SELECT id FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
      [token]
    );
    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired password reset token' });
    }
    const salt          = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
      [password_hash, user.rows[0].id]
    );
    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/* ─────────────────────────────────────────────────────────────────
   GET /api/auth/verify-email/:token  (legacy link-based, kept for compat)
───────────────────────────────────────────────────────────────── */
const verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const result = await pool.query('SELECT * FROM users WHERE verification_token = $1', [token]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification token.' });
    }
    const user = result.rows[0];
    await pool.query('UPDATE users SET is_verified = true, verification_token = NULL WHERE id = $1', [user.id]);
    res.json({ message: 'Email successfully verified!' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  register, login, me,
  verifyOtp, resendOtp,
  backfillCountries, setUserCountry,
  forgotPassword, resetPassword, verifyEmail,
};
