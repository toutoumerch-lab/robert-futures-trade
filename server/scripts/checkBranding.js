require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool } = require('../config/db');

async function check() {
  try {
    const result = await pool.query('SELECT key, value FROM settings');
    console.log('All settings in database:');
    result.rows.forEach(row => {
      console.log(`  ${row.key} = "${row.value}"`);
    });

    // Try to insert a test color
    console.log('\nInserting test color #FF5733...');
    await pool.query(
      "INSERT INTO settings (key, value) VALUES ('site_name_color', '#FF5733') ON CONFLICT (key) DO UPDATE SET value = '#FF5733'"
    );
    
    // Verify it was saved
    const verify = await pool.query("SELECT value FROM settings WHERE key = 'site_name_color'");
    if (verify.rows.length > 0) {
      console.log(`SUCCESS: site_name_color saved as "${verify.rows[0].value}"`);
    } else {
      console.log('FAILED: site_name_color was NOT found after insert');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

check();
