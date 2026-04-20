const { pool } = require('../config/db');

// ─── GET /api/categories ─────────────────────────────────────────────────────
const getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─── POST /api/categories ────────────────────────────────────────────────────
const createCategory = async (req, res) => {
  const raw = (req.body.name || '').trim();
  if (!raw) return res.status(400).json({ message: 'Category name is required.' });

  // Capitalise first letter, strip dangerous chars
  const name = raw.charAt(0).toUpperCase() + raw.slice(1);

  try {
    // Return conflict as 409 so the frontend can handle it cleanly
    const existing = await pool.query('SELECT * FROM categories WHERE LOWER(name) = LOWER($1)', [name]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Category already exists.', category: existing.rows[0] });
    }

    const result = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─── PATCH /api/categories/:id ───────────────────────────────────────────────
const updateCategory = async (req, res) => {
  const { id } = req.params;
  const raw = (req.body.name || '').trim();
  if (!raw) return res.status(400).json({ message: 'Category name is required.' });
  const name = raw.charAt(0).toUpperCase() + raw.slice(1);

  try {
    const catResult = await pool.query('SELECT name FROM categories WHERE id = $1', [id]);
    if (catResult.rows.length === 0) return res.status(404).json({ message: 'Category not found.' });
    const oldName = catResult.rows[0].name;

    // Check for name collision
    const collision = await pool.query(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND id != $2',
      [name, id]
    );
    if (collision.rows.length > 0) return res.status(409).json({ message: 'A category with that name already exists.' });

    const result = await pool.query(
      'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );

    // Cascade rename to courses and posts
    await pool.query('UPDATE courses SET category = $1 WHERE category = $2', [name, oldName]);
    await pool.query('UPDATE posts   SET category = $1 WHERE category = $2', [name, oldName]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─── DELETE /api/categories/:id ──────────────────────────────────────────────
const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const catResult = await pool.query('SELECT name FROM categories WHERE id = $1', [id]);
    if (catResult.rows.length === 0) return res.status(404).json({ message: 'Category not found.' });
    const catName = catResult.rows[0].name;

    // Clear references in courses AND posts
    await pool.query('UPDATE courses SET category = NULL  WHERE category = $1', [catName]);
    await pool.query('UPDATE posts   SET category = $1    WHERE category = $2', ['General', catName]);

    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };

