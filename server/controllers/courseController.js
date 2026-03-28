const { pool } = require('../config/db');

const getCourses = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM courses ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getCourse = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Course not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const createCourse = async (req, res) => {
  const { title, description, price, image_url } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO courses (title, description, price, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, price, image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateCourse = async (req, res) => {
  const { id } = req.params;
  const { title, description, price, image_url } = req.body;
  try {
    const result = await pool.query(
      'UPDATE courses SET title=$1, description=$2, price=$3, image_url=$4 WHERE id=$5 RETURNING *',
      [title, description, price, image_url, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Course not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteCourse = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM courses WHERE id = $1', [id]);
    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getCourses, getCourse, createCourse, updateCourse, deleteCourse };
