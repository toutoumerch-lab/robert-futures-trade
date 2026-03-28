const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'postgres',
});

const createDatabase = async () => {
  try {
    const dbName = process.env.DB_NAME || 'roberts_trades_db';
    const res = await pool.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${dbName}'`);
    
    if (res.rowCount === 0) {
      console.log(`${dbName} database not found, creating it.`);
      await pool.query(`CREATE DATABASE "${dbName}";`);
      console.log(`Created database ${dbName}.`);
    } else {
      console.log(`${dbName} database already exists.`);
    }
  } catch (err) {
    console.error('Error creating database:', err.message);
  } finally {
    await pool.end();
  }
};

createDatabase();
