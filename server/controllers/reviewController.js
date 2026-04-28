const { pool } = require('../config/db');

const API_BASE = 'http://localhost:5000';

/* ─────────────────────────────────────────────────────────────────
   POST /api/reviews
   Submit or update a review for a lesson (must be enrolled)
───────────────────────────────────────────────────────────────── */
const submitReview = async (req, res) => {
  const userId = req.user.id;
  const { lesson_id, course_id, rating, comment } = req.body;

  if (!lesson_id || !course_id || !rating) {
    return res.status(400).json({ error: 'lesson_id, course_id, and rating are required.' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  }

  try {
    // Verify enrollment
    const enrolled = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, course_id]
    );
    if (enrolled.rows.length === 0) {
      return res.status(403).json({ error: 'You must be enrolled to review this lesson.' });
    }

    // Upsert (one review per user per lesson)
    const result = await pool.query(
      `INSERT INTO lesson_reviews (user_id, lesson_id, course_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, lesson_id)
       DO UPDATE SET rating = $4, comment = $5, created_at = NOW()
       RETURNING *`,
      [userId, lesson_id, course_id, rating, comment || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Review] Submit error:', error);
    res.status(500).json({ error: 'Server error submitting review.' });
  }
};

/* ─────────────────────────────────────────────────────────────────
   GET /api/reviews/lesson/:lessonId
   Get all reviews for a lesson (public, includes user names)
───────────────────────────────────────────────────────────────── */
const getLessonReviews = async (req, res) => {
  const { lessonId } = req.params;
  try {
    const result = await pool.query(
      `SELECT lr.id, lr.rating, lr.comment, lr.created_at,
              u.id as user_id, u.name as user_name
       FROM lesson_reviews lr
       JOIN users u ON u.id = lr.user_id
       WHERE lr.lesson_id = $1
       ORDER BY lr.created_at DESC`,
      [lessonId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[Review] getLessonReviews error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

/* ─────────────────────────────────────────────────────────────────
   GET /api/reviews/my/:lessonId
   Get current user's review for a specific lesson
───────────────────────────────────────────────────────────────── */
const getMyReview = async (req, res) => {
  const userId = req.user.id;
  const { lessonId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM lesson_reviews WHERE user_id = $1 AND lesson_id = $2',
      [userId, lessonId]
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('[Review] getMyReview error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

/* ─────────────────────────────────────────────────────────────────
   GET /api/reviews/satisfaction
   Overall satisfaction rate as a percentage (0–100)
   Used by the About page
───────────────────────────────────────────────────────────────── */
const getSatisfactionRate = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as total, AVG(rating) as avg_rating FROM lesson_reviews'
    );
    const total = parseInt(result.rows[0].total, 10);
    const avg   = parseFloat(result.rows[0].avg_rating) || 0;

    // Convert 1–5 scale to 0–100%
    // 5 stars = 100%, 1 star = 0%, linear mapping: (avg - 1) / 4 * 100
    const rate = total === 0 ? null : Math.round(((avg - 1) / 4) * 100);

    res.json({ satisfaction_rate: rate, total_reviews: total, avg_rating: Math.round(avg * 10) / 10 });
  } catch (error) {
    console.error('[Review] satisfaction error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

/* ─────────────────────────────────────────────────────────────────
   GET /api/admin/reviews
   Admin: all reviews with course/lesson/user info
   Query params: ?course_id=&page=&limit=
───────────────────────────────────────────────────────────────── */
const getAdminReviews = async (req, res) => {
  const { course_id, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let query = `
      SELECT
        lr.id, lr.rating, lr.comment, lr.created_at,
        u.id   AS user_id,   u.name  AS user_name,  u.email AS user_email,
        c.id   AS course_id, c.title AS course_title,
        cl.id  AS lesson_id, cl.title AS lesson_title
      FROM lesson_reviews lr
      JOIN users u          ON u.id  = lr.user_id
      JOIN courses c        ON c.id  = lr.course_id
      JOIN course_lessons cl ON cl.id = lr.lesson_id
    `;
    const params = [];

    if (course_id) {
      params.push(course_id);
      query += ` WHERE lr.course_id = $${params.length}`;
    }

    query += ` ORDER BY lr.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const [rows, countRes] = await Promise.all([
      pool.query(query, params),
      pool.query(
        `SELECT COUNT(*) as total FROM lesson_reviews${course_id ? ' WHERE course_id = $1' : ''}`,
        course_id ? [course_id] : []
      ),
    ]);

    res.json({
      reviews: rows.rows,
      total:   parseInt(countRes.rows[0].total, 10),
      page:    parseInt(page),
      limit:   parseInt(limit),
    });
  } catch (error) {
    console.error('[Review] getAdminReviews error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

/* ─────────────────────────────────────────────────────────────────
   DELETE /api/admin/reviews/:id
   Admin: delete a review
───────────────────────────────────────────────────────────────── */
const deleteReview = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM lesson_reviews WHERE id = $1', [id]);
    res.json({ message: 'Review deleted.' });
  } catch (error) {
    console.error('[Review] delete error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

/* ─────────────────────────────────────────────────────────────────
   GET /api/reviews/course-ratings
   Public: avg rating + count for every course (used by course cards)
───────────────────────────────────────────────────────────────── */
const getCourseRatings = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT course_id,
             ROUND(AVG(rating)::numeric, 1) AS avg_rating,
             COUNT(*)                        AS review_count
      FROM lesson_reviews
      GROUP BY course_id
    `);
    // Return as a map { courseId: { avg, count } } for O(1) lookup
    const map = {};
    result.rows.forEach(r => {
      map[r.course_id] = {
        avg:   parseFloat(r.avg_rating),
        count: parseInt(r.review_count, 10),
      };
    });
    res.json(map);
  } catch (error) {
    console.error('[Review] getCourseRatings error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

/* ─────────────────────────────────────────────────────────────────
   GET /api/reviews/my-all
   All reviews written by the logged-in user with lesson + course titles
───────────────────────────────────────────────────────────────── */
const getMyAllReviews = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT lr.id, lr.rating, lr.comment, lr.created_at,
             cl.title AS lesson_title,
             c.title  AS course_title,
             c.id     AS course_id,
             cl.id    AS lesson_id
      FROM lesson_reviews lr
      JOIN course_lessons cl ON cl.id = lr.lesson_id
      JOIN courses        c  ON c.id  = lr.course_id
      WHERE lr.user_id = $1
      ORDER BY lr.created_at DESC
    `, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('[Review] getMyAllReviews error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = {
  submitReview,
  getLessonReviews,
  getMyReview,
  getSatisfactionRate,
  getAdminReviews,
  deleteReview,
  getCourseRatings,
  getMyAllReviews,
};
