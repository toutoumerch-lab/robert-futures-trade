const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const https  = require('https');
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

/**
 * Lookup country from IP using ipwho.is (free, no key, HTTPS).
 * Returns { country, country_code } or null on any failure.
 * Never throws — geo detection is best-effort only.
 */
const lookupCountry = (ip) =>
  new Promise((resolve) => {
    // Skip loopback / private IPs (localhost dev)
    if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return resolve(null);
    }

    // Strip IPv6-mapped IPv4 prefix (::ffff:x.x.x.x)
    const cleanIp = ip.replace(/^::ffff:/, '');

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

    // Detect country in parallel — non-blocking
    const ip  = getClientIp(req);
    const geo = await lookupCountry(ip);

    const newUser = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, country, country_code)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, country, country_code`,
      [name, email, password_hash, 'user', geo?.country ?? null, geo?.country_code ?? null]
    );

    const user  = newUser.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user });
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

    // Update country if we don't have it yet (backfills existing users)
    if (!user.country_code) {
      const ip  = getClientIp(req);
      const geo = await lookupCountry(ip);
      if (geo) {
        pool.query(
          'UPDATE users SET country = $1, country_code = $2 WHERE id = $3',
          [geo.country, geo.country_code, user.id]
        ).catch(() => {}); // fire-and-forget
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
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
      'SELECT id, name, email, role, country, country_code FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { register, login, me };
