const { pool } = require('./config/db');

async function main() {
  try {
    const res = await pool.query(
      "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position"
    );
    for (const row of res.rows) {
      console.log(`${row.table_name}: ${row.column_name} (${row.data_type})`);
    }
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
