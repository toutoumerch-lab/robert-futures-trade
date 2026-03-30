require('dotenv').config({ path: '../.env' });
const { pool } = require('../config/db');

async function addLogoColumn() {
  try {
    await pool.query('ALTER TABLE prop_firms ADD COLUMN IF NOT EXISTS logo_url TEXT');
    console.log('Successfully added logo_url column to prop_firms');
  } catch (error) {
    console.error('Error adding logo_url column:', error.message);
  } finally {
    process.exit();
  }
}
addLogoColumn();
