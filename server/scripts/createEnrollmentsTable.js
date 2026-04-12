const { pool } = require('../config/db');

async function createEnrollmentsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, course_id)
      );
    `);
    console.log('✅ enrollments table created successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating enrollments table:', error);
    process.exit(1);
  }
}

createEnrollmentsTable();
