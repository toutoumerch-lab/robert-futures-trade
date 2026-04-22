const {Pool}=require('pg');
const p=new Pool({user:'postgres',password:'admin',host:'localhost',port:5432,database:'roberts_trades_db'});
async function main(){
  const tables = await p.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log('TABLES:', tables.rows.map(x=>x.table_name).join(', '));
  for(const {table_name} of tables.rows){
    const cols = await p.query('SELECT column_name FROM information_schema.columns WHERE table_name=$1',[table_name]);
    console.log(table_name+':', cols.rows.map(x=>x.column_name).join(', '));
  }
  await p.end();
}
main().catch(e=>{console.error(e.message);p.end()});
