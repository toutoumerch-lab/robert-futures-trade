const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// GET all users (admin only)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, country, country_code, created_at, last_active_at FROM users ORDER BY created_at DESC'
    );
    
    const now = new Date();
    const usersWithStatus = result.rows.map(user => {
      let is_online = false;
      if (user.last_active_at) {
        const lastActive = new Date(user.last_active_at);
        // User is considered online if active within the last 5 minutes
        is_online = (now - lastActive) < 5 * 60 * 1000;
      }
      return { ...user, is_online };
    });

    res.json(usersWithStatus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH user role (admin only)
router.patch('/:id/role', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  try {
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE user (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
