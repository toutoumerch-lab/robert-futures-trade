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

  // Upsert helper
  const upsert = async (key, value) => {
    await pool.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
      [key, value]
    );
  };

  // Delete helper
  const remove = async (key) => {
    await pool.query('DELETE FROM settings WHERE key = $1', [key]);
  };

  try {
    // — Site Name
    if (site_name) {
      await upsert('site_name', site_name);
    }

    // — Logo Size
    if (req.body.site_logo_size) {
      await upsert('site_logo_size', req.body.site_logo_size.toString());
    }

    // — Site Name Color (clearable)
    if (site_name_color !== undefined) {
      if (site_name_color === '' || site_name_color === null) {
        await remove('site_name_color');
      } else if (hexRegex.test(site_name_color)) {
        await upsert('site_name_color', site_name_color);
      } else {
        return res.status(400).json({ error: 'Invalid color. Must be a valid HEX code (e.g. #6C5CE7).' });
      }
    }

    // — Theme Color Keys (clearable HEX values)
    const colorKeys = ['theme_primary_color', 'theme_secondary_color', 'theme_accent_color'];
    for (const key of colorKeys) {
      if (req.body[key] !== undefined) {
        const val = req.body[key];
        if (val === '' || val === null) {
          await remove(key);
        } else if (hexRegex.test(val)) {
          await upsert(key, val);
        } else {
          return res.status(400).json({ error: `Invalid ${key}. Must be a valid HEX code (e.g. #6C5CE7).` });
        }
      }
    }

    // — Theme Layout (enum)
    if (req.body.theme_layout !== undefined) {
      const valid = ['default', 'compact', 'modern'];
      if (valid.includes(req.body.theme_layout)) {
        await upsert('theme_layout', req.body.theme_layout);
      } else {
        return res.status(400).json({ error: 'Invalid layout. Must be: default, compact, or modern.' });
      }
    }

    // — Theme Mode (enum)
    if (req.body.theme_mode !== undefined) {
      const valid = ['light', 'dark', 'system'];
      if (valid.includes(req.body.theme_mode)) {
        await upsert('theme_mode', req.body.theme_mode);
      } else {
        return res.status(400).json({ error: 'Invalid theme mode. Must be: light, dark, or system.' });
      }
    }

    // — Social Media Links (clearable URL strings)
    const socialKeys = ['social_twitter', 'social_youtube', 'social_instagram', 'social_discord', 'social_facebook'];
    for (const key of socialKeys) {
      if (req.body[key] !== undefined) {
        const val = req.body[key];
        if (val === '' || val === null) {
          await remove(key);
        } else {
          await upsert(key, val);
        }
      }
    }

    // \u2014 About Page Stats (numeric strings)
    const aboutKeys = ['about_student_offset', 'about_pass_rate', 'about_countries'];
    for (const key of aboutKeys) {
      if (req.body[key] !== undefined) {
        const val = req.body[key];
        if (val === '' || val === null) {
          await remove(key);
        } else {
          const num = parseInt(val, 10);
          if (isNaN(num) || num < 0) {
            return res.status(400).json({ error: `Invalid ${key}. Must be a non-negative integer.` });
          }
          await upsert(key, num.toString());
        }
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
const updateFavicon = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No favicon file uploaded' });
    }

    const faviconUrl = `/uploads/branding/${req.file.filename}`;
    
    await pool.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
      ['site_favicon', faviconUrl]
    );

    res.json({ 
      message: 'Favicon updated successfully',
      favicon_url: faviconUrl 
    });
  } catch (error) {
    console.error('Error updating favicon:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  updateLogo,
  updateFavicon
};
