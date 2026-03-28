const express = require('express');
const router = express.Router();
const { getPosts, getPost, createPost, updatePost, deletePost, addComment, toggleReaction } = require('../controllers/postController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/', getPosts);
router.get('/:id', getPost);
router.post('/', authenticateToken, isAdmin, createPost);
router.put('/:id', authenticateToken, isAdmin, updatePost);
router.delete('/:id', authenticateToken, isAdmin, deletePost);
router.post('/:id/comments', authenticateToken, addComment);
router.post('/:id/reactions', authenticateToken, toggleReaction);

module.exports = router;
