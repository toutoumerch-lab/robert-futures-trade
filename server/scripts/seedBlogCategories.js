require('dotenv').config();
const { pool } = require('../config/db');

const DEFAULTS = [
  'General', 'Market Analysis', 'Trading Psychology',
  'Futures', 'Risk Management', 'Strategy', 'Macroeconomics',
];

(async () => {
  for (const name of DEFAULTS) {
    try {
      await pool.query(
        'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [name]
      );
      console.log(`  ✔ ${name}`);
    } catch (e) {
      console.error(`  ✘ ${name}: ${e.message}`);
    }
  }
  console.log('Done seeding blog categories.');
  await pool.end();
})();
