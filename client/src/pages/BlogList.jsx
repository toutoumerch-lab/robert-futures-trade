import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Reveal from '../components/common/Reveal';
import { Search, Clock, MessageSquare, ArrowRight, BookOpen, Tag, TrendingUp, Zap } from 'lucide-react';

const CATEGORIES = ['All', 'Market Analysis', 'Trading Psychology', 'Futures', 'Risk Management', 'Strategy', 'Macroeconomics', 'General'];

const BlogList = () => {
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [activeCategory, setActive] = useState('All');

  useEffect(() => {
    axios.get('http://localhost:5000/api/posts')
      .then(res => setPosts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = posts.filter(p => {
    const matchSearch = !search
      || p.title.toLowerCase().includes(search.toLowerCase())
      || (p.excerpt && p.excerpt.toLowerCase().includes(search.toLowerCase()))
      || (p.author_name && p.author_name.toLowerCase().includes(search.toLowerCase()));
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  const featured = filtered[0];
  const rest     = filtered.slice(1);

  return (
    <div className="blog-page">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="blog-hero-bg">
        <div className="container">
          <Reveal direction="up">
            <div className="blog-hero-inner">
              <div className="blog-hero-eyebrow">
                <TrendingUp size={14} />
                <span>Market Intelligence Hub</span>
              </div>
              <h1 className="blog-hero-title">
                Daily <span className="text-gradient">Market Insights</span>
              </h1>
              <p className="blog-hero-subtitle">
                Trade setups, psychology breakdowns, macroeconomic analysis, and community discussions — updated daily.
              </p>

              {/* Search */}
              <div className="blog-search-wrap">
                <Search size={18} className="blog-search-icon" />
                <input
                  id="blog-search"
                  className="blog-search-input"
                  type="text"
                  placeholder="Search posts, topics, authors…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      <div className="container">
        {/* ── Category Tabs ─────────────────────────────────────────────── */}
        <Reveal direction="up" delay={60}>
          <div className="blog-category-tabs">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                id={`cat-${cat.replace(/\s+/g,'-').toLowerCase()}`}
                className={`blog-cat-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActive(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </Reveal>

        {loading ? (
          <div className="blog-loading">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="blog-skeleton">
                <div className="blog-skeleton-img" />
                <div className="blog-skeleton-body">
                  <div className="blog-skeleton-line short" />
                  <div className="blog-skeleton-line" />
                  <div className="blog-skeleton-line med" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Reveal direction="up">
            <div className="blog-empty">
              <BookOpen size={52} style={{ color: 'var(--accent-primary)', marginBottom: '1.5rem' }} />
              <h3>No posts found</h3>
              <p>{search ? `No results for "${search}"` : 'No posts in this category yet.'}</p>
              {(search || activeCategory !== 'All') && (
                <button className="btn btn-outline mt-4" onClick={() => { setSearch(''); setActive('All'); }}>
                  Clear filters
                </button>
              )}
            </div>
          </Reveal>
        ) : (
          <>
            {/* ── Featured Post ──────────────────────────────────────────── */}
            {featured && !search && activeCategory === 'All' && (
              <Reveal direction="up" delay={80}>
                <Link to={`/blog/${featured.id}`} className="blog-featured-card" id={`post-featured-${featured.id}`}>
                  <div
                    className="blog-featured-img"
                    style={{ backgroundImage: featured.image_url ? `url(http://localhost:5000${featured.image_url})` : 'none' }}
                  >
                    {!featured.image_url && (
                      <div className="blog-featured-placeholder">
                        <BookOpen size={48} />
                      </div>
                    )}
                    <div className="blog-featured-overlay" />
                    <div className="blog-featured-content">
                      <div className="blog-featured-badges">
                        <span className="blog-badge blog-badge-featured"><Zap size={12} /> Featured</span>
                        {featured.category && <span className="blog-badge">{featured.category}</span>}
                      </div>
                      <h2 className="blog-featured-title">{featured.title}</h2>
                      {featured.excerpt && (
                        <p className="blog-featured-excerpt">{featured.excerpt}</p>
                      )}
                      <div className="blog-featured-meta">
                        <div className="blog-author-chip">
                          <div className="blog-avatar">{(featured.author_name || 'A')[0].toUpperCase()}</div>
                          <span>{featured.author_name}</span>
                        </div>
                        <span className="blog-meta-dot">·</span>
                        <Clock size={13} />
                        <span>{featured.read_time || '3 min read'}</span>
                        <span className="blog-meta-dot">·</span>
                        <MessageSquare size={13} />
                        <span>{featured.comment_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </Reveal>
            )}

            {/* ── Post Grid ──────────────────────────────────────────────── */}
            <div className="blog-grid">
              <AnimatePresence>
                {(search || activeCategory !== 'All' ? filtered : rest).map((post, i) => (
                  <Reveal key={post.id} direction="up" delay={i * 60}>
                    <Link to={`/blog/${post.id}`} className="blog-card" id={`post-card-${post.id}`}>
                      <div
                        className="blog-card-img"
                        style={{ backgroundImage: post.image_url ? `url(http://localhost:5000${post.image_url})` : 'none' }}
                      >
                        {!post.image_url && (
                          <div className="blog-card-img-placeholder">
                            <BookOpen size={32} />
                          </div>
                        )}
                        {post.category && (
                          <span className="blog-card-badge">{post.category}</span>
                        )}
                      </div>
                      <div className="blog-card-body">
                        <h3 className="blog-card-title">{post.title}</h3>
                        {post.excerpt && <p className="blog-card-excerpt">{post.excerpt}</p>}
                        <div className="blog-card-meta">
                          <div className="blog-author-chip small">
                            <div className="blog-avatar small">{(post.author_name || 'A')[0].toUpperCase()}</div>
                            <span>{post.author_name}</span>
                          </div>
                          <div className="blog-card-meta-right">
                            <Clock size={12} />
                            <span>{post.read_time || '3 min read'}</span>
                          </div>
                        </div>
                        <div className="blog-card-footer">
                          <span className="blog-date">
                            {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="blog-read-link">
                            Read <ArrowRight size={13} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BlogList;
