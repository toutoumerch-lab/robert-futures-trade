require('dotenv').config();
const { pool } = require('./config/db');

async function clean() {
  try {
    console.log('Cleaning database of all test/historical data...');

    // Delete all users except the real admin
    const userRes = await pool.query("DELETE FROM users WHERE email != 'admin@roberttrades.com' RETURNING id");
    console.log(`Deleted ${userRes.rows.length} test users (and their enrollments/payments via CASCADE).`);
    
    // Delete the 3 mock courses from the seeder
    const courseRes = await pool.query("DELETE FROM courses WHERE title IN ('Futures Trading Mastery', 'Prop Firm Challenge Blueprint', 'Advanced Volume Profile') RETURNING id");
    console.log(`Deleted ${courseRes.rows.length} mock courses.`);
    
    // Delete the mock prop firms
    const firmRes = await pool.query("DELETE FROM prop_firms WHERE name LIKE 'Mock Firm %' RETURNING id");
    console.log(`Deleted ${firmRes.rows.length} mock prop firms.`);

    // Truncate the clicks table
    await pool.query("TRUNCATE prop_firm_clicks RESTART IDENTITY CASCADE");
    console.log('Truncated all fake prop firm clicks.');

    console.log('Database successfully cleaned! Analytics will now show 0 until real data comes in.');
    process.exit(0);
  } catch (err) {
    console.error('Error cleaning DB:', err.message);
    process.exit(1);
  }
}

clean();
