const { pool } = require('../config/db');

const getSettings = async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateSettings = async (req, res) => {
  const { site_name, site_name_color } = req.body;
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;

  try {
    if (site_name) {
      await pool.query(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
        ['site_name', site_name]
      );
    }
    if (req.body.site_logo_size) {
      await pool.query(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
        ['site_logo_size', req.body.site_logo_size.toString()]
      );
    }

    // Site Name Color
    if (site_name_color !== undefined) {
      if (site_name_color === '' || site_name_color === null) {
        await pool.query('DELETE FROM settings WHERE key = $1', ['site_name_color']);
      } else if (hexRegex.test(site_name_color)) {
        await pool.query(
          'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
          ['site_name_color', site_name_color]
        );
      } else {
        return res.status(400).json({ error: 'Invalid color. Must be a valid HEX code (e.g. #6C5CE7).' });
      }
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const logoUrl = `/uploads/branding/${req.file.filename}`;
    
    await pool.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
      ['site_logo', logoUrl]
    );

    res.json({ 
      message: 'Logo updated successfully',
      logo_url: logoUrl 
    });
  } catch (error) {
    console.error('Error updating logo:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  updateLogo
};
