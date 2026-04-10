import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { ThumbsUp, Flame, Rocket, ArrowLeft } from 'lucide-react';

const BlogDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchPost = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/posts/${id}`);
      setPost(res.data);
      setComments(res.data.comments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  const handleReaction = async (type) => {
    try {
      await axios.post(`http://localhost:5000/api/posts/${id}/reactions`, { type });
      await fetchPost();
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await axios.post(`http://localhost:5000/api/posts/${id}/comments`, { content: newComment });
      setNewComment('');
      await fetchPost();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container py-16">Loading…</div>;
  if (!post) return <div className="container py-16">Post not found. <Link to="/blog"><ArrowLeft size={14} /> Back to Blog</Link></div>;

  return (
    <div className="container py-16" style={{ maxWidth: '800px' }}>
      <Link to="/blog" style={{ color: 'var(--text-secondary)', display: 'inline-block', marginBottom: '2rem' }}>
        <ArrowLeft size={14} /> Back to Blog
      </Link>

      <article>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', lineHeight: 1.2 }}>{post.title}</h1>
        <div className="flex gap-4 items-center mb-8" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <span>By <span style={{ color: 'var(--accent-primary)' }}>{post.author_name}</span></span>
          <span>•</span>
          <span>{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>

        <div className="blog-content" style={{ lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.05rem' }}>
          {post.content.split('\n').map((para, i) => (
            <p key={i} style={{ marginBottom: '1rem' }}>{para}</p>
          ))}
        </div>

        {/* Reactions */}
        <div className="flex gap-4 mb-8">
          <button className="reaction-btn" onClick={() => handleReaction('like')}><ThumbsUp size={16} /> Like</button>
          <button className="reaction-btn" onClick={() => handleReaction('fire')}><Flame size={16} /> Fire</button>
          <button className="reaction-btn" onClick={() => handleReaction('rocket')}><Rocket size={16} /> Rocket</button>
        </div>
      </article>

      {/* Comments */}
      <Card>
        <h3 className="mb-6">Comments ({comments.length})</h3>

        {user ? (
          <form onSubmit={handleComment} className="mb-6">
            <textarea
              className="input"
              rows={3}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Share your thoughts…"
              style={{ marginBottom: '1rem', resize: 'vertical' }}
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Posting…' : 'Post Comment'}
            </Button>
          </form>
        ) : (
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            <Link to="/login">Sign in</Link> to leave a comment.
          </p>
        )}

        <div className="flex-col gap-4">
          {comments.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No comments yet. Be the first!</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="comment-item">
                <div className="flex justify-between items-center mb-2">
                  <span style={{ fontWeight: 600 }}>{c.author_name}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>{c.content}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default BlogDetail;
