const { pool } = require('../config/db');

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Strip dangerous HTML / script tags from user-submitted text */
const sanitize = (str = '') =>
  str.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
     .replace(/<[^>]+>/g, '')
     .trim();

/** Build a plain-text excerpt from HTML/plain content */
const buildExcerpt = (content = '', len = 200) => {
  const plain = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return plain.length > len ? plain.substring(0, len) + '…' : plain;
};

/** Estimate read time based on word count (200 wpm) */
const calcReadTime = (content = '') => {
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
  const mins  = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
};

// ─── Public: GET /api/posts ──────────────────────────────────────────────────
const getPosts = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';

    const result = await pool.query(`
      SELECT
        p.id, p.title, p.content, p.excerpt, p.category, p.image_url,
        p.is_published, p.read_time, p.created_at,
        u.name  AS author_name,
        u.email AS author_email,
        (SELECT COUNT(*) FROM comments  c WHERE c.post_id = p.id)         AS comment_count,
        (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id AND r.type = 'like')    AS likes,
        (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id AND r.type = 'fire')    AS fires,
        (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id AND r.type = 'insight') AS insights
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ${isAdmin ? '' : 'WHERE p.is_published = TRUE'}
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('getPosts error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Public: GET /api/posts/:id ──────────────────────────────────────────────
const getPost = async (req, res) => {
  const { id } = req.params;
  try {
    const postRes = await pool.query(`
      SELECT
        p.*,
        u.name  AS author_name,
        u.email AS author_email
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `, [id]);

    if (postRes.rows.length === 0) return res.status(404).json({ error: 'Post not found' });

    const post = postRes.rows[0];

    // Comments with author info
    const commentsRes = await pool.query(`
      SELECT c.*, u.name AS author_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [id]);

    // Reaction counts grouped by type
    const reactionsRes = await pool.query(`
      SELECT type, COUNT(*) AS count
      FROM reactions
      WHERE post_id = $1
      GROUP BY type
    `, [id]);

    // If user is authenticated, find which reactions they've already made
    let userReactions = [];
    if (req.user?.id) {
      const userRxRes = await pool.query(
        'SELECT type FROM reactions WHERE post_id = $1 AND user_id = $2',
        [id, req.user.id]
      );
      userReactions = userRxRes.rows.map(r => r.type);
    }

    post.comments   = commentsRes.rows;
    post.reactions  = reactionsRes.rows;
    post.user_reactions = userReactions;

    res.json(post);
  } catch (err) {
    console.error('getPost error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Admin: POST /api/posts ──────────────────────────────────────────────────
const createPost = async (req, res) => {
  const { title, content, category, is_published, read_time, excerpt } = req.body;
  const image_url  = req.file ? `/uploads/blog/${req.file.filename}` : null;
  const finalExcerpt   = excerpt?.trim() || buildExcerpt(content);
  const finalReadTime  = read_time?.trim() || calcReadTime(content);
  const published      = is_published === 'true' || is_published === true;

  try {
    const result = await pool.query(`
      INSERT INTO posts (title, content, image_url, category, is_published, read_time, excerpt, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [title, content, image_url, category || 'General', published, finalReadTime, finalExcerpt, req.user.id]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createPost error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Admin: PUT /api/posts/:id ───────────────────────────────────────────────
const updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, content, category, is_published, read_time, excerpt } = req.body;
  const published     = is_published === 'true' || is_published === true;
  const finalExcerpt  = excerpt?.trim() || buildExcerpt(content);
  const finalReadTime = read_time?.trim() || calcReadTime(content);

  try {
    let image_url = null;
    if (req.file) {
      // New file uploaded — use it
      image_url = `/uploads/blog/${req.file.filename}`;
    } else if (req.body.remove_image === 'true') {
      // Admin explicitly removed the cover image — set to null
      image_url = null;
    } else {
      // No change — keep existing image
      const existing = await pool.query('SELECT image_url FROM posts WHERE id = $1', [id]);
      image_url = existing.rows[0]?.image_url || null;
    }

    const result = await pool.query(`
      UPDATE posts
      SET title        = $1,
          content      = $2,
          image_url    = $3,
          category     = $4,
          is_published = $5,
          read_time    = $6,
          excerpt      = $7
      WHERE id = $8
      RETURNING *
    `, [title, content, image_url, category || 'General', published, finalReadTime, finalExcerpt, id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updatePost error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Admin: PATCH /api/posts/:id/publish ────────────────────────────────────
const togglePublish = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      UPDATE posts
      SET is_published = NOT is_published
      WHERE id = $1
      RETURNING id, is_published
    `, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('togglePublish error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Admin: DELETE /api/posts/:id ────────────────────────────────────────────
const deletePost = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM posts WHERE id = $1', [id]);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error('deletePost error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Auth: POST /api/posts/:id/comments ─────────────────────────────────────
const addComment = async (req, res) => {
  const { id } = req.params;
  const content = sanitize(req.body.content || '');
  if (!content) return res.status(400).json({ error: 'Comment cannot be empty' });

  try {
    const result = await pool.query(`
      INSERT INTO comments (post_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [id, req.user.id, content]);

    // Return with author name
    const full = await pool.query(`
      SELECT c.*, u.name AS author_name
      FROM comments c JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [result.rows[0].id]);

    res.status(201).json(full.rows[0]);
  } catch (err) {
    console.error('addComment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Admin: DELETE /api/posts/:id/comments/:commentId ───────────────────────
const deleteComment = async (req, res) => {
  const { commentId } = req.params;
  try {
    await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('deleteComment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Auth: POST /api/posts/:id/reactions ─────────────────────────────────────
const toggleReaction = async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;

  const VALID = ['like', 'fire', 'insight'];
  if (!VALID.includes(type)) return res.status(400).json({ error: 'Invalid reaction type' });

  try {
    const existing = await pool.query(
      'SELECT id FROM reactions WHERE post_id = $1 AND user_id = $2 AND type = $3',
      [id, req.user.id, type]
    );

    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM reactions WHERE id = $1', [existing.rows[0].id]);
      res.json({ action: 'removed', type });
    } else {
      await pool.query(
        'INSERT INTO reactions (post_id, user_id, type) VALUES ($1, $2, $3)',
        [id, req.user.id, type]
      );
      res.status(201).json({ action: 'added', type });
    }
  } catch (err) {
    console.error('toggleReaction error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Admin: POST /api/posts/upload-inline-image ────────────────────────────
const uploadInlineImage = (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided' });
  res.json({ url: `/uploads/blog/${req.file.filename}` });
};

module.exports = {
  getPosts, getPost,
  createPost, updatePost, togglePublish, deletePost,
  addComment, deleteComment,
  toggleReaction,
  uploadInlineImage,
};
