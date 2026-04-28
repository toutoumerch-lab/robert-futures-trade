const { pool } = require('./config/db');
(async () => {
  try {
    const users      = await pool.query('SELECT COUNT(*) as cnt FROM users');
    const courses    = await pool.query('SELECT COUNT(*) as cnt FROM courses');
    const modules    = await pool.query('SELECT COUNT(*) as cnt FROM course_modules');
    const enrollments= await pool.query('SELECT COUNT(*) as cnt FROM enrollments');
    const lessons    = await pool.query('SELECT COUNT(*) as cnt FROM course_lessons');

    console.log('Users:',       users.rows[0].cnt);
    console.log('Courses:',     courses.rows[0].cnt);
    console.log('Modules:',     modules.rows[0].cnt);
    console.log('Enrollments:', enrollments.rows[0].cnt);
    console.log('Lessons:',     lessons.rows[0].cnt);

    // Check if payments table has a status column
    const cols = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'payments' AND table_schema = 'public'
    `);
    console.log('Payments cols:', cols.rows.map(r => r.column_name).join(', '));

    // Check if users table has a country column
    const ucols = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND table_schema = 'public'
    `);
    console.log('Users cols:', ucols.rows.map(r => r.column_name).join(', '));

  } catch(e) { console.error('Error:', e.message); }
  finally { pool.end(); }
})();
