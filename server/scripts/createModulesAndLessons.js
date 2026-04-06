const { pool } = require('../config/db');

async function migrate() {
  try {
    console.log('Creating course_modules table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_modules (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ course_modules table created.');

    console.log('Creating course_lessons table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_lessons (
        id SERIAL PRIMARY KEY,
        module_id INTEGER NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        video_url VARCHAR(500),
        video_file VARCHAR(500),
        pdf_url VARCHAR(500),
        resources JSONB DEFAULT '[]',
        sort_order INTEGER DEFAULT 0,
        duration VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ course_lessons table created.');

    // Create indexes for performance
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_modules_course_id ON course_modules(course_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON course_lessons(module_id);`);
    console.log('✅ Indexes created.');

    console.log('\n🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  }
  process.exit();
}

migrate();
