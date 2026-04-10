import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Card from '../components/common/Card';
import { Search, Sparkles, ArrowRight } from 'lucide-react';

const BlogList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/posts')
      .then(res => setPosts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = posts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.author_name && p.author_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="container py-16">
      {/* Page Header */}
      <div className="page-header mb-12">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          Daily <span className="text-gradient">Market Insights</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '560px' }}>
          Trade setups, psychology breakdowns, macroeconomic analysis, and community discussions — updated daily.
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '2.5rem', maxWidth: '400px' }}>
        <input
          className="input"
          type="text"
          placeholder="Search posts…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-state">Loading posts…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state-page">
          <p>No posts found{search ? ` for "${search}"` : ''}.</p>
          {search && <button className="action-btn mt-4" onClick={() => setSearch('')}>Clear search</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filtered.map((post, i) => (
            <Card key={post.id} className={i === 0 && !search ? 'featured-post' : ''}>
              {i === 0 && !search && (
                <span className="badge badge-featured mb-4"><Sparkles size={14} /> Latest</span>
              )}
              <h3 className="mb-3" style={{ fontSize: '1.2rem', lineHeight: 1.4 }}>{post.title}</h3>
              <div className="flex gap-4 items-center mb-4" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>By <span style={{ color: 'var(--accent-primary)' }}>{post.author_name}</span></span>
                <span>•</span>
                <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                {post.content.substring(0, 180)}{post.content.length > 180 ? '…' : ''}
              </p>
              <Link to={`/blog/${post.id}`} className="read-more-link">
                Read Full Article <ArrowRight size={14} />
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogList;
