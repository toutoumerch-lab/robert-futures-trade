import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Search, Clock, MessageSquare, ArrowRight, BookOpen,
  TrendingUp, Zap, Flame, BarChart2, X,
} from 'lucide-react';

// ── Animation variants ────────────────────────────────────────────────────────
const heroVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -12,
    transition: { duration: 0.25 },
  },
};

const pillVariants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  }),
};

// ── Skeleton card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bl-skeleton-card">
    <div className="bl-skeleton-img" />
    <div className="bl-skeleton-body">
      <div className="bl-skeleton-line bl-sk-short" />
      <div className="bl-skeleton-line" />
      <div className="bl-skeleton-line bl-sk-med" />
      <div className="bl-skeleton-line bl-sk-short" style={{ marginTop: '0.5rem' }} />
    </div>
  </div>
);

// ── Post card ────────────────────────────────────────────────────────────────
const PostCard = ({ post, index }) => (
  <motion.div
    variants={cardVariants}
    layout
    className="bl-card"
    id={`post-card-${post.id}`}
  >
    <Link to={`/blog/${post.id}`} className="bl-card-link">
      {/* Image */}
      <div className="bl-card-img-wrap">
        {post.image_url ? (
          <img
            src={`http://localhost:5000${post.image_url}`}
            alt={post.title}
            className="bl-card-img"
            loading="lazy"
          />
        ) : (
          <div className="bl-card-img-placeholder">
            <BookOpen size={36} />
          </div>
        )}
        {/* Overlay gradient */}
        <div className="bl-card-img-overlay" />
        {/* Category badge */}
        {post.category && (
          <span className="bl-card-cat-badge">{post.category}</span>
        )}
      </div>

      {/* Body */}
      <div className="bl-card-body">
        <h3 className="bl-card-title">{post.title}</h3>
        {post.excerpt && (
          <p className="bl-card-excerpt">{post.excerpt}</p>
        )}

        {/* Meta row */}
        <div className="bl-card-meta">
          <div className="bl-author-chip">
            <div className="bl-avatar">
              {(post.author_name || 'A')[0].toUpperCase()}
            </div>
            <span className="bl-author-name">{post.author_name}</span>
          </div>
          <div className="bl-card-meta-right">
            <Clock size={12} />
            <span>{post.read_time || '3 min read'}</span>
            {post.comment_count > 0 && (
              <>
                <span className="bl-dot">·</span>
                <MessageSquare size={12} />
                <span>{post.comment_count}</span>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bl-card-footer">
          <span className="bl-date">
            {new Date(post.created_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </span>
          <span className="bl-read-cta">
            Read more <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  </motion.div>
);

// ── Featured card ─────────────────────────────────────────────────────────────
const FeaturedCard = ({ post }) => (
  <motion.div
    variants={cardVariants}
    className="bl-featured"
    id={`post-featured-${post.id}`}
  >
    <Link to={`/blog/${post.id}`} className="bl-featured-link">
      {/* Image side */}
      <div className="bl-featured-img-wrap">
        {post.image_url ? (
          <img
            src={`http://localhost:5000${post.image_url}`}
            alt={post.title}
            className="bl-featured-img"
          />
        ) : (
          <div className="bl-featured-img-placeholder">
            <BookOpen size={56} />
          </div>
        )}
        <div className="bl-featured-img-overlay" />
      </div>

      {/* Content side */}
      <div className="bl-featured-content">
        <div className="bl-featured-badges">
          <span className="bl-badge bl-badge-featured">
            <Zap size={11} /> Featured
          </span>
          {post.category && (
            <span className="bl-badge bl-badge-cat">{post.category}</span>
          )}
        </div>
        <h2 className="bl-featured-title">{post.title}</h2>
        {post.excerpt && (
          <p className="bl-featured-excerpt">
            {post.excerpt.length > 180 ? post.excerpt.slice(0, 180) + '…' : post.excerpt}
          </p>
        )}
        <div className="bl-featured-meta">
          <div className="bl-author-chip">
            <div className="bl-avatar bl-avatar-lg">
              {(post.author_name || 'A')[0].toUpperCase()}
            </div>
            <div>
              <div className="bl-author-name">{post.author_name}</div>
              <div className="bl-author-sub">
                {new Date(post.created_at).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </div>
            </div>
          </div>
          <div className="bl-featured-stats">
            <span><Clock size={13} /> {post.read_time || '3 min read'}</span>
            {post.comment_count > 0 && (
              <span><MessageSquare size={13} /> {post.comment_count}</span>
            )}
          </div>
        </div>
        <div className="bl-featured-cta">
          Read Article <ArrowRight size={15} />
        </div>
      </div>
    </Link>
  </motion.div>
);

// ═════════════════════════════════════════════════════════════════════════════
// Main Page
// ═════════════════════════════════════════════════════════════════════════════
const BlogList = () => {
  const [posts, setPosts]            = useState([]);
  const [categories, setCategories]  = useState([]);
  const [loading, setLoading]        = useState(true);
  const [search, setSearch]          = useState('');
  const [activeCategory, setActive]  = useState('All');

  useEffect(() => {
    Promise.all([
      axios.get('http://localhost:5000/api/posts'),
      axios.get('http://localhost:5000/api/categories'),
    ]).then(([postsRes, catsRes]) => {
      setPosts(postsRes.data);
      setCategories([{ id: 'all', name: 'All' }, ...catsRes.data]);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = posts.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || p.title.toLowerCase().includes(q)
      || (p.excerpt && p.excerpt.toLowerCase().includes(q))
      || (p.author_name && p.author_name.toLowerCase().includes(q));
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  const featured = (!search && activeCategory === 'All') ? filtered[0] : null;
  const gridPosts = featured ? filtered.slice(1) : filtered;

  const clearFilters = useCallback(() => { setSearch(''); setActive('All'); }, []);

  return (
    <div className="bl-page">

      {/* ── Ambient glow orbs ──────────────────────────────────────────────── */}
      <div className="bl-orb bl-orb-1" aria-hidden />
      <div className="bl-orb bl-orb-2" aria-hidden />
      <div className="bl-orb bl-orb-3" aria-hidden />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <motion.section
        className="bl-hero"
        initial="hidden"
        animate="visible"
        variants={heroVariants}
      >
        <div className="container">
          <div className="bl-hero-inner">
            {/* Eyebrow */}
            <motion.div
              className="bl-eyebrow"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <TrendingUp size={13} />
              <span>Market Intelligence Hub</span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              className="bl-hero-title"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              Daily{' '}
              <span className="bl-hero-gradient">Market Insights</span>
            </motion.h1>

            <motion.p
              className="bl-hero-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.6 }}
            >
              Trade setups, psychology breakdowns, macro analysis, and community
              discussions — updated daily by expert traders.
            </motion.p>

            {/* Search */}
            <motion.div
              className="bl-search-wrap"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.45, duration: 0.55 }}
            >
              <Search size={17} className="bl-search-icon" />
              <input
                id="blog-search"
                className="bl-search-input"
                type="text"
                placeholder="Search posts, topics, authors…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <AnimatePresence>
                {search && (
                  <motion.button
                    className="bl-search-clear"
                    onClick={() => setSearch('')}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.2 }}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Stats strip */}
            <motion.div
              className="bl-hero-stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <span><Flame size={13} /> {posts.length} Articles</span>
              <span className="bl-dot">·</span>
              <span><BarChart2 size={13} /> {categories.length - 1} Categories</span>
              <span className="bl-dot">·</span>
              <span><TrendingUp size={13} /> Updated Daily</span>
            </motion.div>
          </div>
        </div>

        {/* Hero bottom blur edge */}
        <div className="bl-hero-edge" aria-hidden />
      </motion.section>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <div className="container bl-main">

        {/* ── Category pills ─────────────────────────────────────────────── */}
        <motion.div
          className="bl-cats"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {categories.map((cat, i) => (
            <motion.button
              key={cat.id}
              custom={i}
              variants={pillVariants}
              className={`bl-cat-pill ${activeCategory === cat.name ? 'active' : ''}`}
              id={`cat-${cat.name.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => setActive(cat.name)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
            >
              {cat.name}
              {activeCategory === cat.name && cat.name !== 'All' && (
                <motion.span
                  className="bl-cat-count"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {filtered.length}
                </motion.span>
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* ── Loading skeletons ───────────────────────────────────────────── */}
        {loading && (
          <div className="bl-skeleton-grid">
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* ── Empty state ─────────────────────────────────────────────────── */}
        {!loading && filtered.length === 0 && (
          <motion.div
            className="bl-empty"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="bl-empty-icon">
              <BookOpen size={40} />
            </div>
            <h3 className="bl-empty-title">No posts found</h3>
            <p className="bl-empty-sub">
              {search ? `No results for "${search}"` : 'No posts in this category yet.'}
            </p>
            {(search || activeCategory !== 'All') && (
              <motion.button
                className="bl-clear-btn"
                onClick={clearFilters}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <X size={14} /> Clear filters
              </motion.button>
            )}
          </motion.div>
        )}

        {!loading && filtered.length > 0 && (
          <motion.div initial="hidden" animate="visible" variants={containerVariants}>

            {/* ── Featured post ──────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
              {featured && (
                <FeaturedCard key={featured.id} post={featured} />
              )}
            </AnimatePresence>

            {/* ── Grid ──────────────────────────────────────────────────── */}
            {gridPosts.length > 0 && (
              <>
                {featured && (
                  <div className="bl-section-label">
                    <span>Latest Posts</span>
                    <div className="bl-section-line" />
                  </div>
                )}
                <motion.div className="bl-grid" layout>
                  <AnimatePresence mode="popLayout">
                    {gridPosts.map((post, i) => (
                      <PostCard key={post.id} post={post} index={i} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BlogList;
