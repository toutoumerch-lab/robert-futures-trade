const express    = require('express');
const router     = express.Router();
const uploadBlog = require('../middleware/uploadBlog');
const { handleUploadError } = require('../middleware/uploadBlog');
const { authenticateToken, isAdmin, optionalAuth } = require('../middleware/auth');
const {
  getPosts, getPost,
  createPost, updatePost, togglePublish, deletePost,
  addComment, deleteComment,
  toggleReaction,
} = require('../controllers/postController');

// Public (uses optionalAuth so admins can see drafts via token)
router.get('/',    optionalAuth, getPosts);
router.get('/:id', optionalAuth, getPost);

// Admin — manage posts
router.post('/',   authenticateToken, isAdmin, uploadBlog.single('image'), handleUploadError, createPost);
router.put('/:id', authenticateToken, isAdmin, uploadBlog.single('image'), handleUploadError, updatePost);
router.patch('/:id/publish',      authenticateToken, isAdmin, togglePublish);
router.delete('/:id',             authenticateToken, isAdmin, deletePost);

// Auth — comments
router.post('/:id/comments',                        authenticateToken, addComment);
router.delete('/:id/comments/:commentId',           authenticateToken, isAdmin, deleteComment);

// Auth — reactions
router.post('/:id/reactions',                       authenticateToken, toggleReaction);

module.exports = router;
