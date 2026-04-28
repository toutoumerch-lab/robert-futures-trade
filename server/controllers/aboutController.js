const { pool } = require('../config/db');

/**
 * GET /api/about/stats
 * Returns live platform statistics for the About page.
 *
 * - active_students   : distinct enrolled users (+ configurable offset)
 * - courses_modules   : total published courses
 * - satisfaction_rate : live avg from lesson_reviews (0–100%), null if no reviews yet
 * - countries         : admin-editable value stored in settings (default 60)
 */
const getAboutStats = async (req, res) => {
  try {
    // 1. Active students
    const studentsRes = await pool.query(
      'SELECT COUNT(DISTINCT user_id) AS cnt FROM enrollments'
    );
    const rawStudents = parseInt(studentsRes.rows[0].cnt, 10) || 0;

    // 2. Courses only
    const coursesRes = await pool.query('SELECT COUNT(*) AS cnt FROM courses');
    const totalCourses = parseInt(coursesRes.rows[0].cnt, 10) || 0;

    // 3. Live satisfaction rate from reviews (1–5 → 0–100%)
    const reviewRes = await pool.query(
      'SELECT COUNT(*) as total, AVG(rating) as avg_rating FROM lesson_reviews'
    );
    const totalReviews = parseInt(reviewRes.rows[0].total, 10);
    const avgRating    = parseFloat(reviewRes.rows[0].avg_rating) || 0;
    // (avg - 1) / 4 * 100 maps 1→0%, 5→100%
    const satisfactionRate = totalReviews === 0
      ? null
      : Math.round(((avgRating - 1) / 4) * 100);

    // 4. Admin-configurable: student offset + countries
    const settingsRes = await pool.query(
      `SELECT key, value FROM settings WHERE key IN ('about_student_offset', 'about_countries')`
    );
    const cfg = {};
    settingsRes.rows.forEach(r => { cfg[r.key] = r.value; });

    const offset    = parseInt(cfg.about_student_offset || '0', 10);
    const countries = parseInt(cfg.about_countries      || '60', 10);

    const activeStudents = rawStudents + offset;

    res.json({
      active_students:   activeStudents,
      courses_modules:   totalCourses,
      satisfaction_rate: satisfactionRate, // null until first reviews come in
      countries:         countries,
      _raw: {
        enrolled_users: rawStudents,
        student_offset: offset,
        total_courses:  totalCourses,
        total_reviews:  totalReviews,
        avg_rating:     Math.round(avgRating * 10) / 10,
      }
    });
  } catch (error) {
    console.error('[About stats] Error:', error);
    res.status(500).json({ error: 'Server error fetching about stats' });
  }
};

module.exports = { getAboutStats };
