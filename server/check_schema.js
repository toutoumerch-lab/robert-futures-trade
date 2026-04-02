const { pool } = require('./config/db');
const fs = require('fs');

async function main() {
  try {
    const r = await pool.query(
      "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'prop_firms' ORDER BY ordinal_position"
    );
    let output = '';
    r.rows.forEach(row => {
      output += row.column_name + ' | ' + row.data_type + ' | ' + row.is_nullable + '\n';
    });
    fs.writeFileSync('schema_output.txt', output);
    console.log('Schema written to schema_output.txt');
  } catch (e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
}

main();
