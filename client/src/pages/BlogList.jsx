import React, {
  useState, useEffect, useCallback, useRef, useMemo,
} from 'react';
import { Link, useNavigate }      from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios                       from 'axios';
import {
  Search, Clock, MessageSquare, ArrowUpRight,
  BookOpen, X, Tag, TrendingUp, ArrowRight,
} from 'lucide-react';

/* ─── Animation variants ──────────────────────────────────── */
const easing = [0.16, 1, 0.3, 1];
const fadeUp  = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: easing } },
};
const staggerGrid = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

/* ─── Skeleton ──────────────────────────────────────────────── */
const CardSkeleton = () => (
  <div className="blg-sk">
    <div className="blg-sk-img" />
    <div className="blg-sk-body">
      <div className="blg-sk-line" style={{ width: '30%' }} />
      <div className="blg-sk-line" style={{ width: '85%' }} />
      <div className="blg-sk-line" style={{ width: '65%' }} />
    </div>
  </div>
);

/* ─── Category color map ─────────────────────────────────────── */
const CAT_HUE = {
  'Market Analysis':    '213',
  'Trading Psychology': '265',
  'Futures':            '160',
  'Risk Management':    '0',
  'Strategy':           '38',
  'Macroeconomics':     '188',
  'Trading':            '225',
  'General':            '220',
};
const getCatStyle = (cat) => {
  const h = CAT_HUE[cat] ?? '213';
  return {
    background: `hsla(${h},80%,60%,0.12)`,
    color:      `hsl(${h},80%,72%)`,
    border:     `1px solid hsla(${h},80%,60%,0.22)`,
  };
};

/* ─── Highlight matching text ────────────────────────────────── */
const Highlight = ({ text = '', query = '' }) => {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="blg-highlight">{part}</mark>
          : part
      )}
    </>
  );
};

/* ─── Smart Search Bar ───────────────────────────────────────── */
const SmartSearch = ({ posts, onSearch, searchQuery }) => {
  const navigate   = useNavigate();
  const [input, setInput]     = useState(searchQuery);
  const [open, setOpen]       = useState(false);
  const [cursor, setCursor]   = useState(-1);   // keyboard selected index
  const wrapRef   = useRef(null);
  const inputRef  = useRef(null);
  const debounceRef = useRef(null);

  // Sync external clear (via category change or "clear all")
  useEffect(() => { setInput(searchQuery); }, [searchQuery]);

  // Debounce — push to parent after 180ms idle
  const handleChange = (e) => {
    const val = e.target.value;
    setInput(val);
    setCursor(-1);
    setOpen(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(val), 180);
  };

  // Live dropdown suggestions — up to 6 results
  const suggestions = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q) return [];
    return posts
      .filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q) ||
        p.author_name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [input, posts]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) {
      if (e.key === 'Escape') { setInput(''); onSearch(''); setOpen(false); }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor(c => Math.min(c + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor(c => Math.max(c - 1, -1));
    } else if (e.key === 'Enter') {
      if (cursor >= 0 && suggestions[cursor]) {
        navigate(`/blog/${suggestions[cursor].id}`);
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const clearInput = () => {
    setInput('');
    onSearch('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const showDrop = open && input.trim().length > 0;

  return (
    <div className="blg-search-wrap" ref={wrapRef} role="combobox" aria-expanded={showDrop}>
      {/* Search icon */}
      <Search size={16} className="blg-search-ico" aria-hidden />

      {/* Input */}
      <input
        ref={inputRef}
        id="blog-search"
        type="text"
        role="searchbox"
        autoComplete="off"
        className={`blg-search${showDrop ? ' blg-search--open' : ''}`}
        placeholder="Search articles, topics, authors…"
        value={input}
        onChange={handleChange}
        onFocus={() => input.trim() && setOpen(true)}
        onKeyDown={handleKeyDown}
        aria-label="Search blog posts"
        aria-autocomplete="list"
      />

      {/* Trending icon (when empty) */}
      <AnimatePresence mode="wait">
        {!input && (
          <motion.span
            className="blg-search-trend"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <TrendingUp size={13} />
          </motion.span>
        )}
      </AnimatePresence>

      {/* Clear button */}
      <AnimatePresence>
        {input && (
          <motion.button
            className="blg-search-clear"
            onClick={clearInput}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
            aria-label="Clear search"
            type="button"
          >
            <X size={12} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Dropdown ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showDrop && (
          <motion.div
            className="blg-dropdown"
            role="listbox"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: easing }}
          >
            {suggestions.length === 0 ? (
              /* No results */
              <div className="blg-drop-empty">
                <BookOpen size={20} />
                <span>No results for <strong>"{input}"</strong></span>
              </div>
            ) : (
              <>
                {/* Result count header */}
                <div className="blg-drop-header">
                  {suggestions.length} result{suggestions.length !== 1 ? 's' : ''} for
                  <span className="blg-drop-query"> "{input}"</span>
                </div>

                {/* Suggestion rows */}
                {suggestions.map((post, i) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.id}`}
                    className={`blg-drop-item${cursor === i ? ' is-active' : ''}`}
                    role="option"
                    aria-selected={cursor === i}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setCursor(i)}
                  >
                    {/* Tiny thumbnail */}
                    <div className="blg-drop-thumb">
                      {post.image_url
                        ? <img src={`http://localhost:5000${post.image_url}`} alt="" />
                        : <BookOpen size={14} />
                      }
                    </div>

                    {/* Text */}
                    <div className="blg-drop-text">
                      <span className="blg-drop-title">
                        <Highlight text={post.title} query={input} />
                      </span>
                      <div className="blg-drop-meta">
                        {post.category && (
                          <span className="blg-drop-cat" style={getCatStyle(post.category)}>
                            <Tag size={8} /> {post.category}
                          </span>
                        )}
                        {post.read_time && (
                          <span className="blg-drop-time">
                            <Clock size={10} /> {post.read_time}
                          </span>
                        )}
                        {post.author_name && (
                          <span className="blg-drop-author">by {post.author_name}</span>
                        )}
                      </div>
                    </div>

                    <ArrowRight size={13} className="blg-drop-arrow" />
                  </Link>
                ))}

                {/* "View all results" footer */}
                <button
                  className="blg-drop-footer"
                  onMouseDown={(e) => { e.preventDefault(); setOpen(false); }}
                  type="button"
                >
                  <Search size={12} />
                  View all results for <strong>"{input}"</strong>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Post Card ─────────────────────────────────────────────── */
const PostCard = ({ post, featured = false }) => (
  <motion.article
    variants={fadeUp}
    layout
    className={`blg-card${featured ? ' blg-card--featured' : ''}`}
    id={`post-card-${post.id}`}
  >
    <Link to={`/blog/${post.id}`} className="blg-card-link">
      <div className="blg-card-thumb">
        {post.image_url
          ? <img src={`http://localhost:5000${post.image_url}`} alt={post.title} loading="lazy" className="blg-card-thumb-img" />
          : <div className="blg-card-thumb-empty"><BookOpen size={28} /></div>
        }
        {featured && <span className="blg-featured-label">Featured</span>}
      </div>
      <div className="blg-card-text">
        {post.category && (
          <span className="blg-cat-badge" style={getCatStyle(post.category)}>
            <Tag size={9} /> {post.category}
          </span>
        )}
        <h2 className="blg-card-title">{post.title}</h2>
        {post.excerpt && (
          <p className="blg-card-excerpt">
            {featured && post.excerpt.length > 200
              ? post.excerpt.slice(0, 200) + '…'
              : post.excerpt.length > 120
              ? post.excerpt.slice(0, 120) + '…'
              : post.excerpt}
          </p>
        )}
        <div className="blg-card-meta">
          <div className="blg-card-author">
            <span className="blg-card-avatar">{(post.author_name || 'A')[0]}</span>
            <span>{post.author_name}</span>
            <span className="blg-card-dot">·</span>
            <span>
              {new Date(post.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </span>
          </div>
          <div className="blg-card-stats">
            {post.read_time && <span><Clock size={11} /> {post.read_time}</span>}
            {post.comment_count > 0 && <span><MessageSquare size={11} /> {post.comment_count}</span>}
          </div>
        </div>
      </div>
      <div className="blg-card-arrow"><ArrowUpRight size={16} /></div>
    </Link>
  </motion.article>
);

/* ═══════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════ */
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
      || p.author_name?.toLowerCase().includes(q)
      || p.category?.toLowerCase().includes(q);
    const matchC = active === 'All' || p.category === active;
    return matchQ && matchC;
  });

  const isDefault = !search && active === 'All';
  const featured  = isDefault && filtered.length > 0 ? filtered[0] : null;
  const gridPosts = featured ? filtered.slice(1) : filtered;
  const clearAll  = useCallback(() => { setSearch(''); setActive('All'); }, []);

  return (
    <div className="blg-page">
      <div className="container">

        {/* ── PAGE HEADER ──────────────────────────────────────── */}
        <motion.header
          className="blg-header"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.div variants={fadeUp} className="blg-eyebrow">Blog</motion.div>
          <motion.h1 variants={fadeUp} className="blg-page-title">
            Market Intelligence
          </motion.h1>
          <motion.p variants={fadeUp} className="blg-page-sub">
            Trade setups, macro analysis, psychology breakdowns,<br className="blg-br" />
            and strategy — written by expert traders.
          </motion.p>

          {/* Smart Search */}
          <motion.div variants={fadeUp} style={{ width: '100%', maxWidth: '480px' }}>
            <SmartSearch
              posts={posts}
              onSearch={setSearch}
              searchQuery={search}
            />
          </motion.div>

          {/* Category pills */}
          <motion.div variants={fadeUp} className="blg-pills">
            {categories.map((cat, i) => (
              <motion.button
                key={cat.id}
                className={`blg-pill${active === cat.name ? ' is-active' : ''}`}
                onClick={() => { setActive(cat.name); setSearch(''); }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + i * 0.03, duration: 0.28 }}
                whileTap={{ scale: 0.94 }}
              >
                {cat.name}
              </motion.button>
            ))}
          </motion.div>
        </motion.header>

        <div className="blg-divider" />

        {/* Loading */}
        {loading && (
          <div className="blg-grid">
            {[1,2,3,4,5,6].map(i => <CardSkeleton key={i} />)}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <motion.div
            className="blg-empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <BookOpen size={32} />
            <h3>No posts found</h3>
            <p>{search ? `No results for "${search}"` : 'Nothing in this category yet.'}</p>
            {(search || active !== 'All') && (
              <button className="blg-empty-btn" onClick={clearAll}>Clear filters</button>
            )}
          </motion.div>
        )}

        {/* Content */}
        {!loading && filtered.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${active}-${search}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {featured && (
                <motion.div variants={staggerGrid} initial="hidden" animate="show" className="blg-featured-wrap">
                  <PostCard post={featured} featured />
                </motion.div>
              )}

              {gridPosts.length > 0 && (
                <motion.div
                  className="blg-section-label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <span>{featured ? 'Latest Posts' : (search || active !== 'All') ? 'Results' : 'All Posts'}</span>
                  <span className="blg-section-ct">{gridPosts.length}</span>
                </motion.div>
              )}

              {gridPosts.length > 0 && (
                <motion.div className="blg-grid" variants={staggerGrid} initial="hidden" animate="show">
                  <AnimatePresence mode="popLayout">
                    {gridPosts.map(post => <PostCard key={post.id} post={post} />)}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        <div style={{ height: '6rem' }} />
      </div>
    </div>
  );
};

export default BlogList;
