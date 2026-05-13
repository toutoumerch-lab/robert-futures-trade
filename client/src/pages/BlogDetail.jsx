import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SEO from '../components/common/SEO';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, ThumbsUp, Flame, Lightbulb, MessageSquare,
  Clock, Calendar, Trash2, BookOpen, Send, User
} from 'lucide-react';

// Normalize image URLs to work in both dev and production.
// Production: VITE_API_URL is empty → relative URLs (/api/uploads/...) work via nginx proxy.
// Old posts stored /uploads/... → rewrite to /api/uploads/... so nginx can serve them.
const API = import.meta.env.VITE_API_URL || '';
const imgUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const normalized = url.startsWith('/uploads/') ? `/api${url}` : url;
  return `${API}${normalized}`;
};

const REACTIONS = [
  { type: 'like',    icon: ThumbsUp,    label: 'Like',       emoji: '👍' },
  { type: 'fire',    icon: Flame,       label: 'Useful',     emoji: '🔥' },
  { type: 'insight', icon: Lightbulb,   label: 'Insightful', emoji: '💡' },
];

/* ─────────────────────────────────────────────────────────────────
   Quill HTML cleaner — eliminates mid-word line breaks.

   Root causes addressed:
   A) Adjacent same-tag inline elements:  <em>wer</em><em>e</em>
   B) Whitespace-only text nodes between elements: <em>wer</em>\n<em>e</em>
      (the \n collapses to a space under white-space:normal → false word break)
   C) Transient Quill classes (ql-cursor, ql-ui) preventing merge
   D) Bare <span> with no style/class — structural noise, unwrap
   E) Empty inline elements — dead nodes, remove
   F) <br> tags between word-character content — copy-paste artifacts that
      split words across lines (e.g. "orde<br>rs" → "orders").
      Preserved: <br> that is the sole child (empty paragraph), or inside
      pre/code blocks (intentional whitespace-sensitive content).

   All merging skips whitespace-only text nodes between siblings so
   <em>wer</em>   <em>e</em> merges to <em>were</em>.
───────────────────────────────────────────────────────────────── */
const INLINE_TAGS = new Set(['SPAN', 'STRONG', 'EM', 'B', 'I', 'U', 'S']);
// Quill-internal transient classes — ignore when comparing for merge eligibility
const QUILL_TRANSIENT = /\b(ql-cursor|ql-ui)\b/g;

const _normClass = (cls) =>
  (cls || '').replace(QUILL_TRANSIENT, '').replace(/\s+/g, ' ').trim();

// Returns true if this is a whitespace-only text node
const _isBlank = (n) => n.nodeType === 3 && /^\s*$/.test(n.nodeValue);

const _wordChar = /\w/;

// Returns true if the node is a descendant of PRE or CODE (whitespace-sensitive)
const _inCode = (n) => {
  let p = n.parentElement;
  while (p) {
    if (p.tagName === 'PRE' || p.tagName === 'CODE') return true;
    p = p.parentElement;
  }
  return false;
};

// Get the raw last character of a node's text (including whitespace)
const _rawLastChar = (n) => {
  if (!n) return '';
  const t = n.nodeType === 3 ? n.textContent : (n.nodeType === 1 ? n.textContent : '');
  return t.length ? t[t.length - 1] : '';
};

// Get the raw first character of a node's text (including whitespace)
const _rawFirstChar = (n) => {
  if (!n) return '';
  const t = n.nodeType === 3 ? n.textContent : (n.nodeType === 1 ? n.textContent : '');
  return t.length ? t[0] : '';
};

// Walk up the inline-element chain to find the nearest prev/next sibling outside
// the current inline ancestor (stops at block elements).
const _prevAnchorSibling = (node) => {
  let anc = node;
  while (anc && INLINE_TAGS.has(anc.tagName)) {
    if (anc.previousSibling) return anc.previousSibling;
    anc = anc.parentElement;
  }
  return null;
};
const _nextAnchorSibling = (node) => {
  let anc = node;
  while (anc && INLINE_TAGS.has(anc.tagName)) {
    if (anc.nextSibling) return anc.nextSibling;
    anc = anc.parentElement;
  }
  return null;
};

function _clean(node) {
  let child = node.firstChild;
  while (child) {
    const next = child.nextSibling;

    if (child.nodeType !== 1) { child = next; continue; }

    _clean(child); // depth-first

    const tag = child.tagName;

    // (F) Remove <br> tags that split words — copy-paste artifacts.
    //
    //     Handles ALL cases:
    //       1. Direct text siblings: "orde"<br>"rs"
    //       2. <br> at end of inline: <em>"H"<br></em>"owever"
    //       3. <br> at start of inline: "H"<em><br>"owever"</em>
    //       4. Deeply nested: <strong><em>"H"<br></em></strong>"owever"
    //
    //     Rule: remove <br> when the raw character immediately before it AND
    //     the raw character immediately after it are BOTH word characters with
    //     NO whitespace on either side. This reliably targets mid-word breaks
    //     without affecting intentional Shift+Enter line breaks (which have
    //     complete words/sentences on both sides with natural spacing).
    //
    //     Preserved: sole <br> child of a block (empty paragraph), <br> inside
    //     pre/code blocks.
    if (tag === 'BR') {
      if (!_inCode(child) && node.childNodes.length > 1) {
        // Find prev/next content, looking outside inline element boundaries if needed
        const prevSib = child.previousSibling ?? _prevAnchorSibling(node);
        const nxtSib  = child.nextSibling  ?? _nextAnchorSibling(node);

        const pLast  = _rawLastChar(prevSib);
        const nFirst = _rawFirstChar(nxtSib);

        // Remove only when both adjacent chars are word characters with no whitespace
        if (pLast && nFirst &&
            !/\s/.test(pLast)  && _wordChar.test(pLast) &&
            !/\s/.test(nFirst) && _wordChar.test(nFirst)) {
          node.removeChild(child);
          child = next;
          continue;
        }
      }
      child = next;
      continue;
    }

    // (E) Remove empty inline elements
    if (INLINE_TAGS.has(tag) && !child.hasChildNodes()) {
      node.removeChild(child);
      child = next;
      continue;
    }

    // (D) Unwrap <span> with no meaningful style or class
    if (tag === 'SPAN' && !child.getAttribute('style') && !_normClass(child.getAttribute('class'))) {
      const frag = document.createDocumentFragment();
      while (child.firstChild) frag.appendChild(child.firstChild);
      node.replaceChild(frag, child);
      child = next;
      continue;
    }

    if (!INLINE_TAGS.has(tag)) { child = next; continue; }

    // (A+B+C) Merge adjacent same-tag inline elements, skipping blank text nodes
    const styleA = (child.getAttribute('style') || '').trim();
    const classA = _normClass(child.getAttribute('class'));

    let peek = child.nextSibling;
    while (peek && _isBlank(peek)) peek = peek.nextSibling; // skip blank text nodes

    while (
      peek && peek.nodeType === 1 &&
      peek.tagName === tag &&
      (peek.getAttribute('style') || '').trim() === styleA &&
      _normClass(peek.getAttribute('class')) === classA
    ) {
      // Remove any blank text nodes sitting between child and peek
      let between = child.nextSibling;
      while (between && between !== peek) {
        const tmp = between.nextSibling;
        if (_isBlank(between)) node.removeChild(between);
        between = tmp;
      }
      // Absorb peek's children into child
      const afterPeek = peek.nextSibling;
      while (peek.firstChild) child.appendChild(peek.firstChild);
      node.removeChild(peek);
      // Advance peek past blanks to try another merge
      peek = afterPeek;
      while (peek && _isBlank(peek)) peek = peek.nextSibling;
    }

    child = next;
  }
}

const cleanQuillHtml = (html) => {
  if (!html) return '';
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    // Log raw HTML once so devtools can confirm what Quill actually saved
    if (import.meta.env.DEV) {
      console.log('[BlogDetail] raw content (first 800 chars):\n', html.slice(0, 800));
    }
    _clean(doc.body);
    return doc.body.innerHTML;
  } catch {
    return html;
  }
};

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
          image: imgUrl(post.image_url) || undefined,
        }}
      />
      {/* ── Reading progress bar ─────────────────────────────────────────── */}
      <div className="reading-progress-bar" style={{ width: `${scrollPct}%` }} />

      {/* ── Cover image ──────────────────────────────────────────────────── */}
      {post.image_url && (
        <div className="blog-detail-cover">
          <img
            src={imgUrl(post.image_url)}
            alt={post.title}
            className="blog-detail-cover-img"
          />
          <div className="blog-detail-cover-overlay" />
        </div>
      )}

      <div className="blog-detail-wrap">
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
          <div 
            className="blog-prose"
            dangerouslySetInnerHTML={{ __html: cleanQuillHtml(post.content) }}
          />

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
