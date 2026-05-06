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

// ── Type-safe helpers ──────────────────────────────────────────────────────────
// Returns null for empty/undefined, otherwise the raw string value (for text columns)
const text = (v) => {
  if (v === '' || v === undefined || v === 'undefined' || v === null || v === 'null') return null;
  return String(v);
};

// Returns null for empty/undefined, otherwise a proper integer (for integer columns)
const int = (v) => {
  if (v === '' || v === undefined || v === 'undefined' || v === null || v === 'null') return null;
  const n = Number(v);
  if (isNaN(n)) return null;
  return Math.round(n); // PostgreSQL integer columns reject decimals
};

// Returns null for empty/undefined, otherwise a proper float (for double precision columns)
const float = (v) => {
  if (v === '' || v === undefined || v === 'undefined' || v === null || v === 'null') return null;
  const n = Number(v);
  if (isNaN(n)) return null;
  return n;
};

// Parses booleans from string "true"/"false" or actual boolean
const parseBool = (v) => v === 'true' || v === true;

// Parses JSON array or returns array
const parseArray = (v) => {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  try { return JSON.parse(v); } catch(e) { return [v]; }
};

// Parses date value, returns null if invalid
const parseDate = (v) => {
  if (!v || v === '' || v === 'undefined' || v === 'null') return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : v;
};

const getPropFirms = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, name, importance, featured, rating, website, affiliate_link, twitter, discord, 
        last_checked, is_affiliate, discount_code, overall_score, 
        account_category, price, activation_fee, profit_split, 
        max_withdrawal, profit_target, drawdown_limit, days_to_pass, days_to_payout, notes,
        buffer, buffer_amount, eval, pa, reset_fee, copy_trade, vpn, max_accounts, dll,
        fifty_k_all_in, fifty_k_initial_cost, without_discount_usd, discount_usd, discount_percent,
        dca, news, bots, micro_scalping,
        logo_url, created_at, group_name, status_color,
        COALESCE(
          (SELECT json_agg(p.name) 
           FROM prop_firm_platforms pfp 
           JOIN platforms p ON pfp.platform_id = p.id 
           WHERE pfp.prop_firm_id = prop_firms.id),
          '[]'::json
        ) as platforms
      FROM prop_firms
      ORDER BY
        CASE status_color
          WHEN 'green'  THEN 1
          WHEN 'blue'   THEN 2
          WHEN 'yellow' THEN 3
          WHEN 'red'    THEN 4
          ELSE 5
        END,
        overall_score DESC NULLS LAST,
        created_at DESC
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
  console.log('[CREATE PROP FIRM] Incoming body keys:', Object.keys(req.body));
  console.log('[CREATE PROP FIRM] Has file:', !!req.file);

  const body = req.body;
  const logo_url = req.file ? `/uploads/prop-firms/${req.file.filename}` : null;
  const parsedPlatforms = parseArray(body.platforms);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      `INSERT INTO prop_firms (
        name, importance, featured, rating, website, affiliate_link, twitter, discord, 
        last_checked, is_affiliate, discount_code, overall_score, 
        account_category, price, activation_fee, profit_split, 
        max_withdrawal, profit_target, drawdown_limit, days_to_pass, days_to_payout, notes, 
        buffer, buffer_amount, eval, pa, reset_fee, copy_trade, vpn, max_accounts, dll, 
        fifty_k_all_in, fifty_k_initial_cost, without_discount_usd, discount_usd, discount_percent,
        dca, news, bots, micro_scalping,
        status_color, logo_url, group_name
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, 
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43
      ) RETURNING *`,
      [
        /* $1  name             */ text(body.name),
        /* $2  importance       */ text(body.importance),       // DB: text
        /* $3  featured         */ parseBool(body.featured),     // DB: boolean
        /* $4  rating           */ float(body.rating),           // DB: double precision
        /* $5  website          */ text(body.website),           // DB: text
        /* $6  affiliate_link   */ text(body.affiliate_link),    // DB: text
        /* $7  twitter          */ text(body.twitter),           // DB: text
        /* $8  discord          */ text(body.discord),           // DB: text
        /* $9  last_checked     */ parseDate(body.last_checked), // DB: date
        /* $10 is_affiliate     */ parseBool(body.is_affiliate), // DB: boolean
        /* $11 discount_code    */ text(body.discount_code),     // DB: text
        /* $12 overall_score    */ float(body.overall_score),    // DB: double precision
        /* $13 account_category */ text(body.account_category),  // DB: text
        /* $14 price            */ int(body.price),              // DB: integer
        /* $15 activation_fee   */ int(body.activation_fee),     // DB: integer
        /* $16 profit_split     */ text(body.profit_split),      // DB: text
        /* $17 max_withdrawal   */ text(body.max_withdrawal),    // DB: text
        /* $18 profit_target    */ text(body.profit_target),     // DB: text
        /* $19 drawdown_limit   */ text(body.drawdown_limit),    // DB: text
        /* $20 days_to_pass     */ text(body.days_to_pass),      // DB: text
        /* $21 days_to_payout   */ text(body.days_to_payout),    // DB: text
        /* $22 notes            */ text(body.notes),             // DB: text
        /* $23 buffer           */ parseBool(body.buffer),       // DB: boolean
        /* $24 buffer_amount    */ parseBool(body.buffer) ? text(body.buffer_amount) : null, // DB: text
        /* $25 eval             */ text(body.eval),              // DB: text
        /* $26 pa               */ text(body.pa),                // DB: text
        /* $27 reset_fee        */ text(body.reset_fee),         // DB: text
        /* $28 copy_trade       */ parseBool(body.copy_trade),   // DB: boolean
        /* $29 vpn              */ parseBool(body.vpn),          // DB: boolean
        /* $30 max_accounts     */ text(body.max_accounts),      // DB: text
        /* $31 dll              */ text(body.dll),               // DB: text
        /* $32 fifty_k_all_in       */ int(body.fifty_k_all_in),       // DB: integer
        /* $33 fifty_k_initial_cost */ int(body.fifty_k_initial_cost), // DB: integer
        /* $34 without_discount_usd */ int(body.without_discount_usd), // DB: integer
        /* $35 discount_usd         */ int(body.discount_usd),         // DB: integer
        /* $36 discount_percent     */ int(body.discount_percent),     // DB: integer
        /* $37 dca              */ parseBool(body.dca),           // DB: boolean
        /* $38 news             */ parseBool(body.news),          // DB: boolean
        /* $39 bots             */ parseBool(body.bots),          // DB: boolean
        /* $40 micro_scalping   */ parseBool(body.micro_scalping),// DB: boolean
        /* $41 status_color     */ body.status_color || 'green',  // DB: varchar
        /* $42 logo_url         */ logo_url,                      // DB: text
        /* $43 group_name       */ text(body.group_name)           // DB: text
      ]
    );

    const firmId = result.rows[0].id;
    await linkPlatforms(client, firmId, parsedPlatforms);
    
    await client.query('COMMIT');
    
    const newFirm = { ...result.rows[0], platforms: parsedPlatforms };
    console.log('[CREATE PROP FIRM] Success:', newFirm.name, '(id:', firmId, ')');
    res.status(201).json(newFirm);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[CREATE PROP FIRM] ERROR:', error.message);
    console.error('[CREATE PROP FIRM] Detail:', error.detail || 'none');
    console.error('[CREATE PROP FIRM] Stack:', error.stack);
    res.status(500).json({ error: 'Server error', message: error.message });
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
          text(firm.name), text(firm.importance), firm.featured || false, float(firm.rating),
          text(firm.website), text(firm.affiliate_link), text(firm.twitter), text(firm.discord), 
          parseDate(firm.last_checked), firm.is_affiliate || false, text(firm.discount_code), float(firm.overall_score), 
          text(firm.account_category), int(firm.price), int(firm.activation_fee), text(firm.profit_split), 
          text(firm.max_withdrawal), text(firm.profit_target), text(firm.drawdown_limit), text(firm.days_to_pass), text(firm.days_to_payout), text(firm.notes),
          firm.buffer || false, text(firm.eval), text(firm.pa), text(firm.reset_fee), firm.copy_trade || false, firm.vpn || false,
          text(firm.max_accounts), text(firm.dll), 
          int(firm.fifty_k_all_in), int(firm.fifty_k_initial_cost), int(firm.without_discount_usd), int(firm.discount_usd), int(firm.discount_percent),
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
  console.log('[UPDATE PROP FIRM] id:', id, 'body keys:', Object.keys(req.body));

  const body = req.body;
  const logo_url = req.file ? `/uploads/prop-firms/${req.file.filename}` : text(body.logo_url);
  const parsedPlatforms = parseArray(body.platforms);

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
        days_to_payout=$21, notes=$22, buffer=$23, buffer_amount=$24, eval=$25, pa=$26, reset_fee=$27, 
        copy_trade=$28, vpn=$29, max_accounts=$30, dll=$31, 
        fifty_k_all_in=$32, fifty_k_initial_cost=$33, without_discount_usd=$34, 
        discount_usd=$35, discount_percent=$36, dca=$37, news=$38, bots=$39, 
        micro_scalping=$40, status_color=$41, logo_url=$42, group_name=$43
      WHERE id=$44 RETURNING *`,
      [
        /* $1  name             */ text(body.name),
        /* $2  importance       */ text(body.importance),       // DB: text
        /* $3  featured         */ parseBool(body.featured),     // DB: boolean
        /* $4  rating           */ float(body.rating),           // DB: double precision
        /* $5  website          */ text(body.website),           // DB: text
        /* $6  affiliate_link   */ text(body.affiliate_link),    // DB: text
        /* $7  twitter          */ text(body.twitter),           // DB: text
        /* $8  discord          */ text(body.discord),           // DB: text
        /* $9  last_checked     */ parseDate(body.last_checked), // DB: date
        /* $10 is_affiliate     */ parseBool(body.is_affiliate), // DB: boolean
        /* $11 discount_code    */ text(body.discount_code),     // DB: text
        /* $12 overall_score    */ float(body.overall_score),    // DB: double precision
        /* $13 account_category */ text(body.account_category),  // DB: text
        /* $14 price            */ int(body.price),              // DB: integer
        /* $15 activation_fee   */ int(body.activation_fee),     // DB: integer
        /* $16 profit_split     */ text(body.profit_split),      // DB: text
        /* $17 max_withdrawal   */ text(body.max_withdrawal),    // DB: text
        /* $18 profit_target    */ text(body.profit_target),     // DB: text
        /* $19 drawdown_limit   */ text(body.drawdown_limit),    // DB: text
        /* $20 days_to_pass     */ text(body.days_to_pass),      // DB: text
        /* $21 days_to_payout   */ text(body.days_to_payout),    // DB: text
        /* $22 notes            */ text(body.notes),             // DB: text
        /* $23 buffer           */ parseBool(body.buffer),       // DB: boolean
        /* $24 buffer_amount    */ parseBool(body.buffer) ? text(body.buffer_amount) : null, // DB: text
        /* $25 eval             */ text(body.eval),              // DB: text
        /* $26 pa               */ text(body.pa),                // DB: text
        /* $27 reset_fee        */ text(body.reset_fee),         // DB: text
        /* $28 copy_trade       */ parseBool(body.copy_trade),   // DB: boolean
        /* $29 vpn              */ parseBool(body.vpn),          // DB: boolean
        /* $30 max_accounts     */ text(body.max_accounts),      // DB: text
        /* $31 dll              */ text(body.dll),               // DB: text
        /* $32 fifty_k_all_in       */ int(body.fifty_k_all_in),       // DB: integer
        /* $33 fifty_k_initial_cost */ int(body.fifty_k_initial_cost), // DB: integer
        /* $34 without_discount_usd */ int(body.without_discount_usd), // DB: integer
        /* $35 discount_usd         */ int(body.discount_usd),         // DB: integer
        /* $36 discount_percent     */ int(body.discount_percent),     // DB: integer
        /* $37 dca              */ parseBool(body.dca),           // DB: boolean
        /* $38 news             */ parseBool(body.news),          // DB: boolean
        /* $39 bots             */ parseBool(body.bots),          // DB: boolean
        /* $40 micro_scalping   */ parseBool(body.micro_scalping),// DB: boolean
        /* $41 status_color     */ body.status_color || 'green',  // DB: varchar
        /* $42 logo_url         */ logo_url,                      // DB: text
        /* $43 group_name       */ text(body.group_name),          // DB: text
        /* $44 id               */ id
      ]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Prop firm not found' });
    }

    // Clear old linked platforms
    await client.query('DELETE FROM prop_firm_platforms WHERE prop_firm_id = $1', [id]);
    
    // Relink
    await linkPlatforms(client, id, parsedPlatforms);

    await client.query('COMMIT');
    console.log('[UPDATE PROP FIRM] Success:', result.rows[0].name);
    res.json({ ...result.rows[0], platforms: parsedPlatforms });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[UPDATE PROP FIRM] ERROR:', error.message);
    console.error('[UPDATE PROP FIRM] Detail:', error.detail || 'none');
    res.status(500).json({ error: 'Server error', message: error.message });
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

const getGroups = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT name, image_url FROM prop_firm_groups ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ── PATCH /api/prop-firms/:id/group — quick group assignment ──────────────────
const patchGroupName = async (req, res) => {
  const { id } = req.params;
  const { group_name } = req.body;
  try {
    // Auto-create group entry if it doesn't exist
    if (group_name) {
      await pool.query(
        'INSERT INTO prop_firm_groups (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [group_name]
      );
    }
    const result = await pool.query(
      'UPDATE prop_firms SET group_name = $1 WHERE id = $2 RETURNING id, name, group_name',
      [group_name || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Prop firm not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error patching group:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ── POST /api/prop-firms/groups/:name/image — upload group logo ───────────────
const upsertGroupImage = async (req, res) => {
  const { name } = req.params;
  const image_url = req.file ? `/uploads/group-logos/${req.file.filename}` : null;
  if (!image_url) return res.status(400).json({ error: 'No image provided' });
  try {
    await pool.query(
      'INSERT INTO prop_firm_groups (name, image_url) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET image_url = $2',
      [name, image_url]
    );
    res.json({ name, image_url });
  } catch (error) {
    console.error('Error uploading group image:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getPropFirms, getPropFirmsAdmin, createPropFirm, bulkCreatePropFirms, updatePropFirm, deletePropFirm, getPlatforms, getGroups, patchGroupName, upsertGroupImage };
