const { pool } = require('./config/db');
(async () => {
  try {
    const r1 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'course_lessons' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    console.log('course_lessons cols:', r1.rows.map(c => `${c.column_name}:${c.data_type}`).join(', '));

    const r2 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    console.log('users cols:', r2.rows.map(c => `${c.column_name}:${c.data_type}`).join(', '));
    
  } catch (e) { console.error(e.message); }
  finally { pool.end(); }
})();
