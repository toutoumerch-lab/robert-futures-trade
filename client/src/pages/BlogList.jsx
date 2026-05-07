import React, {
  useState, useEffect, useCallback, useRef, useMemo,
} from 'react';
import SEO from '../components/common/SEO';
import { Link, useNavigate }      from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios                       from 'axios';
import {
  Search, Clock, MessageSquare, ArrowUpRight,
  BookOpen, X, Tag, TrendingUp, ArrowRight,
  LayoutGrid, List, ChevronLeft, ChevronRight,
} from 'lucide-react';

const POSTS_PER_PAGE = 6;

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
const CardSkeleton = ({ list = false }) => (
  <div className="blg-sk" style={list ? { display: 'flex', flexDirection: 'row', height: '140px' } : {}}>
    <div className="blg-sk-img" style={list ? { width: '220px', minWidth: '220px', height: '100%' } : {}} />
    <div className="blg-sk-body" style={{ flex: 1 }}>
      <div className="blg-sk-line" style={{ width: '30%' }} />
      <div className="blg-sk-line" style={{ width: '85%' }} />
      <div className="blg-sk-line" style={{ width: '65%' }} />
    </div>
  </div>
);

/* ─── Category colour map ─────────────────────────────────── */
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
  const navigate    = useNavigate();
  const [input, setInput]     = useState(searchQuery);
  const [open, setOpen]       = useState(false);
  const [cursor, setCursor]   = useState(-1);
  const wrapRef     = useRef(null);
  const inputRef    = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { setInput(searchQuery); }, [searchQuery]);

  const handleChange = (e) => {
    const val = e.target.value;
    setInput(val);
    setCursor(-1);
    setOpen(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(val), 180);
  };

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

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) {
      if (e.key === 'Escape') { setInput(''); onSearch(''); setOpen(false); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, -1)); }
    else if (e.key === 'Enter') { if (cursor >= 0 && suggestions[cursor]) { navigate(`/blog/${suggestions[cursor].id}`); setOpen(false); } }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  const clearInput = () => { setInput(''); onSearch(''); setOpen(false); inputRef.current?.focus(); };
  const showDrop = open && input.trim().length > 0;

  return (
    <div className="blg-search-wrap" ref={wrapRef} role="combobox" aria-expanded={showDrop}>
      <Search size={16} className="blg-search-ico" aria-hidden />
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
      <AnimatePresence mode="wait">
        {!input && (
          <motion.span className="blg-search-trend" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <TrendingUp size={13} />
          </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {input && (
          <motion.button className="blg-search-clear" onClick={clearInput} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }} aria-label="Clear search" type="button">
            <X size={12} />
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showDrop && (
          <motion.div className="blg-dropdown" role="listbox" initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.18, ease: easing }}>
            {suggestions.length === 0 ? (
              <div className="blg-drop-empty"><BookOpen size={20} /><span>No results for <strong>"{input}"</strong></span></div>
            ) : (
              <>
                <div className="blg-drop-header">{suggestions.length} result{suggestions.length !== 1 ? 's' : ''} for<span className="blg-drop-query"> "{input}"</span></div>
                {suggestions.map((post, i) => (
                  <Link key={post.id} to={`/blog/${post.id}`} className={`blg-drop-item${cursor === i ? ' is-active' : ''}`} role="option" aria-selected={cursor === i} onClick={() => setOpen(false)} onMouseEnter={() => setCursor(i)}>
                    <div className="blg-drop-thumb">{post.image_url ? <img src={`${import.meta.env.VITE_API_URL}${post.image_url}`} alt="" /> : <BookOpen size={14} />}</div>
                    <div className="blg-drop-text">
                      <span className="blg-drop-title"><Highlight text={post.title} query={input} /></span>
                      <div className="blg-drop-meta">
                        {post.category && <span className="blg-drop-cat" style={getCatStyle(post.category)}><Tag size={8} /> {post.category}</span>}
                        {post.read_time && <span className="blg-drop-time"><Clock size={10} /> {post.read_time}</span>}
                        {post.author_name && <span className="blg-drop-author">by {post.author_name}</span>}
                      </div>
                    </div>
                    <ArrowRight size={13} className="blg-drop-arrow" />
                  </Link>
                ))}
                <button className="blg-drop-footer" onMouseDown={(e) => { e.preventDefault(); setOpen(false); }} type="button">
                  <Search size={12} /> View all results for <strong>"{input}"</strong>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── View toggle button ─────────────────────────────────────── */
const ViewBtn = ({ active, onClick, title, children }) => (
  <button title={title} onClick={onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', border: `1.5px solid ${active ? 'var(--accent-primary)' : 'rgba(255,255,255,0.08)'}`, background: active ? 'rgba(37,99,235,0.12)' : 'transparent', color: active ? 'var(--accent-primary)' : 'rgba(161,161,170,0.7)', cursor: 'pointer', transition: 'all 0.2s' }}>
    {children}
  </button>
);

/* ─── Pagination button ──────────────────────────────────────── */
const PageBtn = ({ active, disabled, onClick, children }) => (
  <button disabled={disabled} onClick={onClick} style={{ minWidth: '36px', height: '36px', padding: '0 10px', borderRadius: '10px', fontWeight: 800, fontSize: '0.82rem', border: `1.5px solid ${active ? 'var(--accent-primary)' : 'rgba(255,255,255,0.08)'}`, background: active ? 'linear-gradient(135deg,#1d4ed8,#2563eb)' : 'transparent', color: active ? '#fff' : disabled ? 'rgba(161,161,170,0.3)' : 'rgba(161,161,170,0.8)', cursor: disabled ? 'default' : 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
    {children}
  </button>
);

/* ─── Post Card — LIST mode ──────────────────────────────────── */
const ListCard = ({ post, isFeatured = false }) => (
  <motion.article variants={fadeUp} layout className="blg-card" id={`post-list-${post.id}`}>
    <Link to={`/blog/${post.id}`} className="blg-card-link">
      <div className="blg-card-thumb">
        {post.image_url
          ? <img src={`${import.meta.env.VITE_API_URL}${post.image_url}`} alt={post.title} loading="lazy" className="blg-card-thumb-img" />
          : <div className="blg-card-thumb-empty"><BookOpen size={24} /></div>
        }
        {isFeatured && <span className="blg-featured-label">Featured</span>}
      </div>
      <div className="blg-card-text">
        {post.category && <span className="blg-cat-badge" style={getCatStyle(post.category)}><Tag size={9} /> {post.category}</span>}
        <h2 className="blg-card-title">{post.title}</h2>
        {post.excerpt && (
          <p className="blg-card-excerpt">{post.excerpt.length > 160 ? post.excerpt.slice(0, 160) + '…' : post.excerpt}</p>
        )}
        <div className="blg-card-meta">
          <div className="blg-card-author">
            <span className="blg-card-avatar">{(post.author_name || 'A')[0]}</span>
            <span>{post.author_name}</span>
            <span className="blg-card-dot">·</span>
            <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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

/* ─── Post Card — GRID mode ──────────────────────────────────── */
const GridCard = ({ post, isFeatured = false }) => (
  <motion.article variants={fadeUp} layout className="blg-card" id={`post-card-${post.id}`}>
    <Link to={`/blog/${post.id}`} className="blg-card-link" style={{ flexDirection: 'column' }}>
      <div className="blg-card-thumb" style={{ width: '100%', height: '200px', minWidth: 'unset' }}>
        {post.image_url
          ? <img src={`${import.meta.env.VITE_API_URL}${post.image_url}`} alt={post.title} loading="lazy" className="blg-card-thumb-img" />
          : <div className="blg-card-thumb-empty"><BookOpen size={28} /></div>
        }
        {isFeatured && <span className="blg-featured-label">Featured</span>}
      </div>
      <div className="blg-card-text">
        {post.category && <span className="blg-cat-badge" style={getCatStyle(post.category)}><Tag size={9} /> {post.category}</span>}
        <h2 className="blg-card-title">{post.title}</h2>
        {post.excerpt && (
          <p className="blg-card-excerpt">{post.excerpt.length > 120 ? post.excerpt.slice(0, 120) + '…' : post.excerpt}</p>
        )}
        <div className="blg-card-meta">
          <div className="blg-card-author">
            <span className="blg-card-avatar">{(post.author_name || 'A')[0]}</span>
            <span>{post.author_name}</span>
            <span className="blg-card-dot">·</span>
            <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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
  const [posts, setPosts]             = useState([]);
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [active, setActive]           = useState('All');
  const [viewMode, setViewMode]       = useState('list');  // 'list' | 'grid'
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/api/posts`),
      axios.get(`${import.meta.env.VITE_API_URL}/api/categories`),
    ]).then(([pr, cr]) => {
      setPosts(pr.data);
      setCategories([{ id: 'all', name: 'All' }, ...(cr.data || [])]);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Reset page on any filter change
  useEffect(() => { setCurrentPage(1); }, [active, search, viewMode]);

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

  // ALL posts → pagination (no pinned featured)
  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
  const pageStart  = (currentPage - 1) * POSTS_PER_PAGE;
  const pagePosts  = filtered.slice(pageStart, pageStart + POSTS_PER_PAGE);

  const goToPage = (p) => { setCurrentPage(p); window.scrollTo({ top: 440, behavior: 'smooth' }); };

  const pageNumbers = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (currentPage > 3) pages.push('...');
    for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) pages.push(p);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  })();

  const clearAll = useCallback(() => { setSearch(''); setActive('All'); }, []);

  // First post on page 1 in default view gets the Featured badge
  const isFeaturedBadge = (idx) =>
    idx === 0 && currentPage === 1 && !search && active === 'All';

  return (
    <div className="blg-page">
      <SEO
        title="Trading Blog — Tips, Strategies & Market Insights"
        description="Read the latest futures trading articles, prop firm news, and strategy guides from Robert Trades."
        url="/blog"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'Robert Trades Blog',
          url: 'https://roberttrades.com/blog',
          description: 'Futures trading tips, strategies, and prop firm insights.',
        }}
      />
      <div className="container">

        {/* ── PAGE HEADER ──────────────────────────────────────── */}
        <motion.header className="blg-header" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}>
          <motion.div variants={fadeUp} className="blg-eyebrow">Blog</motion.div>
          <motion.h1 variants={fadeUp} className="blg-page-title">Market Intelligence</motion.h1>
          <motion.p variants={fadeUp} className="blg-page-sub">
            Trade setups, macro analysis, psychology breakdowns,<br className="blg-br" />
            and strategy — written by expert traders.
          </motion.p>

          <motion.div variants={fadeUp} style={{ width: '100%', maxWidth: '480px' }}>
            <SmartSearch posts={posts} onSearch={setSearch} searchQuery={search} />
          </motion.div>

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

        {/* ── Loading ───────────────────────────────────────────── */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1,2,3,4,5,6].map(i => <CardSkeleton key={i} list />)}
          </div>
        )}

        {/* ── Empty ─────────────────────────────────────────────── */}
        {!loading && filtered.length === 0 && (
          <motion.div className="blg-empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <BookOpen size={32} />
            <h3>No posts found</h3>
            <p>{search ? `No results for "${search}"` : 'Nothing in this category yet.'}</p>
            {(search || active !== 'All') && (
              <button className="blg-empty-btn" onClick={clearAll}>Clear filters</button>
            )}
          </motion.div>
        )}

        {/* ── Content ───────────────────────────────────────────── */}
        {!loading && filtered.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div key={`${active}-${search}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

              {/* Toolbar: count + view toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <motion.div className="blg-section-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.3 }} style={{ marginBottom: 0 }}>
                  <span>{search ? 'Results' : active !== 'All' ? active : 'All Posts'}</span>
                  <span className="blg-section-ct">{filtered.length}</span>
                </motion.div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <ViewBtn active={viewMode === 'list'} onClick={() => setViewMode('list')} title="List view"><List size={15} /></ViewBtn>
                  <ViewBtn active={viewMode === 'grid'} onClick={() => setViewMode('grid')} title="Grid view"><LayoutGrid size={15} /></ViewBtn>
                </div>
              </div>

              {/* Posts */}
              {pagePosts.length > 0 && (
                viewMode === 'list' ? (
                  <motion.div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} variants={staggerGrid} initial="hidden" animate="show">
                    <AnimatePresence mode="popLayout">
                      {pagePosts.map((post, idx) => (
                        <ListCard key={post.id} post={post} isFeatured={isFeaturedBadge(idx)} />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div className="blg-grid-view" variants={staggerGrid} initial="hidden" animate="show">
                    <AnimatePresence mode="popLayout">
                      {pagePosts.map((post, idx) => (
                        <GridCard key={post.id} post={post} isFeatured={isFeaturedBadge(idx)} />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '3rem', flexWrap: 'wrap' }}>
                  <PageBtn disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>
                    <ChevronLeft size={14} /> Prev
                  </PageBtn>
                  {pageNumbers.map((p, i) =>
                    p === '...'
                      ? <span key={`e${i}`} style={{ color: 'rgba(161,161,170,0.5)', padding: '0 4px', fontSize: '0.9rem' }}>…</span>
                      : <PageBtn key={p} active={p === currentPage} onClick={() => goToPage(p)}>{p}</PageBtn>
                  )}
                  <PageBtn disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}>
                    Next <ChevronRight size={14} />
                  </PageBtn>
                </div>
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
