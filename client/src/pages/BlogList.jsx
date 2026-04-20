import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import axios from 'axios';
import {
  Search, Clock, MessageSquare, ArrowRight, BookOpen,
  TrendingUp, Zap, X, Tag,
} from 'lucide-react';

/* ─── Animation variants ──────────────────────────────────────────────────── */
const ease = [0.16, 1, 0.3, 1];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

const fadeScale = {
  hidden: { opacity: 0, scale: 0.94, y: 20 },
  show:   { opacity: 1, scale: 1,    y: 0,  transition: { duration: 0.5, ease } },
};

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
const Skeleton = () => (
  <div className="blog-sk-card">
    <div className="blog-sk-img" />
    <div className="blog-sk-body">
      <div className="blog-sk-line w-1/3" />
      <div className="blog-sk-line w-full" />
      <div className="blog-sk-line w-2/3" />
    </div>
  </div>
);

/* ─── Category badge color map ───────────────────────────────────────────── */
const CAT_COLORS = {
  'Market Analysis':     '#3b82f6',
  'Trading Psychology':  '#8b5cf6',
  'Futures':             '#10b981',
  'Risk Management':     '#ef4444',
  'Strategy':            '#f59e0b',
  'Macroeconomics':      '#06b6d4',
  'General':             '#6b7280',
};
const catColor = (cat) => CAT_COLORS[cat] || '#2563eb';

/* ─── Post Card ──────────────────────────────────────────────────────────── */
const PostCard = ({ post }) => (
  <motion.div variants={fadeScale} layout className="blog-card" id={`post-card-${post.id}`}>
    <Link to={`/blog/${post.id}`} className="blog-card-inner">
      {/* Image */}
      <div className="blog-card-img-box">
        {post.image_url
          ? <img src={`http://localhost:5000${post.image_url}`} alt={post.title} className="blog-card-img" loading="lazy" />
          : <div className="blog-card-img-empty"><BookOpen size={32} /></div>
        }
        <div className="blog-card-img-sheen" />
        {post.category && (
          <span className="blog-card-cat" style={{ '--cat-color': catColor(post.category) }}>
            {post.category}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="blog-card-body">
        <h3 className="blog-card-title">{post.title}</h3>
        {post.excerpt && <p className="blog-card-excerpt">{post.excerpt}</p>}

        <div className="blog-card-footer">
          <div className="blog-card-author">
            <div className="blog-card-avatar">{(post.author_name || 'A')[0]}</div>
            <span>{post.author_name}</span>
          </div>
          <div className="blog-card-meta">
            {post.read_time && <span><Clock size={11} />{post.read_time}</span>}
            {post.comment_count > 0 && <span><MessageSquare size={11} />{post.comment_count}</span>}
          </div>
        </div>

        <div className="blog-card-cta">
          Read more <ArrowRight size={13} />
        </div>
      </div>
    </Link>
  </motion.div>
);

/* ─── Hero (full-bleed featured post) ───────────────────────────────────── */
const Hero = ({ post }) => {
  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const yImg = useTransform(scrollY, [0, 500], [0, 80]);

  if (!post) return null;

  return (
    <Link to={`/blog/${post.id}`} className="blog-hero" id={`post-featured-${post.id}`} ref={heroRef}>
      {/* Parallax image */}
      <motion.div className="blog-hero-img-wrap" style={{ y: yImg }}>
        {post.image_url
          ? <img src={`http://localhost:5000${post.image_url}`} alt={post.title} className="blog-hero-img" />
          : <div className="blog-hero-img-fallback" />
        }
      </motion.div>

      {/* Gradient overlays */}
      <div className="blog-hero-overlay-t" />
      <div className="blog-hero-overlay-b" />
      <div className="blog-hero-noise" />

      {/* Content */}
      <motion.div
        className="blog-hero-content container"
        initial="hidden"
        animate="show"
        variants={stagger}
      >
        {/* Badges */}
        <motion.div variants={fadeUp} className="blog-hero-badges">
          <span className="blog-hero-badge-featured"><Zap size={11} /> Featured</span>
          {post.category && (
            <span className="blog-hero-badge-cat" style={{ '--cat-color': catColor(post.category) }}>
              <Tag size={11} /> {post.category}
            </span>
          )}
        </motion.div>

        {/* Title */}
        <motion.h1 variants={fadeUp} className="blog-hero-title">
          {post.title}
        </motion.h1>

        {/* Excerpt */}
        {post.excerpt && (
          <motion.p variants={fadeUp} className="blog-hero-excerpt">
            {post.excerpt.length > 160 ? post.excerpt.slice(0, 160) + '…' : post.excerpt}
          </motion.p>
        )}

        {/* Meta + CTA */}
        <motion.div variants={fadeUp} className="blog-hero-bottom">
          <div className="blog-hero-author">
            <div className="blog-hero-avatar">{(post.author_name || 'A')[0]}</div>
            <div>
              <div className="blog-hero-author-name">{post.author_name}</div>
              <div className="blog-hero-author-date">
                {new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
          <div className="blog-hero-actions">
            {post.read_time && (
              <span className="blog-hero-read-time"><Clock size={13} /> {post.read_time}</span>
            )}
            <span className="blog-hero-cta">Read Article <ArrowRight size={14} /></span>
          </div>
        </motion.div>
      </motion.div>
    </Link>
  );
};

/* ═════════════════════════════════════════════════════════════════════════ */
/* Main Page                                                                  */
/* ═════════════════════════════════════════════════════════════════════════ */
const BlogList = () => {
  const [posts, setPosts]           = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [active, setActive]         = useState('All');

  useEffect(() => {
    Promise.all([
      axios.get('http://localhost:5000/api/posts'),
      axios.get('http://localhost:5000/api/categories'),
    ]).then(([pr, cr]) => {
      setPosts(pr.data);
      setCategories([{ id: 'all', name: 'All' }, ...(cr.data || [])]);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = posts.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !search
      || p.title?.toLowerCase().includes(q)
      || p.excerpt?.toLowerCase().includes(q)
      || p.author_name?.toLowerCase().includes(q);
    const matchC = active === 'All' || p.category === active;
    return matchQ && matchC;
  });

  const showHero = !search && active === 'All' && filtered.length > 0;
  const featured = showHero ? filtered[0] : null;
  const gridPosts = showHero ? filtered.slice(1) : filtered;

  const clearAll = useCallback(() => { setSearch(''); setActive('All'); }, []);

  return (
    <div className="blog-page-v2">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {!loading && featured && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Hero post={featured} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BELOW HERO CONTENT ──────────────────────────────────────────── */}
      <div className="blog-below-hero">
        <div className="container">

          {/* Search + Filter bar */}
          <motion.div
            className="blog-filter-bar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.55, ease }}
          >
            {/* Search input */}
            <div className="blog-search-box">
              <Search size={16} className="blog-search-icon-v2" />
              <input
                id="blog-search"
                type="text"
                className="blog-search-v2"
                placeholder="Search articles…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <AnimatePresence>
                {search && (
                  <motion.button
                    className="blog-search-x"
                    onClick={() => setSearch('')}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.18 }}
                  >
                    <X size={13} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Category pills */}
            <div className="blog-pills">
              {categories.map((cat, i) => (
                <motion.button
                  key={cat.id}
                  className={`blog-pill${active === cat.name ? ' active' : ''}`}
                  onClick={() => setActive(cat.name)}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 + i * 0.035, duration: 0.3, ease }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {cat.name}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* "Latest Posts" label */}
          {!loading && gridPosts.length > 0 && (
            <motion.div
              className="blog-section-header"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              <TrendingUp size={15} />
              <span>{search || active !== 'All' ? 'Results' : 'Latest Posts'}</span>
              <span className="blog-section-count">{gridPosts.length}</span>
              <div className="blog-section-rule" />
            </motion.div>
          )}

          {/* Loading skeletons */}
          {loading && (
            <div className="blog-grid-v2">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} />)}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <motion.div
              className="blog-empty-v2"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="blog-empty-icon-v2"><BookOpen size={36} /></div>
              <h3>No posts found</h3>
              <p>{search ? `No results for "${search}"` : 'Nothing in this category yet.'}</p>
              {(search || active !== 'All') && (
                <button className="blog-empty-btn" onClick={clearAll}>
                  <X size={13} /> Clear filters
                </button>
              )}
            </motion.div>
          )}

          {/* Grid */}
          {!loading && gridPosts.length > 0 && (
            <motion.div
              className="blog-grid-v2"
              variants={stagger}
              initial="hidden"
              animate="show"
              key={`${active}-${search}`}
            >
              <AnimatePresence mode="popLayout">
                {gridPosts.map(post => <PostCard key={post.id} post={post} />)}
              </AnimatePresence>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};

export default BlogList;
