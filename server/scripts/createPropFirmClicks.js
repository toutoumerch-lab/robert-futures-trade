/**
 * scripts/createPropFirmClicks.js
 * One-time migration — creates the prop_firm_clicks table
 */
const { Pool } = require('pg');
const pool = new Pool({ user:'postgres', password:'admin', host:'localhost', port:5432, database:'roberts_trades_db' });

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS prop_firm_clicks (
      id          SERIAL PRIMARY KEY,
      firm_id     INTEGER NOT NULL REFERENCES prop_firms(id) ON DELETE CASCADE,
      click_type  VARCHAR(20) NOT NULL DEFAULT 'view',  -- 'view' | 'website' | 'affiliate'
      session_id  VARCHAR(64),
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_pfc_firm ON prop_firm_clicks(firm_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_pfc_created ON prop_firm_clicks(created_at)`);
  console.log('✅ prop_firm_clicks table ready');
  await pool.end();
}
run().catch(e => { console.error('❌', e.message); pool.end(); });
