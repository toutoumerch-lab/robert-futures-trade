const { pool } = require('./config/db');

async function main() {
  try {
    console.log("Adding completed_lessons to enrollments...");
    await pool.query(`ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS completed_lessons JSONB DEFAULT '[]'::jsonb`);
    console.log("Success!");
  } catch (err) {
    console.error("Error migrating db:", err);
  } finally {
    pool.end();
  }
}
main();
