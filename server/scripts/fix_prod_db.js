const { pool } = require('../config/db');

async function fixDb() {
  try {
    console.log("Adding last_active_at to users...");
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    console.log("Creating payments table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'paid',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("Database fixed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Failed to fix DB:", error);
    process.exit(1);
  }
}

fixDb();
