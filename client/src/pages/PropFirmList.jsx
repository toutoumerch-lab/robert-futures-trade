import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { LayoutGrid, List, Search, SlidersHorizontal, X, Star, ExternalLink, Copy, Check, Filter, Heart, GitCompareArrows, Zap, TrendingUp } from 'lucide-react';

const API = 'http://localhost:5000';

/* ════════════════════════════════════════════════
   Reusable Components
   ════════════════════════════════════════════════ */
const StatBox = ({ label, value, highlight }) => {
  if (value == null || value === '' || value === false) return null;
  return (
    <div style={{
      background: highlight ? 'linear-gradient(135deg, rgba(236,72,153,0.05), rgba(168,85,247,0.05))' : 'var(--bg-secondary)',
      padding: '1.25rem', borderRadius: '24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '0.4rem',
      boxShadow: highlight ? '0 15px 35px -5px rgba(236,72,153,0.1)' : '0 8px 25px -5px rgba(0,0,0,0.03)',
      transition: 'transform 0.2s'
    }} className="hover:-translate-y-1">
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: '1.25rem', fontWeight: 900, color: highlight ? 'var(--accent-purple)' : 'var(--text-primary)', lineHeight: 1.1 }}>{value === true ? 'Yes' : value}</span>
    </div>
  );
};

const CopyBadge = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="badge" style={{
      cursor: 'pointer', background: copied ? '#10b981' : 'rgba(16,185,129,0.15)',
      color: copied ? '#fff' : '#10b981', border: `1px solid ${copied ? '#10b981' : 'rgba(16,185,129,0.3)'}`,
      fontWeight: 700, letterSpacing: '0.5px', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '5px',
    }}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : `Code: ${code}`}
    </button>
  );
};

const RatingStars = ({ rating }) => {
  if (!rating) return <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>N/A</span>;
  const color = rating >= 4.5 ? '#f59e0b' : rating >= 4.0 ? '#3b82f6' : 'var(--text-secondary)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color, fontWeight: 700, fontSize: '0.9rem' }}>
      <Star size={14} fill={color} stroke={color} /> {rating}
    </span>
  );
};

/* ── Highlight matched text ── */
const HighlightText = ({ text, query }) => {
  if (!query || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(168,85,247,0.25)', color: 'inherit', borderRadius: '2px', padding: '0 1px' }}>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
};

/* ── Loading Skeleton ── */
const SkeletonCard = () => (
  <div className="firm-grid-card pf-skeleton-card" style={{ background: 'var(--bg-secondary)', borderRadius: '24px', padding: '1.75rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden', position: 'relative' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--border-color)' }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div className="pf-shimmer" style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="pf-shimmer" style={{ width: '60%', height: 18, borderRadius: 6, marginBottom: 6 }} />
        <div className="pf-shimmer" style={{ width: '30%', height: 12, borderRadius: 4 }} />
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
      {[1,2,3].map(i => <div key={i} className="pf-shimmer" style={{ height: 60, borderRadius: 12 }} />)}
    </div>
    <div className="pf-shimmer" style={{ height: 40, borderRadius: 10, marginTop: 'auto' }} />
  </div>
);

/* ════════════════════════════════════════════════
   Smart Search Dropdown
   ════════════════════════════════════════════════ */
const SmartSearch = ({ firms, searchQuery, setSearchQuery, onSelectFirm }) => {
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef(null);

  // Smart keyword mapping
  const matchesKeyword = useCallback((firm, q) => {
    const lower = q.toLowerCase();
    // Direct name match
    if (firm.name.toLowerCase().includes(lower)) return { type: 'name', label: firm.name };
    // Promo code match
    if (firm.discount_code && firm.discount_code.toLowerCase().includes(lower)) return { type: 'code', label: `Code: ${firm.discount_code}` };
    // Keyword matches
    if (['free', 'no fee', 'zero'].some(k => lower.includes(k)) && (!firm.activation_fee || Number(firm.activation_fee) === 0)) return { type: 'keyword', label: 'Free Activation' };
    if (['cheap', 'low', 'budget', 'affordable'].some(k => lower.includes(k)) && Number(firm.discount_usd || firm.fifty_k_initial_cost || 999) < 100) return { type: 'keyword', label: 'Low Price' };
    if (['high rating', 'top rated', 'best', 'good'].some(k => lower.includes(k)) && Number(firm.rating || 0) >= 4.5) return { type: 'keyword', label: `★ ${firm.rating}` };
    if (['discount', 'promo', 'deal', 'coupon', 'sale'].some(k => lower.includes(k)) && firm.discount_code) return { type: 'keyword', label: `${firm.discount_percent || ''}% OFF` };
    if (['split', 'profit'].some(k => lower.includes(k)) && firm.profit_split) return { type: 'keyword', label: firm.profit_split };
    return null;
  }, []);

  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 1) return [];
    return firms
      .map(firm => {
        const match = matchesKeyword(firm, searchQuery);
        if (!match) return null;
        return { firm, ...match };
      })
      .filter(Boolean)
      .slice(0, 6);
  }, [firms, searchQuery, matchesKeyword]);

  const showDropdown = focused && suggestions.length > 0 && searchQuery.length >= 1;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setFocused(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="pf-search-wrap" ref={wrapRef}>
      <Search size={16} className="pf-search-icon" />
      <input
        type="text"
        className="pf-search-input"
        placeholder="Search firms, codes, keywords..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        autoComplete="off"
      />
      {searchQuery && (
        <button className="pf-search-clear" onClick={() => { setSearchQuery(''); setFocused(false); }}><X size={14} /></button>
      )}

      {/* Autocomplete dropdown */}
      {showDropdown && (
        <div className="pf-search-dropdown">
          {suggestions.map(({ firm, type, label }) => (
            <button
              key={firm.id}
              className="pf-search-suggestion"
              onMouseDown={(e) => { e.preventDefault(); setSearchQuery(firm.name); setFocused(false); onSelectFirm?.(firm); }}
            >
              {firm.logo_url && (
                <img src={`${API}${firm.logo_url}`} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain', background: '#fff', padding: 2, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  <HighlightText text={firm.name} query={searchQuery} />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 1 }}>
                  {type === 'code' && <span style={{ color: '#10b981' }}>{label}</span>}
                  {type === 'keyword' && <span style={{ color: 'var(--accent-purple)' }}>{label}</span>}
                  {type === 'name' && firm.rating && <span>★ {firm.rating}</span>}
                </div>
              </div>
              <span className="pf-search-type-badge">{type === 'code' ? 'CODE' : type === 'keyword' ? 'MATCH' : 'FIRM'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════
   Comparison Modal
   ════════════════════════════════════════════════ */
const CompareModal = ({ firms, onClose }) => {
  if (!firms || firms.length < 2) return null;
  const rows = [
    { key: 'rating', label: '⭐ Rating', render: f => f.rating || 'N/A' },
    { key: 'activation_fee', label: '💰 Activation Fee', render: f => f.activation_fee ? `$${f.activation_fee}` : 'Free' },
    { key: 'price', label: '💲 Price', render: f => f.discount_usd ? `$${f.discount_usd}` : f.fifty_k_initial_cost ? `$${f.fifty_k_initial_cost}` : 'N/A' },
    { key: 'discount_percent', label: '🏷️ Discount', render: f => f.discount_percent ? `-${f.discount_percent}%` : '—' },
    { key: 'discount_code', label: '🎟️ Promo Code', render: f => f.discount_code || '—' },
    { key: 'profit_split', label: '📊 Profit Split', render: f => f.profit_split || 'N/A' },
    { key: 'profit_target', label: '🎯 Profit Target', render: f => f.profit_target || 'N/A' },
    { key: 'dll', label: '📉 Daily Loss Limit', render: f => f.dll || 'N/A' },
    { key: 'drawdown_limit', label: '📉 Drawdown', render: f => f.drawdown_limit || 'N/A' },
    { key: 'days_to_payout', label: '⏰ Days to Payout', render: f => f.days_to_payout || 'N/A' },
    { key: 'max_accounts', label: '👤 Max Accounts', render: f => f.max_accounts || 'N/A' },
  ];

  return createPortal(
    <div className="pf-compare-overlay" onClick={onClose}>
      <style>{`@keyframes compareSlideUp { from { opacity:0; transform:translateY(30px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
      <div className="pf-compare-modal" onClick={e => e.stopPropagation()} style={{ animation: 'compareSlideUp 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GitCompareArrows size={22} /> Compare Firms
          </h2>
          <button onClick={onClose} style={{ background: 'var(--bg-secondary)', border: 'none', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>✕</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="pf-compare-table">
            <thead>
              <tr>
                <th style={{ width: '160px' }}></th>
                {firms.map(f => (
                  <th key={f.id}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      {f.logo_url && <img src={`${API}${f.logo_url}`} alt="" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'contain', background: '#fff', padding: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />}
                      <span style={{ fontWeight: 800, fontSize: '1rem' }}>{f.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.key}>
                  <td className="pf-compare-label">{row.label}</td>
                  {firms.map(f => (
                    <td key={f.id} style={{ textAlign: 'center', fontWeight: 700 }}>{row.render(f)}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="pf-compare-label">🔗 Website</td>
                {firms.map(f => (
                  <td key={f.id} style={{ textAlign: 'center' }}>
                    {f.website ? <a href={f.website} target="_blank" rel="noreferrer" className="btn-visit-firm-sm" style={{ display: 'inline-flex' }}>Visit <ExternalLink size={11} /></a> : '—'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ════════════════════════════════════════════════
   Grid Card (with compare + fav)
   ════════════════════════════════════════════════ */
const FirmGridCard = ({ firm, onClick, isComparing, onToggleCompare, isFav, onToggleFav, compareDisabled }) => (
  <div className={`firm-grid-card ${isComparing ? 'comparing' : ''}`} onClick={onClick} style={{
    background: 'var(--bg-secondary)', borderRadius: '24px', padding: '1.75rem',
    border: isComparing ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
    cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
    display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden',
    animation: 'pfCardIn 0.35s ease-out both',
  }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: isComparing ? 'var(--accent-purple)' : 'var(--gradient-lotus)', opacity: isComparing ? 1 : 0.6 }} />

    {/* Action buttons (top right) */}
    <div className="pf-card-actions" onClick={e => e.stopPropagation()}>
      <button className={`pf-fav-btn ${isFav ? 'active' : ''}`} onClick={() => onToggleFav(firm.id)} title={isFav ? 'Remove favorite' : 'Save favorite'}>
        <Heart size={15} fill={isFav ? '#ec4899' : 'none'} stroke={isFav ? '#ec4899' : 'currentColor'} />
      </button>
      <button
        className={`pf-compare-btn ${isComparing ? 'active' : ''}`}
        onClick={() => onToggleCompare(firm.id)}
        disabled={compareDisabled && !isComparing}
        title={isComparing ? 'Remove from comparison' : compareDisabled ? 'Max 3 firms' : 'Add to compare'}
      >
        <GitCompareArrows size={13} />
        {isComparing ? '✓' : '+'}
      </button>
    </div>

    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingRight: '70px' }}>
      {firm.logo_url && (
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <img src={`${API}${firm.logo_url}`} alt={firm.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
        </div>
      )}
      <div>
        <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{firm.name}</h3>
        {firm.featured && <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.08em' }}>★ Featured</span>}
      </div>
    </div>

    {firm.discount_code && <div style={{ alignSelf: 'flex-start' }}><CopyBadge code={firm.discount_code} /></div>}

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
      <div className="firm-mini-stat">
        <span className="firm-mini-stat-label">Rating</span>
        <RatingStars rating={firm.rating} />
      </div>
      <div className="firm-mini-stat">
        <span className="firm-mini-stat-label">Activation</span>
        <span className="firm-mini-stat-value">{firm.activation_fee ? `$${firm.activation_fee}` : 'Free'}</span>
      </div>
      <div className="firm-mini-stat" style={firm.discount_usd ? { background: 'linear-gradient(135deg, rgba(236,72,153,0.06), rgba(168,85,247,0.06))', border: '1px solid rgba(236,72,153,0.12)' } : {}}>
        <span className="firm-mini-stat-label">Price</span>
        {firm.discount_usd ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontWeight: 900, fontSize: '1.15rem', color: 'var(--text-primary)', lineHeight: 1 }}>${firm.discount_usd}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>${firm.without_discount_usd}</span>
              {firm.discount_percent && <span style={{ background: 'var(--accent-pink)', color: '#fff', fontSize: '0.6rem', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>-{firm.discount_percent}%</span>}
            </div>
          </div>
        ) : (
          <span className="firm-mini-stat-value">{firm.fifty_k_initial_cost ? `$${firm.fifty_k_initial_cost}` : 'N/A'}</span>
        )}
      </div>
    </div>

    {firm.profit_split && (
      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>Profit Split:</span> {firm.profit_split}
      </div>
    )}

    <div style={{ marginTop: 'auto', paddingTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
      {firm.website && (
        <a href={firm.website} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="btn-visit-firm" style={{ flex: 1, textAlign: 'center' }}>
          Visit Website <ExternalLink size={13} />
        </a>
      )}
    </div>
  </div>
);

/* ════════════════════════════════════════════════
   List Row (with compare + fav)
   ════════════════════════════════════════════════ */
const FirmListRow = ({ firm, onClick, isComparing, onToggleCompare, isFav, onToggleFav, compareDisabled }) => (
  <div className={`firm-list-row ${isComparing ? 'comparing' : ''}`} onClick={onClick} style={{
    background: 'var(--bg-secondary)', borderRadius: '16px', padding: '1.25rem 1.5rem',
    border: isComparing ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
    cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
    display: 'flex', alignItems: 'center', gap: '1.25rem',
    animation: 'pfCardIn 0.3s ease-out both',
  }}>
    {/* Actions */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
      <button className={`pf-fav-btn ${isFav ? 'active' : ''}`} onClick={() => onToggleFav(firm.id)}>
        <Heart size={14} fill={isFav ? '#ec4899' : 'none'} stroke={isFav ? '#ec4899' : 'currentColor'} />
      </button>
      <button className={`pf-compare-btn ${isComparing ? 'active' : ''}`} onClick={() => onToggleCompare(firm.id)} disabled={compareDisabled && !isComparing}>
        <GitCompareArrows size={12} />
      </button>
    </div>

    {firm.logo_url && (
      <div style={{ width: '44px', height: '44px', borderRadius: '10px', overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <img src={`${API}${firm.logo_url}`} alt={firm.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
      </div>
    )}

    <div style={{ flex: '1 1 180px', minWidth: 0 }}>
      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{firm.name}</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
        <RatingStars rating={firm.rating} />
        {firm.featured && <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#f97316', textTransform: 'uppercase', background: 'rgba(249,115,22,0.1)', padding: '1px 6px', borderRadius: '4px' }}>Featured</span>}
      </div>
    </div>

    <div style={{ flex: '0 0 90px', textAlign: 'center' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Activation</div>
      <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{firm.activation_fee ? `$${firm.activation_fee}` : 'Free'}</div>
    </div>

    <div style={{ flex: '0 0 110px', textAlign: 'center' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Price</div>
      {firm.discount_usd ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <span style={{ fontWeight: 900 }}>${firm.discount_usd}</span>
          <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>${firm.without_discount_usd}</span>
          {firm.discount_percent && <span style={{ background: 'var(--accent-pink)', color: '#fff', fontSize: '0.6rem', padding: '1px 4px', borderRadius: '3px', fontWeight: 800 }}>-{firm.discount_percent}%</span>}
        </div>
      ) : (
        <span style={{ fontWeight: 800 }}>{firm.fifty_k_initial_cost ? `$${firm.fifty_k_initial_cost}` : 'N/A'}</span>
      )}
    </div>

    <div style={{ flex: '0 0 auto' }}>
      {firm.discount_code ? <CopyBadge code={firm.discount_code} /> : <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>—</span>}
    </div>

    {firm.website && (
      <a href={firm.website} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="btn-visit-firm-sm">
        Visit <ExternalLink size={12} />
      </a>
    )}
  </div>
);

/* ════════════════════════════════════════════════
   Main Page Component
   ════════════════════════════════════════════════ */
const PropFirmList = () => {
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('name');
  const [viewLayout, setViewLayout] = useState(() => localStorage.getItem('pf_layout') || 'grid');
  const [viewingFirm, setViewingFirm] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState('');
  const [discountOnly, setDiscountOnly] = useState(false);
  const [freeActivation, setFreeActivation] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Compare
  const [compareIds, setCompareIds] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  // Favorites
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pf_favorites') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    axios.get(`${API}/api/prop-firms`)
      .then(res => setFirms(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { localStorage.setItem('pf_layout', viewLayout); }, [viewLayout]);
  useEffect(() => { localStorage.setItem('pf_favorites', JSON.stringify(favorites)); }, [favorites]);

  const toggleFav = useCallback((id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const toggleCompare = useCallback((id) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }, []);

  const getPrice = (f) => Number(f.discount_usd || f.activation_fee || f.fifty_k_initial_cost || 0);

  const filtered = useMemo(() => {
    return firms.filter(f => {
      // Smart search: match name, code, or keywords
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = f.name.toLowerCase().includes(q);
        const codeMatch = f.discount_code && f.discount_code.toLowerCase().includes(q);
        const kwFree = ['free', 'no fee', 'zero'].some(k => q.includes(k)) && (!f.activation_fee || Number(f.activation_fee) === 0);
        const kwCheap = ['cheap', 'low', 'budget', 'affordable'].some(k => q.includes(k)) && Number(f.discount_usd || f.fifty_k_initial_cost || 999) < 100;
        const kwGood = ['high rating', 'top rated', 'best', 'good'].some(k => q.includes(k)) && Number(f.rating || 0) >= 4.5;
        const kwDeal = ['discount', 'promo', 'deal', 'sale'].some(k => q.includes(k)) && f.discount_code;
        if (!nameMatch && !codeMatch && !kwFree && !kwCheap && !kwGood && !kwDeal) return false;
      }
      if (minRating > 0 && (!f.rating || Number(f.rating) < minRating)) return false;
      if (maxPrice && getPrice(f) > Number(maxPrice)) return false;
      if (discountOnly && !f.discount_code) return false;
      if (freeActivation && f.activation_fee && Number(f.activation_fee) > 0) return false;
      if (favoritesOnly && !favorites.includes(f.id)) return false;
      return true;
    });
  }, [firms, searchQuery, minRating, maxPrice, discountOnly, freeActivation, favoritesOnly, favorites]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sort === 'cost') return getPrice(a) - getPrice(b);
      if (sort === 'rating') return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      if (sort === 'deal') return (Number(b.discount_percent) || 0) - (Number(a.discount_percent) || 0);
      if (sort === 'free') {
        const af = !a.activation_fee || Number(a.activation_fee) === 0 ? 0 : 1;
        const bf = !b.activation_fee || Number(b.activation_fee) === 0 ? 0 : 1;
        return af - bf || a.name.localeCompare(b.name);
      }
      if (sort === 'popular') return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (Number(b.rating) || 0) - (Number(a.rating) || 0);
      return a.name.localeCompare(b.name);
    });
  }, [filtered, sort]);

  const activeFilterCount = [searchQuery, minRating > 0, maxPrice, discountOnly, freeActivation, favoritesOnly].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery(''); setMinRating(0); setMaxPrice('');
    setDiscountOnly(false); setFreeActivation(false); setFavoritesOnly(false);
  };

  const compareFirms = useMemo(() => firms.filter(f => compareIds.includes(f.id)), [firms, compareIds]);

  const sortOptions = [
    ['name', 'Name', null],
    ['cost', 'Price 💰', null],
    ['rating', 'Rating ⭐', null],
    ['deal', 'Best Deal 💸', null],
    ['free', 'Free 🆓', null],
    ['popular', 'Popular 🔥', null],
  ];

  return (
    <div>
      {/* Hero */}
      <section className="page-hero">
        <div className="page-hero-bg" />
        <div className="container text-center" style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            Prop Firm <span className="text-gradient">Comparisons</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            Unbiased, detailed reviews of every major prop trading firm — profit splits, evaluation costs, drawdown rules, and more.
          </p>
        </div>
      </section>

      <div className="container py-16">
        {loading ? (
          <div>
            <div className="pf-toolbar" style={{ opacity: 0.4 }}>
              <div className="pf-shimmer" style={{ width: '100%', height: 38, borderRadius: 20 }} />
            </div>
            <div className="pf-grid">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>
          </div>
        ) : firms.length === 0 ? (
          <div className="empty-state-page">
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏦</p>
            <h3 className="mb-2">Reviews Coming Soon</h3>
            <p style={{ color: 'var(--text-secondary)' }}>We're working on in-depth prop firm reviews. Stay tuned.</p>
          </div>
        ) : (
          <>
            {/* ── Toolbar ── */}
            <div className="pf-toolbar">
              <SmartSearch firms={firms} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSelectFirm={f => setViewingFirm(f)} />

              <div className="pf-sort-group">
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600 }}>Sort:</span>
                {sortOptions.map(([val, label]) => (
                  <button key={val} className={`pf-sort-btn ${sort === val ? 'active' : ''}`} onClick={() => setSort(val)}>
                    {label}
                  </button>
                ))}
              </div>

              <div className="pf-layout-toggle">
                <button className={`pf-layout-btn ${viewLayout === 'grid' ? 'active' : ''}`} onClick={() => setViewLayout('grid')} title="Grid View"><LayoutGrid size={16} /></button>
                <button className={`pf-layout-btn ${viewLayout === 'list' ? 'active' : ''}`} onClick={() => setViewLayout('list')} title="List View"><List size={16} /></button>
              </div>

              <button className={`pf-filter-toggle ${filtersOpen ? 'active' : ''}`} onClick={() => setFiltersOpen(v => !v)}>
                <SlidersHorizontal size={15} /> Filters
                {activeFilterCount > 0 && <span className="pf-filter-badge">{activeFilterCount}</span>}
              </button>
            </div>

            {/* ── Content ── */}
            <div className="pf-content-area">
              {/* Filter Sidebar */}
              <div className={`pf-filter-sidebar ${filtersOpen ? 'open' : ''}`}>
                <div className="pf-filter-header">
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Filter size={16} /> Filters</h4>
                  {activeFilterCount > 0 && <button className="pf-filter-clear-btn" onClick={clearFilters}>Clear all</button>}
                  <button className="pf-filter-close-btn" onClick={() => setFiltersOpen(false)}><X size={18} /></button>
                </div>

                {/* Favorites filter */}
                <div className="pf-filter-group">
                  <label className="pf-filter-toggle-label">
                    <input type="checkbox" checked={favoritesOnly} onChange={e => setFavoritesOnly(e.target.checked)} />
                    <span className="pf-checkbox-custom" />
                    <Heart size={14} style={{ color: '#ec4899' }} /> Favorites Only ({favorites.length})
                  </label>
                </div>

                <div className="pf-filter-group">
                  <label className="pf-filter-label"><Star size={14} /> Min Rating</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input type="range" min="0" max="5" step="0.5" value={minRating} onChange={e => setMinRating(Number(e.target.value))} style={{ flex: 1 }} />
                    <span className="pf-filter-value">{minRating > 0 ? `${minRating}+` : 'Any'}</span>
                  </div>
                </div>

                <div className="pf-filter-group">
                  <label className="pf-filter-label">Max Price ($)</label>
                  <input type="number" className="pf-filter-input" placeholder="e.g. 200" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} min="0" />
                </div>

                <div className="pf-filter-group">
                  <label className="pf-filter-toggle-label">
                    <input type="checkbox" checked={discountOnly} onChange={e => setDiscountOnly(e.target.checked)} />
                    <span className="pf-checkbox-custom" />
                    Has Discount / Promo Code
                  </label>
                </div>

                <div className="pf-filter-group">
                  <label className="pf-filter-toggle-label">
                    <input type="checkbox" checked={freeActivation} onChange={e => setFreeActivation(e.target.checked)} />
                    <span className="pf-checkbox-custom" />
                    Free Activation
                  </label>
                </div>

                <div className="pf-filter-results">
                  <span>{filtered.length}</span> of {firms.length} firms
                </div>
              </div>

              {/* Results */}
              <div className="pf-results">
                {sorted.length === 0 ? (
                  <div className="pf-empty-results">
                    <Search size={40} style={{ opacity: 0.15, marginBottom: '1rem' }} />
                    <h3 style={{ margin: '0 0 0.5rem', fontWeight: 700 }}>No firms match your filters</h3>
                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Try adjusting or clearing your filters.</p>
                    <button className="btn btn-outline mt-4" onClick={clearFilters}>Clear Filters</button>
                  </div>
                ) : viewLayout === 'grid' ? (
                  <div className="pf-grid">
                    {sorted.map((firm, i) => (
                      <div key={firm.id} style={{ animationDelay: `${i * 0.05}s` }}>
                        <FirmGridCard
                          firm={firm} onClick={() => setViewingFirm(firm)}
                          isComparing={compareIds.includes(firm.id)} onToggleCompare={toggleCompare}
                          isFav={favorites.includes(firm.id)} onToggleFav={toggleFav}
                          compareDisabled={compareIds.length >= 3}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pf-list">
                    {sorted.map((firm, i) => (
                      <div key={firm.id} style={{ animationDelay: `${i * 0.04}s` }}>
                        <FirmListRow
                          firm={firm} onClick={() => setViewingFirm(firm)}
                          isComparing={compareIds.includes(firm.id)} onToggleCompare={toggleCompare}
                          isFav={favorites.includes(firm.id)} onToggleFav={toggleFav}
                          compareDisabled={compareIds.length >= 3}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Floating Compare Bar ── */}
            {compareIds.length >= 2 && (
              <div className="pf-compare-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <GitCompareArrows size={18} />
                  <span style={{ fontWeight: 700 }}>{compareIds.length} firms selected</span>
                  <div className="pf-compare-avatars">
                    {compareFirms.map(f => (
                      f.logo_url && <img key={f.id} src={`${API}${f.logo_url}`} alt="" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'contain', background: '#fff', padding: 2, border: '2px solid var(--accent-purple)' }} />
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }} onClick={() => setCompareIds([])}>Clear</button>
                  <button className="pf-compare-now-btn" onClick={() => setShowCompare(true)}>
                    Compare Now <GitCompareArrows size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Compare Modal ── */}
      {showCompare && <CompareModal firms={compareFirms} onClose={() => setShowCompare(false)} />}

      {/* ── Detail Modal ── */}
      {viewingFirm && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', animation: 'fadeIn 0.2s ease-out' }} onClick={() => setViewingFirm(null)}>
          <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(30px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}} .modal-content-glass::-webkit-scrollbar{width:0}`}</style>
          <div className="modal-content-glass" style={{ background: 'var(--bg-primary)', width: '100%', maxWidth: '950px', maxHeight: '90vh', borderRadius: '32px', overflowY: 'auto', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.5)', cursor: 'auto', animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(var(--bg-primary-rgb), 0.85)', backdropFilter: 'blur(24px)' }}>
              <div style={{ height: '4px', background: 'linear-gradient(90deg, #10b981, #3b82f6, #ec4899, #f97316)', width: '100%', opacity: 0.8 }} />
              <div style={{ padding: '2rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
                  {viewingFirm.logo_url && (
                    <div style={{ width: '80px', height: '80px', borderRadius: '24px', overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
                      <img src={`${API}${viewingFirm.logo_url}`} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }} />
                    </div>
                  )}
                  <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-1px', lineHeight: 1 }}>{viewingFirm.name}</h2>
                    <div className="flex items-center gap-4 mt-2">
                      {viewingFirm.rating && <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#f59e0b' }}>★</span> {viewingFirm.rating} Trust Score</span>}
                      {viewingFirm.featured && <span style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316', padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>Featured</span>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <button onClick={() => setViewingFirm(null)} style={{ background: 'var(--bg-secondary)', border: 'none', width: 40, height: 40, borderRadius: '50%', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>✕</button>
                  {viewingFirm.website && (
                    <a href={viewingFirm.website} target="_blank" rel="noreferrer" style={{ background: 'linear-gradient(135deg, var(--accent-pink), var(--accent-purple))', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '99px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 25px -5px rgba(236,72,153,0.4)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Visit Official Site <ExternalLink size={15} />
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '4rem' }}>
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', marginBottom: '1.25rem' }}>🏢 Basic Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '20px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Account Category</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{viewingFirm.account_category || '-'}</span>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '20px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Trustpilot Rating</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>⭐ {viewingFirm.rating ? `${viewingFirm.rating} / 5` : '-'}</span>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '20px', gridColumn: '1 / -1' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '1rem' }}>Supported Platforms</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {viewingFirm.platforms?.length > 0 ? viewingFirm.platforms.map(p => (
                        <span key={p} style={{ background: 'var(--bg-primary)', padding: '0.6rem 1.2rem', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 700, border: '1px solid var(--border-color)' }}>{p}</span>
                      )) : <span style={{ color: 'var(--text-secondary)' }}>No platforms listed</span>}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', margin: 0 }}>💲 Pricing Details</h4>
                  {viewingFirm.discount_code && <CopyBadge code={viewingFirm.discount_code} />}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  <StatBox label="Activation Fee" value={viewingFirm.activation_fee != null && viewingFirm.activation_fee !== '' ? `$${viewingFirm.activation_fee}` : '-'} />
                  <StatBox label="Reset Fee" value={viewingFirm.reset_fee != null && viewingFirm.reset_fee !== '' ? (isNaN(viewingFirm.reset_fee) ? viewingFirm.reset_fee : `$${viewingFirm.reset_fee}`) : '-'} />
                  <StatBox label="50K All In" value={viewingFirm.fifty_k_all_in != null && viewingFirm.fifty_k_all_in !== '' ? `$${viewingFirm.fifty_k_all_in}` : '-'} />
                  <StatBox label="50K Initial Cost" value={viewingFirm.fifty_k_initial_cost != null && viewingFirm.fifty_k_initial_cost !== '' ? `$${viewingFirm.fifty_k_initial_cost}` : '-'} />
                  <StatBox label="Without Discount" value={viewingFirm.without_discount_usd != null && viewingFirm.without_discount_usd !== '' ? `$${viewingFirm.without_discount_usd}` : '-'} />
                  <StatBox label="Discount" value={viewingFirm.discount_usd != null && viewingFirm.discount_usd !== '' ? `$${viewingFirm.discount_usd} ${viewingFirm.discount_percent ? '(' + viewingFirm.discount_percent + '%)' : ''}` : '-'} highlight />
                </div>
              </div>
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', marginBottom: '1.25rem' }}>⚙️ Trading Rules & Metrics</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <StatBox label="Profit Target" value={viewingFirm.profit_target} />
                  <StatBox label="Profit Split" value={viewingFirm.profit_split} highlight />
                  <StatBox label="Daily Loss Limit" value={viewingFirm.dll} />
                  <StatBox label="Max Withdrawal" value={viewingFirm.max_withdrawal} />
                  <StatBox label="Drawdown" value={viewingFirm.drawdown_limit} />
                  <StatBox label="Days to Pass" value={viewingFirm.days_to_pass} />
                  <StatBox label="Days to Payout" value={viewingFirm.days_to_payout} />
                  <StatBox label="Eval (%)" value={viewingFirm.eval} />
                  <StatBox label="PA (%)" value={viewingFirm.pa} />
                  <StatBox label="Max Accounts" value={viewingFirm.max_accounts} />
                </div>
              </div>
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', marginBottom: '1.25rem' }}>🔧 Feature Support</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {['buffer', 'copy_trade', 'vpn', 'dca', 'news', 'bots', 'micro_scalping'].map(feat => {
                    const isEnabled = viewingFirm[feat];
                    const label = feat === 'buffer' && isEnabled
                      ? `BUFFER (${viewingFirm.buffer_amount || 'N/A'})`
                      : feat.replace(/_/g, ' ').toUpperCase();
                    return (
                      <span key={feat} style={{
                        padding: '0.6rem 1.2rem', borderRadius: '12px', fontSize: '13px', fontWeight: 700,
                        background: isEnabled ? 'rgba(16,185,129,0.1)' : 'var(--bg-secondary)',
                        color: isEnabled ? '#10b981' : 'var(--text-secondary)',
                        border: `1px solid ${isEnabled ? 'rgba(16,185,129,0.2)' : 'var(--border-color)'}`
                      }}>
                        {isEnabled ? '✓' : '✗'} {label}
                      </span>
                    );
                  })}
                </div>
              </div>
              {viewingFirm.notes && (
                <div style={{ padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '24px', fontSize: '16px', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 800 }}>📝 Author Notes</strong>
                  {viewingFirm.notes}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PropFirmList;
