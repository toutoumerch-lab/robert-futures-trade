const { pool } = require('../config/db');

const defaultPlatforms = [
  'NinjaTrader', 'Tradovate', 'TradingView', 'MotiveWave', 'Quantower', 
  'Sierra Chart', 'Jigsaw', 'Bookmap', 'ATAS', 'R|Trader Pro', 'Multicharts',
  'DX Feed', 'Volumetrica'
]; // Removed duplicate Quantower and ATAS

const relatePlatforms = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Make sure we drop the junction table if we ever run this script twice
    await client.query('DROP TABLE IF EXISTS prop_firm_platforms CASCADE;');
    // Drop platforms safely
    await client.query('DROP TABLE IF EXISTS platforms CASCADE;');

    // 1. Create platforms table
    await client.query(`
      CREATE TABLE platforms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      );
    `);

    // 2. Insert default platforms
    for (const p of defaultPlatforms) {
      await client.query(
        'INSERT INTO platforms (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [p]
      );
    }

    // 3. Create junction table
    await client.query(`
      CREATE TABLE prop_firm_platforms (
        prop_firm_id INTEGER REFERENCES prop_firms(id) ON DELETE CASCADE,
        platform_id INTEGER REFERENCES platforms(id) ON DELETE CASCADE,
        PRIMARY KEY (prop_firm_id, platform_id)
      );
    `);

    // 4. Drop the old column from prop_firms if it exists
    await client.query('ALTER TABLE prop_firms DROP COLUMN IF EXISTS platforms;');

    await client.query('COMMIT');
    console.log('Successfully created platforms relational schema and inserted defaults.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error relating platforms:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
};

relatePlatforms();
