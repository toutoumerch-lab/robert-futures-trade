const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const https  = require('https');
const crypto = require('crypto');
const { sendMail } = require('../utils/mailer');
const { pool } = require('../config/db');

/* ─────────────────────────────────────────────────────────────────
   Geo helpers
───────────────────────────────────────────────────────────────── */

/** Extract the real client IP from the request (handles proxies) */
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || null;
};

/** Fetch the server's own public IP from ipify (used as fallback on localhost) */
const getServerPublicIp = () => new Promise((resolve) => {
  https.get('https://api.ipify.org?format=json', { timeout: 3000 }, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      try { resolve(JSON.parse(d).ip || null); } catch { resolve(null); }
    });
  }).on('error', () => resolve(null)).on('timeout', () => resolve(null));
});

/**
 * Lookup country from IP using ipwho.is (free, no key, HTTPS).
 * Returns { country, country_code } or null on any failure.
 * Never throws — geo detection is best-effort only.
 * On localhost: falls back to the server's own public IP.
 */
const lookupCountry = async (ip) => {
  // Detect localhost / loopback / private IPs
  const isLocal = !ip || ip === '::1' || ip.startsWith('127.') ||
                  ip.startsWith('192.168.') || ip.startsWith('10.');

  // Use server's own public IP as a fallback during local development
  const resolvedIp = isLocal ? await getServerPublicIp() : ip;
  if (!resolvedIp) return null;

  // Strip IPv6-mapped IPv4 prefix (::ffff:x.x.x.x)
  const cleanIp = resolvedIp.replace(/^::ffff:/, '');

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
   POST /api/auth/register
───────────────────────────────────────────────────────────────── */
const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt          = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const isVerified = false;

    // Detect country in parallel — non-blocking
    const ip  = getClientIp(req);
    const geo = await lookupCountry(ip);

    const newUser = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, country, country_code, verification_token, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, email, role, country, country_code, is_verified`,
      [name, email, password_hash, 'user', geo?.country ?? null, geo?.country_code ?? null, verificationToken, isVerified]
    );

    const user  = newUser.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, is_verified: user.is_verified },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send Verification Email
    const verificationUrl = `http://localhost:5173/verify-email/${verificationToken}`;
    
    // Call Nodemailer
    const mailResult = await sendMail(
      email,
      'Verify your email address - Robert Trades',
      `<p>Hi ${name},</p><p>Welcome to Robert Trades! Please click the link below to verify your email address:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`
    );

    if (!mailResult.success) {
      console.log(`\n=== DEV MODE: EMAIL VERIFICATION ===\nLink for ${email}: ${verificationUrl}\n====================================\n`);
      return res.status(201).json({ token, user, message: 'Registration successful. Email sending failed, check devVerificationUrl.', devVerificationUrl: verificationUrl });
    }

    // Always log it and return it in dev so the user can test without verified domains
    console.log(`\n=== VERIFICATION LINK ===\nLink for ${email}: ${verificationUrl}\n=========================\n`);
    res.status(201).json({ token, user, message: 'Registration successful. Please check your email to verify your account.', devVerificationUrl: verificationUrl });
  } catch (error) {
    console.error('Register error:', error);
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

    // Update country if we don't have it yet, and update last_active_at
    const updatePromises = [];
    updatePromises.push(pool.query('UPDATE users SET last_active_at = NOW() WHERE id = $1', [user.id]));
    
    if (!user.country_code) {
      const ip  = getClientIp(req);
      lookupCountry(ip).then(geo => {
        if (geo) {
          pool.query(
            'UPDATE users SET country = $1, country_code = $2 WHERE id = $3',
            [geo.country, geo.country_code, user.id]
          ).catch(() => {});
        }
      });
    }

    Promise.all(updatePromises).catch(() => {}); // fire-and-forget

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
      'SELECT id, name, email, role, country, country_code, is_verified FROM users WHERE id = $1',
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
   Detects the server's public IP → geolocates it → applies to all
   users with missing country. Useful for localhost dev.
───────────────────────────────────────────────────────────────── */
const backfillCountries = async (req, res) => {
  try {
    // Use server's public IP (or the requester's if it's a real IP)
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

    res.json({
      updated: result.rowCount,
      country: geo.country,
      country_code: geo.country_code,
      users: result.rows,
    });
  } catch (err) {
    console.error('[backfillCountries]', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/* ─────────────────────────────────────────────────────────────────
   PATCH /api/auth/users/:id/country  (admin only)
   Manually set a specific user's country
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
      // Return 200 even if not found to prevent email enumeration
      return res.status(200).json({ message: 'If that email is registered, we have sent a reset link.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    await pool.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3',
      [resetToken, resetExpires, email]
    );

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    const mailResult = await sendMail(
      email,
      'Password Reset Request - Robert Trades',
      `<p>Hello ${user.rows[0].name},</p>
       <p>You requested a password reset. Click the link below to reset your password:</p>
       <p><a href="${resetUrl}">${resetUrl}</a></p>
       <p>If you did not request this, please ignore this email.</p>
       <p>This link is valid for 1 hour.</p>`
    );

    if (!mailResult.success) {
      console.error('❌ Nodemailer Error:', mailResult.error);
      console.log('--- FALLBACK: PASSWORD RESET SIMULATION ---');
      console.log('To:', email);
      console.log('Reset Link:', resetUrl);
      console.log('-------------------------------------------');
      // Return the link to the frontend for easy testing if email fails
      return res.status(200).json({ 
        message: 'Email failed to send, but here is your reset link (Dev Mode)', 
        devResetUrl: resetUrl 
      });
    } else {
      console.log('✅ Password reset email sent via Nodemailer to:', email);
      return res.status(200).json({ 
        message: 'If that email is registered, we have sent a reset link.',
        devResetUrl: resetUrl // Kept for easy dev testing 
      });
    }
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

    const salt = await bcrypt.genSalt(10);
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
   GET /api/auth/verify-email/:token
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

module.exports = { register, login, me, backfillCountries, setUserCountry, forgotPassword, resetPassword, verifyEmail };
