const { pool } = require('../config/db');

// GET all active promotions (public - used by banner)
const getActivePromotions = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM promotions
      WHERE status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET all promotions (admin)
const getAllPromotions = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM promotions ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST create promotion (admin)
const createPromotion = async (req, res) => {
  const { title, code, status = 'inactive', expires_at, ticker_speed = 40 } = req.body;
  if (!title || !code) return res.status(400).json({ error: 'title and code are required' });
  try {
    const result = await pool.query(
      `INSERT INTO promotions (title, code, status, expires_at, ticker_speed)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, code.toUpperCase(), status, expires_at || null, Number(ticker_speed)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Promotion code already exists' });
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT update promotion (admin)
const updatePromotion = async (req, res) => {
  const { id } = req.params;
  const { title, code, status, expires_at, ticker_speed = 40 } = req.body;
  try {
    const result = await pool.query(
      `UPDATE promotions
       SET title=$1, code=$2, status=$3, expires_at=$4, ticker_speed=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [title, code?.toUpperCase(), status, expires_at || null, Number(ticker_speed), id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Promotion not found' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Promotion code already exists' });
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE promotion (admin)
const deletePromotion = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM promotions WHERE id = $1', [id]);
    res.json({ message: 'Promotion deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getActivePromotions, getAllPromotions, createPromotion, updatePromotion, deletePromotion };
