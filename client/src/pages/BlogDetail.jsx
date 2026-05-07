import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SEO from '../components/common/SEO';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, ThumbsUp, Flame, Lightbulb, MessageSquare,
  Clock, Calendar, Trash2, BookOpen, Send, User
} from 'lucide-react';

const REACTIONS = [
  { type: 'like',    icon: ThumbsUp,    label: 'Like',       emoji: '👍' },
  { type: 'fire',    icon: Flame,       label: 'Useful',     emoji: '🔥' },
  { type: 'insight', icon: Lightbulb,   label: 'Insightful', emoji: '💡' },
];

const BlogDetail = () => {
  const { id }       = useParams();
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const commentRef   = useRef(null);

  const [post, setPost]           = useState(null);
  const [comments, setComments]   = useState([]);
  const [reactions, setReactions] = useState({});
  const [userRx, setUserRx]       = useState([]);
  const [newComment, setNew]      = useState('');
  const [loading, setLoading]     = useState(true);
  const [submitting, setSub]      = useState(false);
  const [rxLoading, setRxLoad]    = useState(null);
  const [scrollPct, setScroll]    = useState(0);

  // ── Reading progress bar ────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const el  = document.documentElement;
      const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
      setScroll(Math.min(100, Math.max(0, pct || 0)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Fetch post ──────────────────────────────────────────────────────────────
  const fetchPost = useCallback(async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/posts/${id}`);
      const data = res.data;
      setPost(data);
      setComments(data.comments || []);

      // Build reaction counts map
      const rxMap = {};
      (data.reactions || []).forEach(r => { rxMap[r.type] = parseInt(r.count, 10); });
      setReactions(rxMap);
      setUserRx(data.user_reactions || []);
    } catch (err) {
      console.error('fetchPost error:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  // ── Reaction toggle ─────────────────────────────────────────────────────────
  const handleReaction = async (type) => {
    if (!user) { navigate('/login'); return; }
    setRxLoad(type);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/posts/${id}/reactions`, { type });
      if (res.data.action === 'added') {
        setReactions(prev => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
        setUserRx(prev => [...prev, type]);
      } else {
        setReactions(prev => ({ ...prev, [type]: Math.max(0, (prev[type] || 1) - 1) }));
        setUserRx(prev => prev.filter(t => t !== type));
      }
    } catch (err) {
      console.error('toggleReaction error:', err);
    } finally {
      setRxLoad(null);
    }
  };

  // ── Submit comment ───────────────────────────────────────────────────────────
  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSub(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/posts/${id}/comments`, { content: newComment });
      setComments(prev => [...prev, res.data]);
      setNew('');
    } catch (err) {
      console.error('addComment error:', err);
    } finally {
      setSub(false);
    }
  };

  // ── Delete comment (admin) ───────────────────────────────────────────────────
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/posts/${id}/comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('deleteComment error:', err);
    }
  };

  // ── Render content with paragraph support ────────────────────────────────────
  const renderContent = (content = '') =>
    content.split('\n').filter(Boolean).map((para, i) => (
      <p key={i} className="blog-prose-para">{para}</p>
    ));

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="blog-detail-loading">
        <div className="container" style={{ maxWidth: '760px' }}>
          <div className="blog-detail-skeleton">
            <div className="bds-line bds-line-short" />
            <div className="bds-line bds-line-title" />
            <div className="bds-line bds-line-meta" />
            <div className="bds-img" />
            {[1,2,3].map(i => <div key={i} className="bds-line" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container py-16 text-center">
        <BookOpen size={52} style={{ color: 'var(--accent-primary)', marginBottom: '1.5rem', display: 'block', margin: '0 auto 1.5rem' }} />
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Post not found</h2>
        <Link to="/blog" className="btn btn-primary">Back to Blog</Link>
      </div>
    );
  }

  const publishedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <>
      <SEO
        title={post.title}
        description={post.content ? post.content.slice(0, 155).replace(/\n/g, ' ') + '…' : undefined}
        url={`/blog/${id}`}
        image={post.image_url ? `https://roberttrades.com${post.image_url}` : undefined}
        type="article"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          url: `https://roberttrades.com/blog/${id}`,
          datePublished: post.created_at,
          author: { '@type': 'Organization', name: 'Robert Trades' },
          description: post.content ? post.content.slice(0, 155) : '',
          image: post.image_url ? `https://roberttrades.com${post.image_url}` : undefined,
        }}
      />
      {/* ── Reading progress bar ─────────────────────────────────────────── */}
      <div className="reading-progress-bar" style={{ width: `${scrollPct}%` }} />

      {/* ── Cover image ──────────────────────────────────────────────────── */}
      {post.image_url && (
        <div className="blog-detail-cover">
          <img
            src={`${import.meta.env.VITE_API_URL}${post.image_url}`}
            alt={post.title}
            className="blog-detail-cover-img"
          />
          <div className="blog-detail-cover-overlay" />
        </div>
      )}

      <div className="container blog-detail-wrap">
        {/* ── Back link ────────────────────────────────────────────────── */}
        <Link to="/blog" className="blog-back-link" id="blog-back">
          <ArrowLeft size={16} /> Back to Blog
        </Link>

        {/* ── Article ──────────────────────────────────────────────────── */}
        <article className="blog-article">
          {/* Category badge */}
          {post.category && (
            <span className="blog-badge blog-badge-cat">{post.category}</span>
          )}

          {/* Title */}
          <h1 className="blog-article-title">{post.title}</h1>

          {/* Meta row */}
          <div className="blog-article-meta">
            <div className="blog-author-chip">
              <div className="blog-avatar">{(post.author_name || 'A')[0].toUpperCase()}</div>
              <div>
                <div className="blog-author-name">{post.author_name}</div>
                <div className="blog-author-sub">Author</div>
              </div>
            </div>
            <div className="blog-article-meta-right">
              <Calendar size={14} />
              <span>{publishedDate}</span>
              <span className="blog-meta-dot">·</span>
              <Clock size={14} />
              <span>{post.read_time || '3 min read'}</span>
              <span className="blog-meta-dot">·</span>
              <MessageSquare size={14} />
              <span>{comments.length} comments</span>
            </div>
          </div>

          {/* Divider */}
          <div className="blog-divider" />

          {/* Prose content */}
          <div className="blog-prose">
            {renderContent(post.content)}
          </div>

          {/* ── Reactions bar ─────────────────────────────────────────── */}
          <div className="blog-reactions-bar">
            <div className="blog-reactions-label">
              <MessageSquare size={14} />
              <span>Was this helpful?</span>
            </div>
            <div className="blog-reactions-btns">
              {REACTIONS.map(({ type, label, emoji }) => {
                const active  = userRx.includes(type);
                const count   = reactions[type] || 0;
                const loading = rxLoading === type;
                return (
                  <button
                    key={type}
                    id={`reaction-${type}`}
                    className={`blog-reaction-btn ${active ? 'active' : ''} ${loading ? 'loading' : ''}`}
                    onClick={() => handleReaction(type)}
                    title={label}
                  >
                    <span className="reaction-emoji">{emoji}</span>
                    <span className="reaction-label">{label}</span>
                    {count > 0 && <span className="reaction-count">{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </article>

        {/* ── Comments section ──────────────────────────────────────────── */}
        <section className="blog-comments-section" id="comments">
          <div className="blog-comments-header">
            <h3 className="blog-comments-title">
              <MessageSquare size={20} />
              {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
            </h3>
          </div>

          {/* Input */}
          {user ? (
            <form onSubmit={handleComment} className="blog-comment-form">
              <div className="blog-avatar large">{(user.name || 'U')[0].toUpperCase()}</div>
              <div className="blog-comment-input-wrap">
                <textarea
                  id="comment-input"
                  className="blog-comment-input"
                  rows={3}
                  value={newComment}
                  onChange={e => setNew(e.target.value)}
                  placeholder="Share your thoughts…"
                  ref={commentRef}
                />
                <button
                  type="submit"
                  id="comment-submit"
                  className="blog-comment-submit"
                  disabled={submitting || !newComment.trim()}
                >
                  {submitting ? 'Posting…' : <><Send size={14} /> Post Comment</>}
                </button>
              </div>
            </form>
          ) : (
            <div className="blog-comment-login-prompt">
              <User size={20} />
              <span>
                <Link to="/login" className="blog-link">Sign in</Link> to leave a comment
              </span>
            </div>
          )}

          {/* Comment list */}
          <div className="blog-comment-list">
            {comments.length === 0 ? (
              <div className="blog-comment-empty">
                <MessageSquare size={36} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                <p>No comments yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              comments.map(c => (
                <div key={c.id} className="blog-comment-item" id={`comment-${c.id}`}>
                  <div className="blog-avatar small">{(c.author_name || 'A')[0].toUpperCase()}</div>
                  <div className="blog-comment-body">
                    <div className="blog-comment-top">
                      <span className="blog-comment-author">{c.author_name}</span>
                      <span className="blog-comment-date">
                        {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {user?.role === 'admin' && (
                        <button
                          className="blog-comment-delete"
                          onClick={() => handleDeleteComment(c.id)}
                          title="Delete comment"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <p className="blog-comment-text">{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default BlogDetail;
