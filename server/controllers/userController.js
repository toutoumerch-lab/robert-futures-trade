const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
const path = require('path');
const fs = require('fs');

/* ── PATCH /api/users/me/profile ── */
const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, email } = req.body;

  if (!name?.trim() && !email?.trim()) {
    return res.status(400).json({ error: 'Provide name or email to update.' });
  }

  try {
    if (email?.trim()) {
      if (!/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ error: 'Invalid email address.' });
      }
      const existing = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.trim().toLowerCase(), userId]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Email already in use by another account.' });
      }
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (name?.trim())  { fields.push(`name = $${idx++}`);  values.push(name.trim()); }
    if (email?.trim()) { fields.push(`email = $${idx++}`); values.push(email.trim().toLowerCase()); }
    values.push(userId);

    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, email, role, avatar_url, country, country_code, is_verified`,
      values
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[userController] updateProfile:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

/* ── POST /api/users/me/avatar ── */
const uploadAvatar = async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const avatarUrl = '/uploads/avatars/' + req.file.filename;

  try {
    // Delete old avatar file if it exists
    const prev = await pool.query('SELECT avatar_url FROM users WHERE id = $1', [userId]);
    if (prev.rows[0]?.avatar_url) {
      const oldPath = path.join(__dirname, '../public', prev.rows[0].avatar_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const result = await pool.query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, name, email, role, avatar_url, country, country_code, is_verified',
      [avatarUrl, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[userController] uploadAvatar:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

/* ── DELETE /api/users/me/avatar ── */
const removeAvatar = async (req, res) => {
  const userId = req.user.id;
  try {
    const prev = await pool.query('SELECT avatar_url FROM users WHERE id = $1', [userId]);
    if (prev.rows[0]?.avatar_url) {
      const oldPath = path.join(__dirname, '../public', prev.rows[0].avatar_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    const result = await pool.query(
      'UPDATE users SET avatar_url = NULL WHERE id = $1 RETURNING id, name, email, role, avatar_url, country, country_code, is_verified',
      [userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[userController] removeAvatar:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

/* ── PATCH /api/users/me/password ── */
const changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });

    const match = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect.' });

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('[userController] changePassword:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

/* ── GET /api/users/me/prop-firm-views ── */
const getMyPropFirmViews = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT pf.id, pf.name, pf.logo_url, pf.group_name, pf.rating, pf.website, pf.affiliate_link, upv.viewed_at
       FROM user_prop_firm_views upv
       JOIN prop_firms pf ON pf.id = upv.firm_id
       WHERE upv.user_id = $1
       ORDER BY upv.viewed_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[userController] getMyPropFirmViews:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { updateProfile, uploadAvatar, removeAvatar, changePassword, getMyPropFirmViews };
