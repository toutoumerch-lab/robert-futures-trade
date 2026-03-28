const { pool } = require('../config/db');

// Get all posts
const getPosts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.name as author_name 
      FROM posts p 
      JOIN users u ON p.user_id = u.id 
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single post with comments and reactions
const getPost = async (req, res) => {
  const { id } = req.params;
  try {
    const postRes = await pool.query('SELECT p.*, u.name as author_name FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = $1', [id]);
    if (postRes.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    
    const commentsRes = await pool.query('SELECT c.*, u.name as author_name FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = $1 ORDER BY c.created_at ASC', [id]);
    const reactionsRes = await pool.query('SELECT type, COUNT(*) as count FROM reactions WHERE post_id = $1 GROUP BY type', [id]);

    const post = postRes.rows[0];
    post.comments = commentsRes.rows;
    post.reactions = reactionsRes.rows;

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Create post (Admin only)
const createPost = async (req, res) => {
  const { title, content } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO posts (title, content, user_id) VALUES ($1, $2, $3) RETURNING *',
      [title, content, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Add comment
const addComment = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [id, req.user.id, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Toggle reaction
const toggleReaction = async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM reactions WHERE post_id = $1 AND user_id = $2 AND type = $3', [id, req.user.id, type]);
    
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM reactions WHERE id = $1', [existing.rows[0].id]);
      res.json({ message: 'Reaction removed' });
    } else {
      await pool.query('INSERT INTO reactions (post_id, user_id, type) VALUES ($1, $2, $3)', [id, req.user.id, type]);
      res.status(201).json({ message: 'Reaction added' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Update post (Admin)
const updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  try {
    const result = await pool.query(
      'UPDATE posts SET title = $1, content = $2 WHERE id = $3 RETURNING *',
      [title, content, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete post (Admin)
const deletePost = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM posts WHERE id = $1', [id]);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getPosts, getPost, createPost, updatePost, deletePost, addComment, toggleReaction };
