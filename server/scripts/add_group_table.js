const { pool } = require('../config/db');

async function run() {
  try {
    // Create prop_firm_groups table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prop_firm_groups (
        name TEXT PRIMARY KEY,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ prop_firm_groups table created');

    // Auto-populate from existing group_name values
    await pool.query(`
      INSERT INTO prop_firm_groups (name)
      SELECT DISTINCT group_name FROM prop_firms 
      WHERE group_name IS NOT NULL AND group_name != ''
      ON CONFLICT (name) DO NOTHING
    `);

    const r = await pool.query('SELECT * FROM prop_firm_groups ORDER BY name');
    console.log('Groups:', r.rows);
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}
run();
