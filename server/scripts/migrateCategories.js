const { pool } = require('../config/db');

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
      )
    `);
    console.log('Table "categories" created successfully.');
    
    const defaultCategories = ['Futures Trading', 'Prop Firm Passing', 'Options Pricing', 'Forex Domination', 'Trading Psychology', 'General/Other'];
    for (const name of defaultCategories) {
      await pool.query('INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [name]);
    }
    console.log('Categories seeded.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();
