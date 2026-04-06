const { pool } = require('../config/db');

// ═══════════════════════════════════════════════════════════════════
// MODULES CRUD
// ═══════════════════════════════════════════════════════════════════

const getModules = async (req, res) => {
  const { courseId } = req.params;
  try {
    const modulesResult = await pool.query(
      'SELECT * FROM course_modules WHERE course_id = $1 ORDER BY sort_order ASC, id ASC',
      [courseId]
    );

    // For each module, fetch its lessons
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

    res.json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const createModule = async (req, res) => {
  const { courseId } = req.params;
  const { title, description } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ message: 'Module title is required.' });
  }

  try {
    // Get next sort_order
    const orderResult = await pool.query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM course_modules WHERE course_id = $1',
      [courseId]
    );
    const nextOrder = orderResult.rows[0].next_order;

    const result = await pool.query(
      'INSERT INTO course_modules (course_id, title, description, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [courseId, title.trim(), description || '', nextOrder]
    );
    
    res.status(201).json({ ...result.rows[0], lessons: [] });
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateModule = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ message: 'Module title is required.' });
  }

  try {
    const result = await pool.query(
      'UPDATE course_modules SET title = $1, description = $2 WHERE id = $3 RETURNING *',
      [title.trim(), description || '', id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Module not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ message: error.message });
  }
};

const deleteModule = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM course_modules WHERE id = $1', [id]);
    res.json({ message: 'Module deleted' });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const reorderModules = async (req, res) => {
  const { orders } = req.body; // [{id, sort_order}, ...]
  try {
    for (const item of orders) {
      await pool.query(
        'UPDATE course_modules SET sort_order = $1 WHERE id = $2',
        [item.sort_order, item.id]
      );
    }
    res.json({ message: 'Modules reordered' });
  } catch (error) {
    console.error('Error reordering modules:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ═══════════════════════════════════════════════════════════════════
// LESSONS CRUD
// ═══════════════════════════════════════════════════════════════════

const createLesson = async (req, res) => {
  const { moduleId } = req.params;
  const { title, description, video_url, duration, resources } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ message: 'Lesson title is required.' });
  }

  let pdfUrl = null;
  let videoFile = null;
  let zipUrl = null;

  if (req.files) {
    if (req.files.pdf_file && req.files.pdf_file[0]) pdfUrl = `/uploads/${req.files.pdf_file[0].filename}`;
    if (req.files.video_file && req.files.video_file[0]) videoFile = `/uploads/${req.files.video_file[0].filename}`;
    if (req.files.zip_file && req.files.zip_file[0]) zipUrl = `/uploads/${req.files.zip_file[0].filename}`;
  }

  // Parse resources safely
  let parsedResources = [];
  try {
    if (resources) parsedResources = typeof resources === 'string' ? JSON.parse(resources) : resources;
  } catch (e) { /* ignore parse errors */ }

  try {
    const orderResult = await pool.query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM course_lessons WHERE module_id = $1',
      [moduleId]
    );
    const nextOrder = orderResult.rows[0].next_order;

    const result = await pool.query(
      `INSERT INTO course_lessons 
        (module_id, title, description, video_url, video_file, pdf_url, zip_url, resources, sort_order, duration) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [moduleId, title.trim(), description || '', video_url || null, videoFile, pdfUrl, zipUrl, JSON.stringify(parsedResources), nextOrder, duration || null]
    );

    res.status(201).json({
      ...result.rows[0],
      resources: parsedResources
    });
  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateLesson = async (req, res) => {
  const { id } = req.params;
  const { title, description, video_url, duration, resources } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ message: 'Lesson title is required.' });
  }

  // Resolve file uploads, falling back to existing values from body
  let pdfUrl = req.body.pdf_url || null;
  let videoFile = req.body.video_file || null;
  let zipUrl = req.body.zip_url || null;

  if (req.files) {
    if (req.files.pdf_file && req.files.pdf_file[0]) pdfUrl = `/uploads/${req.files.pdf_file[0].filename}`;
    if (req.files.video_file && req.files.video_file[0]) videoFile = `/uploads/${req.files.video_file[0].filename}`;
    if (req.files.zip_file && req.files.zip_file[0]) zipUrl = `/uploads/${req.files.zip_file[0].filename}`;
  }

  let parsedResources = [];
  try {
    if (resources) parsedResources = typeof resources === 'string' ? JSON.parse(resources) : resources;
  } catch (e) { /* ignore parse errors */ }

  try {
    const result = await pool.query(
      `UPDATE course_lessons 
       SET title=$1, description=$2, video_url=$3, video_file=$4, pdf_url=$5, zip_url=$6, resources=$7, duration=$8
       WHERE id=$9 RETURNING *`,
      [title.trim(), description || '', video_url || null, videoFile, pdfUrl, zipUrl, JSON.stringify(parsedResources), duration || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Lesson not found' });
    res.json({
      ...result.rows[0],
      resources: parsedResources
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({ message: error.message });
  }
};

const deleteLesson = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM course_lessons WHERE id = $1', [id]);
    res.json({ message: 'Lesson deleted' });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const reorderLessons = async (req, res) => {
  const { orders } = req.body; // [{id, sort_order}, ...]
  try {
    for (const item of orders) {
      await pool.query(
        'UPDATE course_lessons SET sort_order = $1 WHERE id = $2',
        [item.sort_order, item.id]
      );
    }
    res.json({ message: 'Lessons reordered' });
  } catch (error) {
    console.error('Error reordering lessons:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getModules, createModule, updateModule, deleteModule, reorderModules,
  createLesson, updateLesson, deleteLesson, reorderLessons
};
