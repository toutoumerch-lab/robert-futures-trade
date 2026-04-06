const { pool } = require('../config/db');

async function run() {
  try {
    // Add group_name column
    await pool.query('ALTER TABLE prop_firms ADD COLUMN IF NOT EXISTS group_name TEXT');
    console.log('Column added');

    // Pre-populate Lucid entries
    await pool.query("UPDATE prop_firms SET group_name = 'Lucid Trading' WHERE name LIKE 'Lucid%'");
    console.log('Lucid entries grouped');

    // Verify
    const r = await pool.query('SELECT id, name, group_name FROM prop_firms ORDER BY id');
    r.rows.forEach(row => console.log(row.id, row.name, '->', row.group_name || '(none)'));
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}
run();
