const { pool } = require('./config/db');

async function run() {
  await pool.query("UPDATE settings SET value = 'support@roberttrades.com' WHERE key = 'contact_email'");
  const result = await pool.query("SELECT key, value FROM settings WHERE key = 'contact_email'");
  console.log('contact_email is now:', result.rows[0]?.value);
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
