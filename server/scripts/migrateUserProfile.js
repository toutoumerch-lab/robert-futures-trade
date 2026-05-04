require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('../config/db');

async function run() {
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_prop_firm_views (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      firm_id INTEGER NOT NULL REFERENCES prop_firms(id) ON DELETE CASCADE,
      viewed_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, firm_id)
    )
  `);
  console.log('Migration complete: avatar_url + user_prop_firm_views');
  await pool.end();
}
run().catch(e => { console.error(e); process.exit(1); });
