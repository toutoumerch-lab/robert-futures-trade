const { pool } = require('../config/db');

/**
 * GET /api/about/stats
 * Returns live platform statistics for the About page.
 *
 * - active_students : distinct enrolled users (+ configurable offset stored in settings)
 * - courses_modules : total published courses + total modules
 * - pass_rate       : admin-editable value stored in settings (default 87)
 * - countries       : admin-editable value stored in settings (default 60)
 */
const getAboutStats = async (req, res) => {
  try {
    // 1. Active students — distinct users with at least one enrollment
    const studentsRes = await pool.query(
      'SELECT COUNT(DISTINCT user_id) AS cnt FROM enrollments'
    );
    const rawStudents = parseInt(studentsRes.rows[0].cnt, 10) || 0;

    // 2. Courses + modules combined
    const coursesRes = await pool.query('SELECT COUNT(*) AS cnt FROM courses');
    const modulesRes = await pool.query('SELECT COUNT(*) AS cnt FROM course_modules');
    const totalCourses = parseInt(coursesRes.rows[0].cnt, 10) || 0;
    const totalModules = parseInt(modulesRes.rows[0].cnt, 10) || 0;
    const coursesModules = totalCourses + totalModules;

    // 3. Pull admin-configurable values from settings
    const settingsRes = await pool.query(
      `SELECT key, value FROM settings
       WHERE key IN ('about_student_offset', 'about_pass_rate', 'about_countries')`
    );
    const cfg = {};
    settingsRes.rows.forEach(r => { cfg[r.key] = r.value; });

    // student_offset lets admin "seed" the count with a historical base
    const offset      = parseInt(cfg.about_student_offset || '0', 10);
    const passRate    = parseInt(cfg.about_pass_rate      || '87', 10);
    const countries   = parseInt(cfg.about_countries      || '60', 10);

    const activeStudents = rawStudents + offset;

    res.json({
      active_students:  activeStudents,
      courses_modules:  coursesModules,
      pass_rate:        passRate,
      countries:        countries,
      // raw breakdown for debugging
      _raw: {
        enrolled_users: rawStudents,
        student_offset: offset,
        total_courses:  totalCourses,
        total_modules:  totalModules,
      }
    });
  } catch (error) {
    console.error('[About stats] Error:', error);
    res.status(500).json({ error: 'Server error fetching about stats' });
  }
};

module.exports = { getAboutStats };
