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
    
    const course = result.rows[0];

    // Fetch modules with nested lessons
    const modulesResult = await pool.query(
      'SELECT * FROM course_modules WHERE course_id = $1 ORDER BY sort_order ASC, id ASC',
      [id]
    );

    const modules = [];
    for (const mod of modulesResult.rows) {
      const lessonsResult = await pool.query(
        'SELECT * FROM course_lessons WHERE module_id = $1 ORDER BY sort_order ASC, id ASC',
        [mod.id]
      );
      modules.push({
        ...mod,
        lessons: lessonsResult.rows.map(l => ({
          ...l,
          resources: typeof l.resources === 'string' ? JSON.parse(l.resources) : (l.resources || [])
        }))
      });
    }

    course.modules = modules;
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const createCourse = async (req, res) => {
  const { title, description, price, level, duration, category, is_free, video_url } = req.body;
  
  if (!title) return res.status(400).json({ message: "Course title is required." });

  // Resolve potentially incoming file paths
  let finalImageUrl = req.body.image_url || null;
  let finalPdfUrl = null;
  let finalVideoFile = null;

  if (req.files) {
    if (req.files.image && req.files.image[0]) finalImageUrl = `/uploads/${req.files.image[0].filename}`;
    if (req.files.pdf_file && req.files.pdf_file[0]) finalPdfUrl = `/uploads/${req.files.pdf_file[0].filename}`;
    if (req.files.video_file && req.files.video_file[0]) finalVideoFile = `/uploads/${req.files.video_file[0].filename}`;
  }

  // Prevent numeric crash on empty string payloads
  const finalPrice = price ? parseFloat(price) : 0;
  const targetCategory = category || 'General/Other';

  try {
    // 1. Ensure category exists structurally mapping to the categories table.
    await pool.query(
      `INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [targetCategory]
    );

    // 2. Insert mapped payload exactly.
    const result = await pool.query(
      `INSERT INTO courses 
        (title, description, price, image_url, level, duration, category, is_free, video_url, video_file, pdf_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        title, description, finalPrice, finalImageUrl, 
        level || 'Beginner', duration, targetCategory, 
        is_free === 'true' || is_free === true, 
        video_url, finalVideoFile, finalPdfUrl
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateCourse = async (req, res) => {
  const { id } = req.params;
  const { title, description, price, image_url, level, duration, category, is_free, video_url } = req.body;

  // Resolve potentially incoming file paths, defaulting to existing body passes if no new file is pushed
  let finalImageUrl = image_url; 
  let finalPdfUrl = req.body.pdf_url || null; // Frontend passes back existing URL if not overridden
  let finalVideoFile = req.body.video_file || null; // same logic

  if (req.files) {
    if (req.files.image && req.files.image[0]) finalImageUrl = `/uploads/${req.files.image[0].filename}`;
    if (req.files.pdf_file && req.files.pdf_file[0]) finalPdfUrl = `/uploads/${req.files.pdf_file[0].filename}`;
    if (req.files.video_file && req.files.video_file[0]) finalVideoFile = `/uploads/${req.files.video_file[0].filename}`;
  }

  const finalPrice = price ? parseFloat(price) : 0;
  const targetCategory = category || 'Trading';

  try {
    // 1. Maintain dynamic persistence logic universally
    await pool.query(
      `INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [targetCategory]
    );

    const result = await pool.query(
      `UPDATE courses 
       SET 
         title=$1, description=$2, price=$3, image_url=$4, 
         level=$5, duration=$6, category=$7, is_free=$8, 
         video_url=$9, video_file=$10, pdf_url=$11 
       WHERE id=$12 RETURNING *`,
      [
        title, description, finalPrice, finalImageUrl,
        level || 'Beginner', duration, targetCategory, 
        is_free === 'true' || is_free === true, 
        video_url, finalVideoFile, finalPdfUrl, 
        id
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Course not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: error.message });
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
