require('dotenv').config();
const { pool } = require('./config/db');

async function cleanPurchases() {
  try {
    console.log('Cleaning all payments and enrollments...');
    
    const payRes = await pool.query('DELETE FROM payments RETURNING id');
    console.log(`Deleted ${payRes.rows.length} payments.`);
    
    const enrollRes = await pool.query('DELETE FROM enrollments RETURNING id');
    console.log(`Deleted ${enrollRes.rows.length} enrollments.`);
    
    console.log('Done!');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
cleanPurchases();
