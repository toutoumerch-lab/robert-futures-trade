require('dotenv').config({ path: '../.env' });
const { pool } = require('../config/db');

async function alter() { 
  try { 
    await pool.query('ALTER TABLE prop_firms ALTER COLUMN drawdown_limit TYPE TEXT USING drawdown_limit::TEXT'); 
    console.log('Done'); 
  } catch(e) { 
    console.error(e); 
  } finally { 
    process.exit(); 
  } 
} 
alter();
