const { pool } = require('../config/db');

const getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: error.message });
  }
};

const createCategory = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Category name is required.' });

  try {
    const result = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    // Get the category name first so we can clear it from courses
    const catResult = await pool.query('SELECT name FROM categories WHERE id = $1', [id]);
    if (catResult.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found.' });
    }
    const catName = catResult.rows[0].name;

    // Nullify category on any courses using this category
    await pool.query('UPDATE courses SET category = NULL WHERE category = $1', [catName]);

    // Delete the category
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);

    res.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCategories, createCategory, deleteCategory };

