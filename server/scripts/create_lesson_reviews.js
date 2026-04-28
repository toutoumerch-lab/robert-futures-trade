const { pool } = require('../config/db');

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lesson_reviews (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lesson_id  INTEGER NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
        course_id  INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment    TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (user_id, lesson_id)
      );
    `);
    console.log('✅ lesson_reviews table created (or already exists)');
    
    // Index for fast lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_lesson_reviews_lesson ON lesson_reviews(lesson_id);
      CREATE INDEX IF NOT EXISTS idx_lesson_reviews_course ON lesson_reviews(course_id);
      CREATE INDEX IF NOT EXISTS idx_lesson_reviews_user   ON lesson_reviews(user_id);
    `);
    console.log('✅ Indexes created');
  } catch (e) {
    console.error('Migration error:', e.message);
  } finally {
    pool.end();
  }
})();
