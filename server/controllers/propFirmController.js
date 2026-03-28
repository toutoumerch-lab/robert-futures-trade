const { pool } = require('../config/db');

const getPropFirms = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM prop_firms ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const createPropFirm = async (req, res) => {
  const { name, description, max_allocation, profit_split, cost } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO prop_firms (name, description, max_allocation, profit_split, cost) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, max_allocation, profit_split, cost]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const bulkCreatePropFirms = async (req, res) => {
  const propFirms = req.body;
  if (!Array.isArray(propFirms) || propFirms.length === 0) {
    return res.status(400).json({ error: 'Invalid data format. Expected a non-empty array of prop firms.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insertedFirms = [];

    for (const firm of propFirms) {
      const { name, description, max_allocation, profit_split, cost } = firm;
      const result = await client.query(
        'INSERT INTO prop_firms (name, description, max_allocation, profit_split, cost) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, description, max_allocation, profit_split, cost]
      );
      insertedFirms.push(result.rows[0]);
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
  const { name, description, max_allocation, profit_split, cost } = req.body;
  try {
    const result = await pool.query(
      'UPDATE prop_firms SET name=$1, description=$2, max_allocation=$3, profit_split=$4, cost=$5 WHERE id=$6 RETURNING *',
      [name, description, max_allocation, profit_split, cost, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Prop firm not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deletePropFirm = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM prop_firms WHERE id = $1', [id]);
    res.json({ message: 'Prop firm deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getPropFirms, createPropFirm, bulkCreatePropFirms, updatePropFirm, deletePropFirm };
