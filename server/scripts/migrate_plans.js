/**
 * Migration: prop_firms (flat) → prop_firms + prop_firm_plans (relational)
 *
 * 1. Creates prop_firm_plans table
 * 2. Groups existing rows by base firm name (stripping plan suffixes)
 * 3. Keeps one "parent" row per firm, creates plan rows for each original entry
 * 4. Deletes duplicate firm rows
 *
 * Safe to re-run — it checks if the table already exists.
 */
const { pool } = require('../config/db');

const PLAN_SUFFIXES = ['Flex', 'Pro', 'Direct', 'Elite', 'Standard', 'Premium', 'Basic', 'Plus', 'Starter', 'Advanced', 'Lite', 'Ultra'];

function getBaseName(name) {
  if (!name) return name;
  for (const suffix of PLAN_SUFFIXES) {
    if (name.endsWith(` ${suffix}`)) return name.slice(0, -(suffix.length + 1)).trim();
  }
  return name;
}

function getPlanSuffix(name) {
  if (!name) return null;
  for (const suffix of PLAN_SUFFIXES) {
    if (name.endsWith(` ${suffix}`)) return suffix;
  }
  return null;
}

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check if prop_firm_plans already exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = 'prop_firm_plans'
      )
    `);
    if (tableCheck.rows[0].exists) {
      console.log('⚠️  prop_firm_plans table already exists. Skipping migration.');
      await client.query('COMMIT');
      return;
    }

    // 2. Create backup
    console.log('📦 Backing up prop_firms → prop_firms_backup...');
    await client.query('DROP TABLE IF EXISTS prop_firms_backup');
    await client.query('CREATE TABLE prop_firms_backup AS SELECT * FROM prop_firms');

    // 3. Create prop_firm_plans table
    console.log('🔨 Creating prop_firm_plans table...');
    await client.query(`
      CREATE TABLE prop_firm_plans (
        id SERIAL PRIMARY KEY,
        firm_id INTEGER NOT NULL REFERENCES prop_firms(id) ON DELETE CASCADE,
        plan_name TEXT NOT NULL,
        activation_fee INTEGER,
        profit_split TEXT,
        profit_target TEXT,
        drawdown_limit TEXT,
        dll TEXT,
        days_to_pass TEXT,
        days_to_payout TEXT,
        max_withdrawal TEXT,
        max_accounts TEXT,
        eval TEXT,
        pa TEXT,
        reset_fee TEXT,
        fifty_k_all_in INTEGER,
        fifty_k_initial_cost INTEGER,
        without_discount_usd INTEGER,
        discount_usd INTEGER,
        discount_percent INTEGER,
        buffer BOOLEAN DEFAULT FALSE,
        buffer_amount TEXT,
        copy_trade BOOLEAN DEFAULT FALSE,
        vpn BOOLEAN DEFAULT FALSE,
        dca BOOLEAN DEFAULT FALSE,
        news BOOLEAN DEFAULT FALSE,
        bots BOOLEAN DEFAULT FALSE,
        micro_scalping BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 4. Fetch all existing firms
    const { rows: allFirms } = await client.query('SELECT * FROM prop_firms ORDER BY id');
    console.log(`📊 Found ${allFirms.length} existing entries`);

    // 5. Group by base name
    const groups = {};
    for (const firm of allFirms) {
      const baseName = getBaseName(firm.name);
      if (!groups[baseName]) groups[baseName] = [];
      groups[baseName].push(firm);
    }
    console.log(`📁 Grouped into ${Object.keys(groups).length} firms`);

    // 6. For each group: keep best parent, create plans, delete duplicates
    for (const [baseName, members] of Object.entries(groups)) {
      // Pick parent: prefer one with logo, highest rating
      const parent = members.reduce((best, m) => {
        if (m.logo_url && !best.logo_url) return m;
        if ((Number(m.rating) || 0) > (Number(best.rating) || 0)) return m;
        return best;
      }, members[0]);

      // Rename parent to base name
      await client.query('UPDATE prop_firms SET name = $1 WHERE id = $2', [baseName, parent.id]);
      console.log(`  ✅ "${baseName}" → parent id=${parent.id}`);

      // Create plan entries for ALL members (including parent)
      for (const member of members) {
        const planName = getPlanSuffix(member.name) || member.name;
        await client.query(`
          INSERT INTO prop_firm_plans (
            firm_id, plan_name, activation_fee, profit_split, profit_target,
            drawdown_limit, dll, days_to_pass, days_to_payout, max_withdrawal,
            max_accounts, eval, pa, reset_fee, fifty_k_all_in, fifty_k_initial_cost,
            without_discount_usd, discount_usd, discount_percent,
            buffer, buffer_amount, copy_trade, vpn, dca, news, bots, micro_scalping, notes
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19,
            $20, $21, $22, $23, $24, $25, $26, $27, $28
          )
        `, [
          parent.id, planName,
          member.activation_fee, member.profit_split, member.profit_target,
          member.drawdown_limit, member.dll, member.days_to_pass, member.days_to_payout,
          member.max_withdrawal, member.max_accounts, member.eval, member.pa,
          member.reset_fee, member.fifty_k_all_in, member.fifty_k_initial_cost,
          member.without_discount_usd, member.discount_usd, member.discount_percent,
          member.buffer || false, member.buffer_amount,
          member.copy_trade || false, member.vpn || false,
          member.dca || false, member.news || false,
          member.bots || false, member.micro_scalping || false,
          member.notes
        ]);
        console.log(`    📋 Plan "${planName}" created (from id=${member.id})`);
      }

      // Delete duplicate rows (all except parent)
      const duplicateIds = members.filter(m => m.id !== parent.id).map(m => m.id);
      if (duplicateIds.length > 0) {
        // First, move any platform links to parent
        for (const dupId of duplicateIds) {
          await client.query(`
            UPDATE prop_firm_platforms SET prop_firm_id = $1
            WHERE prop_firm_id = $2
            AND NOT EXISTS (
              SELECT 1 FROM prop_firm_platforms WHERE prop_firm_id = $1 AND platform_id = prop_firm_platforms.platform_id
            )
          `, [parent.id, dupId]);
          await client.query('DELETE FROM prop_firm_platforms WHERE prop_firm_id = $1', [dupId]);
        }
        await client.query(`DELETE FROM prop_firms WHERE id = ANY($1)`, [duplicateIds]);
        console.log(`    🗑️  Deleted ${duplicateIds.length} duplicate rows`);
      }
    }

    await client.query('COMMIT');
    console.log('\n🎉 Migration complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();
