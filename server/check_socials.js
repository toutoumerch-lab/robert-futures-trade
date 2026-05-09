const { pool } = require('./config/db');
async function run() {
  const result = await pool.query("SELECT key, value FROM settings WHERE key LIKE 'social_%' ORDER BY key");
  console.log('\nCurrent social media URLs in DB:');
  result.rows.forEach(r => console.log(`  ${r.key}: ${r.value || '(empty)'}`));
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
