const { pool } = require('../config/db');

async function migrateBlog() {
  const client = await pool.connect();
  try {
    console.log('Starting blog migration...');

    // ── Posts table upgrades ──────────────────────────────────────────────────
    await client.query(`
      ALTER TABLE posts
        ADD COLUMN IF NOT EXISTS image_url    TEXT,
        ADD COLUMN IF NOT EXISTS category     TEXT DEFAULT 'General',
        ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS read_time    TEXT DEFAULT '3 min read',
        ADD COLUMN IF NOT EXISTS excerpt      TEXT;
    `);
    console.log('✓ posts table upgraded');

    // ── Comments table (ensure correct schema) ───────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id         SERIAL PRIMARY KEY,
        post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id    INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
        content    TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ comments table ready');

    // ── Reactions table (ensure correct schema) ──────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS reactions (
        id         SERIAL PRIMARY KEY,
        post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id    INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
        type       TEXT NOT NULL CHECK (type IN ('like','fire','insight')),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (post_id, user_id, type)
      );
    `);
    console.log('✓ reactions table ready');

    console.log('\nBlog migration completed successfully!');
  } catch (err) {
    console.error('Migration error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateBlog();
