const { pool } = require('../config/db');

// Helper function to link platforms to a firm inside a transaction client
const linkPlatforms = async (client, firmId, platforms) => {
  if (Array.isArray(platforms) && platforms.length > 0) {
    for (const p of platforms) {
      if (!p || typeof p !== 'string') continue;
      const cleanPlatform = p.trim();
      if (!cleanPlatform) continue;

      // Insert platform if not exists
      await client.query('INSERT INTO platforms (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [cleanPlatform]);
      // Fetch platform ID
      const pRes = await client.query('SELECT id FROM platforms WHERE name = $1', [cleanPlatform]);
      if (pRes.rows.length > 0) {
        const platformId = pRes.rows[0].id;
        // Link them
        await client.query(
          'INSERT INTO prop_firm_platforms (prop_firm_id, platform_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [firmId, platformId]
        );
      }
    }
  }
};

const num = (v) => (v === '' || v === undefined || v === 'undefined' || v === null) ? null : v;

const getPropFirms = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, name, importance, featured, rating, website, affiliate_link, twitter, discord, 
        last_checked, is_affiliate, discount_code, overall_score, 
        account_category, price, activation_fee, profit_split, 
        max_withdrawal, profit_target, drawdown_limit, days_to_pass, days_to_payout, notes,
        buffer, eval, pa, reset_fee, copy_trade, vpn, max_accounts, dll,
        fifty_k_all_in, fifty_k_initial_cost, without_discount_usd, discount_usd, discount_percent,
        dca, news, bots, micro_scalping,
        created_at,
        COALESCE(
          (SELECT json_agg(p.name) 
           FROM prop_firm_platforms pfp 
           JOIN platforms p ON pfp.platform_id = p.id 
           WHERE pfp.prop_firm_id = prop_firms.id),
          '[]'::json
        ) as platforms
      FROM prop_firms ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching prop firms:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getPropFirmsAdmin = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        *,
        COALESCE(
          (SELECT json_agg(p.name) 
           FROM prop_firm_platforms pfp 
           JOIN platforms p ON pfp.platform_id = p.id 
           WHERE pfp.prop_firm_id = prop_firms.id),
          '[]'::json
        ) as platforms
      FROM prop_firms ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching admin prop firms:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const createPropFirm = async (req, res) => {
  const { 
    name, importance, featured, rating, website, affiliate_link, twitter, discord, 
    last_checked, is_affiliate, discount_code, overall_score, 
    account_category, price, activation_fee, profit_split, 
    max_withdrawal, profit_target, drawdown_limit, days_to_pass, days_to_payout, notes,
    buffer, eval: eval_type, pa, reset_fee, copy_trade, vpn, max_accounts, dll,
    fifty_k_all_in, fifty_k_initial_cost, without_discount_usd, discount_usd, discount_percent,
    dca, news, bots, micro_scalping,
    status_color, platforms
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      `INSERT INTO prop_firms (
        name, importance, featured, rating, website, affiliate_link, twitter, discord, 
        last_checked, is_affiliate, discount_code, overall_score, 
        account_category, price, activation_fee, profit_split, 
        max_withdrawal, profit_target, drawdown_limit, days_to_pass, days_to_payout, notes, 
        buffer, eval, pa, reset_fee, copy_trade, vpn, max_accounts, dll, 
        fifty_k_all_in, fifty_k_initial_cost, without_discount_usd, discount_usd, discount_percent,
        dca, news, bots, micro_scalping,
        status_color
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, 
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40
      ) RETURNING *`,
      [
        name, num(importance), featured || false, num(rating), num(website), num(affiliate_link), num(twitter), num(discord), 
        num(last_checked), is_affiliate || false, num(discount_code), num(overall_score), 
        num(account_category), num(price), num(activation_fee), num(profit_split), 
        num(max_withdrawal), num(profit_target), num(drawdown_limit), num(days_to_pass), num(days_to_payout), num(notes),
        buffer || false, num(eval_type), num(pa), num(reset_fee), copy_trade || false, vpn || false,
        num(max_accounts), num(dll), 
        num(fifty_k_all_in), num(fifty_k_initial_cost), num(without_discount_usd), num(discount_usd), num(discount_percent),
        dca || false, news || false, bots || false, micro_scalping || false, 
        status_color || 'green'
      ]
    );

    const firmId = result.rows[0].id;
    await linkPlatforms(client, firmId, platforms);
    
    await client.query('COMMIT');
    
    const newFirm = { ...result.rows[0], platforms: platforms || [] };
    res.status(201).json(newFirm);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating prop firm:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

const bulkCreatePropFirms = async (req, res) => {
  const propFirms = req.body;
  if (!Array.isArray(propFirms) || propFirms.length === 0) {
    return res.status(400).json({ error: 'Invalid data format. Expected an array of prop firms.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insertedFirms = [];

    for (const firm of propFirms) {
      const platformArray = Array.isArray(firm.platforms) ? firm.platforms : 
                            (typeof firm.platforms === 'string' && firm.platforms.trim() !== '' ? [firm.platforms] : []);
                            
      const result = await client.query(
        `INSERT INTO prop_firms (
          name, importance, featured, rating, website, affiliate_link, twitter, discord, 
          last_checked, is_affiliate, discount_code, overall_score, 
          account_category, price, activation_fee, profit_split, 
          max_withdrawal, profit_target, drawdown_limit, days_to_pass, days_to_payout, notes, 
          buffer, eval, pa, reset_fee, copy_trade, vpn, max_accounts, dll, 
          fifty_k_all_in, fifty_k_initial_cost, without_discount_usd, discount_usd, discount_percent,
          dca, news, bots, micro_scalping,
          status_color
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37, $38, $39, $40
        ) RETURNING *`,
        [
          firm.name, num(firm.importance), firm.featured || false, num(firm.rating), num(firm.website), num(firm.affiliate_link), num(firm.twitter), num(firm.discord), 
          num(firm.last_checked), firm.is_affiliate || false, num(firm.discount_code), num(firm.overall_score), 
          num(firm.account_category), num(firm.price), num(firm.activation_fee), num(firm.profit_split), 
          num(firm.max_withdrawal), num(firm.profit_target), num(firm.drawdown_limit), num(firm.days_to_pass), num(firm.days_to_payout), num(firm.notes),
          firm.buffer || false, num(firm.eval), num(firm.pa), num(firm.reset_fee), firm.copy_trade || false, firm.vpn || false,
          num(firm.max_accounts), num(firm.dll), 
          num(firm.fifty_k_all_in), num(firm.fifty_k_initial_cost), num(firm.without_discount_usd), num(firm.discount_usd), num(firm.discount_percent),
          firm.dca || false, firm.news || false, firm.bots || false, firm.micro_scalping || false,
          firm.status_color || 'green'
        ]
      );
      
      const firmId = result.rows[0].id;
      await linkPlatforms(client, firmId, platformArray);
      
      insertedFirms.push({ ...result.rows[0], platforms: platformArray });
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Bulk import successful', count: insertedFirms.length, data: insertedFirms });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk Import Error:', error);
    res.status(500).json({ error: 'Server error during bulk import.' });
  } finally {
    client.release();
  }
};

const updatePropFirm = async (req, res) => {
  const { id } = req.params;
  const { 
    name, importance, featured, rating, website, affiliate_link, twitter, discord, 
    last_checked, is_affiliate, discount_code, overall_score, 
    account_category, price, activation_fee, profit_split, 
    max_withdrawal, profit_target, drawdown_limit, days_to_pass, days_to_payout, notes,
    buffer, eval: eval_type, pa, reset_fee, copy_trade, vpn, max_accounts, dll,
    fifty_k_all_in, fifty_k_initial_cost, without_discount_usd, discount_usd, discount_percent,
    dca, news, bots, micro_scalping,
    status_color, platforms
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      `UPDATE prop_firms SET 
        name=$1, importance=$2, featured=$3, rating=$4, website=$5, affiliate_link=$6, 
        twitter=$7, discord=$8, last_checked=$9, is_affiliate=$10, 
        discount_code=$11, overall_score=$12, account_category=$13, 
        price=$14, activation_fee=$15, profit_split=$16, 
        max_withdrawal=$17, profit_target=$18, drawdown_limit=$19, days_to_pass=$20, 
        days_to_payout=$21, notes=$22, buffer=$23, eval=$24, pa=$25, reset_fee=$26, 
        copy_trade=$27, vpn=$28, max_accounts=$29, dll=$30, 
        fifty_k_all_in=$31, fifty_k_initial_cost=$32, without_discount_usd=$33, 
        discount_usd=$34, discount_percent=$35, dca=$36, news=$37, bots=$38, 
        micro_scalping=$39, status_color=$40 
      WHERE id=$41 RETURNING *`,
      [
        name, num(importance), featured || false, num(rating), num(website), num(affiliate_link), num(twitter), num(discord), 
        num(last_checked), is_affiliate || false, num(discount_code), num(overall_score), 
        num(account_category), num(price), num(activation_fee), num(profit_split), 
        num(max_withdrawal), num(profit_target), num(drawdown_limit), num(days_to_pass), num(days_to_payout), num(notes), 
        buffer || false, num(eval_type), num(pa), num(reset_fee), copy_trade || false, vpn || false,
        num(max_accounts), num(dll), 
        num(fifty_k_all_in), num(fifty_k_initial_cost), num(without_discount_usd), num(discount_usd), num(discount_percent),
        dca || false, news || false, bots || false, micro_scalping || false,
        status_color || 'green', id
      ]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Prop firm not found' });
    }

    // Clear old linked platforms
    await client.query('DELETE FROM prop_firm_platforms WHERE prop_firm_id = $1', [id]);
    
    // Relink
    await linkPlatforms(client, id, platforms);

    await client.query('COMMIT');
    res.json({ ...result.rows[0], platforms: platforms || [] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating prop firm:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

const deletePropFirm = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM prop_firms WHERE id = $1', [id]);
    res.json({ message: 'Prop firm deleted' });
  } catch (error) {
    console.error('Error deleting prop firm:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getPlatforms = async (req, res) => {
  try {
    const result = await pool.query('SELECT name FROM platforms ORDER BY name ASC');
    const platforms = result.rows.map(r => r.name);
    res.json(platforms);
  } catch (error) {
    console.error('Error fetching generic platforms:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getPropFirms, getPropFirmsAdmin, createPropFirm, bulkCreatePropFirms, updatePropFirm, deletePropFirm, getPlatforms };
