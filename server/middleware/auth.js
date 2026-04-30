const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// In-memory cache to prevent spamming the database with update queries on every single request.
// Only update the database if the user hasn't been seen in the last 1 minute (60000ms).
const activeUsersCache = new Map();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.user = user;

    // --- Online Status Tracking ---
    const now = Date.now();
    const lastUpdate = activeUsersCache.get(user.id);
    if (!lastUpdate || now - lastUpdate > 60000) {
      activeUsersCache.set(user.id, now);
      // Fire-and-forget DB update
      pool.query('UPDATE users SET last_active_at = NOW() WHERE id = $1', [user.id])
          .catch(err => console.error('[Auth Middleware] Failed to update last_active_at:', err));
    }
    // ------------------------------

    next();
  });
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return next();

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (!err && user) {
      req.user = user;
    }
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Requires admin privileges.' });
  }
};

module.exports = { authenticateToken, isAdmin, optionalAuth };
