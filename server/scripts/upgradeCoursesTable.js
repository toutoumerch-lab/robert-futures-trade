const { pool } = require('../config/db');

const upgradeCoursesTable = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('Altering courses table to add new fields...');
    
    // Add level
    await client.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS level VARCHAR(50) DEFAULT 'Beginner';`);
    // Add duration
    await client.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration VARCHAR(50);`);
    // Add category
    await client.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Trading';`);
    // Add is_free
    await client.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;`);
    // Add video_url (for youtube links)
    await client.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);`);
    // Add video_file (for local mp4 paths)
    await client.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS video_file VARCHAR(500);`);
    // Add pdf_url (for local pdf paths)
    await client.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(500);`);
    
    // Change price to not null DEFAULT 0
    await client.query(`ALTER TABLE courses ALTER COLUMN price DROP NOT NULL;`);
    await client.query(`ALTER TABLE courses ALTER COLUMN price SET DEFAULT 0;`);
    
    await client.query('COMMIT');
    console.log('Courses table upgraded successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error upgrading courses table:', error);
  } finally {
    client.release();
    process.exit(0);
  }
};

upgradeCoursesTable();
