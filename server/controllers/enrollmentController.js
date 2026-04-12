const { pool } = require('../config/db');

// POST /api/enrollments — Enroll the authenticated user in a course
const enrollInCourse = async (req, res) => {
  const userId = req.user.id;
  const { courseId } = req.body;

  if (!courseId) {
    return res.status(400).json({ error: 'courseId is required.' });
  }

  try {
    // Check if already enrolled
    const existing = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Already enrolled in this course.', enrolled: true });
    }

    // Verify the course exists
    const courseCheck = await pool.query('SELECT id FROM courses WHERE id = $1', [courseId]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Create enrollment
    const result = await pool.query(
      'INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2) RETURNING *',
      [userId, courseId]
    );

    res.status(201).json({ message: 'Enrolled successfully.', enrollment: result.rows[0] });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ error: 'Server error during enrollment.' });
  }
};

// GET /api/enrollments/check/:courseId — Check if user is enrolled in a specific course
const checkEnrollment = async (req, res) => {
  const userId = req.user.id;
  const { courseId } = req.params;

  try {
    const result = await pool.query(
      'SELECT id, created_at FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );

    res.json({ enrolled: result.rows.length > 0, enrollment: result.rows[0] || null });
  } catch (error) {
    console.error('Check enrollment error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

// GET /api/enrollments/my — Get all enrollments for the authenticated user
const getMyEnrollments = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT e.id, e.course_id, e.created_at,
              c.title, c.image_url, c.category, c.level, c.duration
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE e.user_id = $1
       ORDER BY e.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { enrollInCourse, checkEnrollment, getMyEnrollments };
