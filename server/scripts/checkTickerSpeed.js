require('dotenv').config();
const { pool } = require('../config/db');

(async () => {
  try {
    // Check all columns in promotions table
    const cols = await pool.query(
      "SELECT column_name, data_type, column_default, is_nullable FROM information_schema.columns WHERE table_name='promotions' ORDER BY ordinal_position"
    );
    console.log('promotions columns:', JSON.stringify(cols.rows, null, 2));
    
    // Try a direct UPDATE and see what happens
    const update = await pool.query(
      `UPDATE promotions SET ticker_speed=$1, updated_at=NOW() WHERE id=1 RETURNING id, ticker_speed`,
      [15]
    );
    console.log('UPDATE result:', JSON.stringify(update.rows));
    
    // Verify
    const check = await pool.query('SELECT id, ticker_speed FROM promotions WHERE id=1');
    console.log('After update:', JSON.stringify(check.rows));
    
    // Reset to 40
    await pool.query('UPDATE promotions SET ticker_speed=40 WHERE id=1');
    console.log('Reset to 40 done');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
})();
