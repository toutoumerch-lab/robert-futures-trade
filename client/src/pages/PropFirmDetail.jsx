import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Star, Heart, ExternalLink, Copy, Check, ChevronLeft,
  Building2, Wrench, DollarSign, Target, TrendingDown,
  Clock, Shield, Tag, ChevronDown, X, Globe, Zap, Activity
} from 'lucide-react';
import SEO from '../components/common/SEO';

const API = import.meta.env.VITE_API_URL;

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const parseNotes = (raw) => {
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
};

const fmtPrice = (v) => {
  if (v == null || v === '') return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : `$${n.toLocaleString()}`;
};

const safeHostname = (url) => {
  if (!url) return null;
  try {
    const u = url.startsWith('http') ? url : `https://${url}`;
    return new URL(u).hostname.replace('www.', '');
  } catch {
    return url;
  }
};

const safeHref = (url) => {
  if (!url) return '#';
  return url.startsWith('http') ? url : `https://${url}`;
};

const parseDrawdown = (dl) => {
  if (!dl) return { type: '—', amount: '—' };
  const m = dl.match(/^(.*?)\s*\$([0-9,]+)\s*$/);
  if (m) return { type: m[1].trim() || '—', amount: `$${parseInt(m[2].replace(/,/g, '')).toLocaleString()}` };
  return { type: dl, amount: '—' };
};

const planTypeLabel = (t) => {
  if (!t) return '—';
  if (t === 'evaluation_funded') return 'Eval -> Funded';
  if (t === 'straight_funded')   return 'Straight Funded';
  if (t === 'one_step')          return '1-Step';
  if (t === 'two_step')          return '2-Step';
  if (t === 'instant_funded')    return 'Instant Funded';
  return t;
};

const planTypeBadge = (t) => {
  if (t === 'evaluation_funded') return { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' };
  if (t === 'straight_funded')   return { bg: 'rgba(16,185,129,0.12)', color: '#10b981' };
  if (t === 'one_step')          return { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6' };
  if (t === 'two_step')          return { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' };
  if (t === 'instant_funded')    return { bg: 'rgba(249,115,22,0.12)', color: '#f97316' };
  return { bg: 'rgba(99,102,241,0.12)', color: '#6366f1' };
};

const statusColors = {
  green:  { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'Active' },
  blue:   { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6', label: 'New' },
  yellow: { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', label: 'Pending' },
  red:    { bg: 'rgba(244,63,94,0.12)',   color: '#f43f5e', label: 'Inactive' },
};

/* ── Small reusable atoms ────────────────────────────────────────────────── */
const CopyBtn = ({ code }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'var(--border-color)'}`,
        color: copied ? '#10b981' : 'var(--text-primary)',
        borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: '0.83rem',
        cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.5px',
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied!' : `Code: ${code}`}
    </button>
  );
};

const Pill = ({ children, color = 'var(--text-secondary)', bg = 'var(--bg-secondary)' }) => (
  <span style={{
    background: bg, color, border: `1px solid ${color}22`,
    borderRadius: 99, padding: '3px 12px', fontSize: '0.78rem', fontWeight: 700,
    display: 'inline-flex', alignItems: 'center', gap: 4,
  }}>{children}</span>
);

const FeatureBadge = ({ label, enabled }) => (
  <span style={{
    padding: '5px 14px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 700,
    background: enabled ? 'rgba(16,185,129,0.1)' : 'var(--bg-secondary)',
    color: enabled ? '#10b981' : 'var(--text-secondary)',
    border: `1px solid ${enabled ? 'rgba(16,185,129,0.25)' : 'var(--border-color)'}`,
    display: 'inline-flex', alignItems: 'center', gap: 5,
  }}>
    {enabled ? <Check size={12} /> : <X size={12} />} {label}
  </span>
);

/* ── Filter Select ───────────────────────────────────────────────────────── */
const FilterSelect = ({ label, value, onChange, options }) => (
  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        appearance: 'none', background: 'var(--bg-secondary)',
        border: `1px solid ${value ? 'var(--accent-primary)' : 'var(--border-color)'}`,
        color: value ? 'var(--text-primary)' : 'var(--text-secondary)',
        borderRadius: 99, padding: '6px 32px 6px 14px', fontSize: '0.82rem',
        fontWeight: 600, cursor: 'pointer', outline: 'none',
        transition: 'border-color 0.2s',
      }}
    >
      <option value="">{label}: All</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <ChevronDown size={13} style={{ position: 'absolute', right: 10, pointerEvents: 'none', color: 'var(--text-secondary)' }} />
  </div>
);

/* ── Toggle ──────────────────────────────────────────────────────────────── */
const Toggle = ({ label, checked, onChange }) => (
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', userSelect: 'none' }}>
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 36, height: 20, borderRadius: 99,
        background: checked ? 'var(--accent-primary)' : 'var(--border-color)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: checked ? 18 : 2,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </div>
    {label}
  </label>
);

/* ── Table Cell ──────────────────────────────────────────────────────────── */
const Td = ({ children, align = 'center', highlight }) => (
  <td style={{
    padding: '12px 14px', fontSize: '0.83rem', textAlign: align,
    color: highlight ? 'var(--accent-secondary)' : 'var(--text-primary)',
    fontWeight: highlight ? 700 : 400, whiteSpace: 'nowrap',
    borderBottom: '1px solid var(--border-color)',
  }}>
    {children ?? '—'}
  </td>
);

/* ── Size Row — Eval / Funded toggle per account size ────────────────────── */
const SizeRow = ({ row, notes, dd, rawPrice, origPrice, hasDisc, hasEvalPhase, firm, API, isLast, Stat }) => {
  const [phase, setPhase] = useState('eval'); // 'eval' | 'funded'
  const showFunded = phase === 'funded';

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '0.75rem',
  };

  return (
    <div style={{
      padding: '1.25rem 1.5rem',
      borderBottom: isLast ? 'none' : '1px solid var(--border-color)',
    }}>
      {/* ── Size Header: size label + pricing + buy ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        marginBottom: '1rem', flexWrap: 'wrap',
      }}>
        {/* Account Size Badge */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12))',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 12, padding: '8px 18px',
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        }}>
          <span style={{ fontWeight: 900, fontSize: '1.15rem', color: 'var(--accent-secondary)', letterSpacing: '-0.5px' }}>
            {row.plan_size || '—'}
          </span>
        </div>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasDisc && origPrice && (
            <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
              {fmtPrice(origPrice)}
            </span>
          )}
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: hasDisc ? '#10b981' : 'var(--text-primary)' }}>
            {fmtPrice(rawPrice) || 'N/A'}
          </span>
          {hasDisc && (
            <span style={{
              background: 'rgba(16,185,129,0.12)', color: '#10b981',
              borderRadius: 6, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 800,
            }}>
              -{row.discount_percent}%
            </span>
          )}
        </div>

        {/* Activation Fee */}
        {row.activation_fee != null && row.activation_fee !== '' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 600 }}>Activation:</span>
            <span style={{ fontWeight: 700, color: Number(row.activation_fee) === 0 ? '#10b981' : 'var(--text-primary)' }}>
              {Number(row.activation_fee) === 0 ? 'Free' : `$${Number(row.activation_fee).toLocaleString()}`}
            </span>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Buy Button */}
        {firm.website && (
          <a
            href={safeHref(firm.website)}
            target="_blank"
            rel="noreferrer"
            onClick={() => axios.post(`${API}/api/prop-firms/${row.id}/click`, { type: 'website' }).catch(() => {})}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))',
              color: '#fff', borderRadius: 10, padding: '8px 18px',
              fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)', transition: 'transform 0.15s, opacity 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.opacity = '1'; }}
          >
            Get This Plan <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* ── Phase Toggle Buttons ── */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: '1rem',
        background: 'var(--bg-primary)', borderRadius: 10, padding: 3,
        border: '1px solid var(--border-color)', width: 'fit-content',
      }}>
        {hasEvalPhase && (
          <button
            onClick={() => setPhase('eval')}
            style={{
              padding: '6px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.2s',
              background: !showFunded ? 'var(--accent-primary)' : 'transparent',
              color: !showFunded ? '#fff' : 'var(--text-secondary)',
              boxShadow: !showFunded ? '0 2px 8px rgba(37,99,235,0.3)' : 'none',
            }}
          >
            <Target size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }} />
            Evaluation
          </button>
        )}
        <button
          onClick={() => setPhase('funded')}
          style={{
            padding: '6px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.2s',
            background: showFunded || !hasEvalPhase ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
            color: showFunded || !hasEvalPhase ? '#fff' : 'var(--text-secondary)',
            boxShadow: showFunded || !hasEvalPhase ? '0 2px 8px rgba(16,185,129,0.3)' : 'none',
          }}
        >
          <DollarSign size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }} />
          Funded
        </button>
      </div>

      {/* ── Phase Content ── */}
      {!showFunded && hasEvalPhase ? (
        /* ── EVALUATION PHASE ── */
        <div style={{
          background: 'rgba(59,130,246,0.03)', border: '1px solid rgba(59,130,246,0.1)',
          borderRadius: 14, padding: '1rem 1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.85rem' }}>
            <Target size={14} style={{ color: '#3b82f6' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Challenge / Evaluation Phase
            </span>
          </div>
          <div style={gridStyle}>
            <Stat label="Profit Target" value={row.profit_target ? `$${Number(row.profit_target).toLocaleString()}` : null} highlight />
            <Stat label="Drawdown Type" value={dd.type} />
            <Stat label="Max Loss" value={dd.amount} />
            <Stat label="Daily Loss (DLL)" value={row.dll ? `$${Number(row.dll).toLocaleString()}` : null} />
            <Stat label="Min Days to Pass" value={row.days_to_pass} />
            <Stat label="Max Contracts" value={row.eval || null} />
            <Stat label="Max Allocation" value={row.max_accounts ? `${row.max_accounts} acct` : null} />
            <Stat label="Max Inactive Days" value={notes.eval_max_inactive ? `${notes.eval_max_inactive} days` : null} />
            <Stat label="Consistency Rule" value={notes.eval_consistency ? `${notes.eval_consistency}%` : null} />
          </div>
        </div>
      ) : (
        /* ── FUNDED PHASE ── */
        <div style={{
          background: 'rgba(16,185,129,0.03)', border: '1px solid rgba(16,185,129,0.1)',
          borderRadius: 14, padding: '1rem 1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.85rem' }}>
            <DollarSign size={14} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Funded Phase
            </span>
          </div>
          <div style={gridStyle}>
            <Stat label="Profit Split" value={row.profit_split} highlight />
            <Stat label="Max Withdrawal" value={fmtPrice(row.max_withdrawal) || row.max_withdrawal} />
            <Stat label="Days to Payout" value={row.days_to_payout ? `${row.days_to_payout} days` : null} />
            <Stat label="Min Trading Days" value={notes.funded_min_days || null} />
            <Stat label="Winning Day (Min $)" value={notes.funded_winning_day ? `$${notes.funded_winning_day}` : null} />
            <Stat label="Max Loss" value={notes.funded_max_loss ? `$${notes.funded_max_loss}` : null} />
            <Stat label="Daily Loss (DLL)" value={notes.funded_dll ? `$${notes.funded_dll}` : null} />
            <Stat label="Max Contracts" value={row.pa || null} />
            <Stat label="Max Allocation" value={notes.funded_max_allocation ? `${notes.funded_max_allocation} acct` : null} />
            <Stat label="Hold Through News" value={notes.funded_hold_news} />
            <Stat label="Max Inactive Days" value={notes.funded_max_inactive ? `${notes.funded_max_inactive} days` : null} />
            <Stat label="Consistency Rule" value={notes.funded_consistency ? `${notes.funded_consistency}%` : null} />
          </div>
        </div>
      )}
    </div>
  );
};


/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function PropFirmDetail() {
  const { firmName } = useParams();
  const navigate = useNavigate();

  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [activeTab, setActiveTab] = useState('challenges');
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pf_favorites') || '[]'); } catch { return []; }
  });

  // Filters
  const [sizeFilter,    setSizeFilter]    = useState('');
  const [plansFilter,   setPlansFilter]   = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [showDiscount,  setShowDiscount]  = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const name = decodeURIComponent(firmName);
    axios.get(`${API}/api/prop-firms/by-name/${encodeURIComponent(name)}`)
      .then(r => {
        const sorted = [...r.data].sort((a, b) => {
          const numA = parseInt((a.plan_size || '').replace(/\D/g, '')) || 0;
          const numB = parseInt((b.plan_size || '').replace(/\D/g, '')) || 0;
          return numA - numB || (a.plan_name || '').localeCompare(b.plan_name || '');
        });
        setRows(sorted);
      })
      .catch(err => {
        console.error('[PropFirmDetail] fetch error:', err);
        setError(err.response?.data?.error || 'Prop firm not found.');
      })
      .finally(() => setLoading(false));
  }, [firmName, API]);

  const firm = rows[0];

  const isFav = firm && favorites.includes(firm.id);
  const toggleFav = useCallback(() => {
    if (!firm) return;
    setFavorites(prev => {
      const next = prev.includes(firm.id) ? prev.filter(x => x !== firm.id) : [...prev, firm.id];
      localStorage.setItem('pf_favorites', JSON.stringify(next));
      return next;
    });
  }, [firm]);

  /* Filter option sets */
  const sizeOptions = useMemo(() =>
    [...new Set(rows.map(r => r.plan_size).filter(Boolean))]
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(v => ({ value: v, label: v })),
    [rows]);

  const plansOptions = useMemo(() =>
    [...new Set(rows.map(r => r.plan_name).filter(Boolean))].map(v => ({ value: v, label: v })),
    [rows]);

  const programOptions = useMemo(() => {
    const seen = new Set();
    rows.forEach(r => { const t = parseNotes(r.notes).plan_type; if (t) seen.add(t); });
    return [...seen].map(v => ({ value: v, label: planTypeLabel(v) }));
  }, [rows]);

  /* Filtered + sorted rows */
  const filteredRows = useMemo(() => rows.filter(r => {
    if (sizeFilter  && r.plan_size !== sizeFilter) return false;
    if (plansFilter && r.plan_name !== plansFilter) return false;
    if (programFilter && parseNotes(r.notes).plan_type !== programFilter) return false;
    return true;
  }), [rows, sizeFilter, plansFilter, programFilter]);

  const hasActiveFilters = sizeFilter || plansFilter || programFilter;

  /* ── Loading / Error ── */
  if (loading) return (
    <div className="container py-16" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: i === 1 ? 120 : 60, borderRadius: 16, background: 'var(--bg-secondary)', animation: 'pulse 1.5s infinite' }} />
      ))}
    </div>
  );

  if (error || !firm) return (
    <div className="container py-16" style={{ textAlign: 'center' }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{error || 'Prop firm not found.'}</p>
      <Link to="/prop-firms" style={{ color: 'var(--accent-secondary)', fontWeight: 700 }}>← Back to Prop Firms</Link>
    </div>
  );

  const sc = statusColors[firm.status_color] || statusColors.green;
  const discountPct = firm.discount_percent ? Number(firm.discount_percent) : 0;

  /* ── TABS ── */
  const tabs = [
    { id: 'challenges', label: `Plans`, count: rows.length },
    { id: 'overview',   label: 'Overview' },
  ];

  return (
    <>
      <SEO
        title={`${firm.name} Challenges & Plans | Robert Trades`}
        description={`Compare all ${firm.name} prop firm challenge plans, account sizes, profit splits, and pricing.`}
        url={`https://roberttrades.com/prop-firms/${encodeURIComponent(firm.name)}`}
      />

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>

        {/* ── Back breadcrumb ── */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => navigate('/prop-firms')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600,
              padding: 0, transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <ChevronLeft size={16} /> Prop Firms
          </button>
        </div>

        {/* ── Firm Header Card ── */}
        <div style={{
          background: 'var(--bg-secondary)', borderRadius: 24,
          border: '1px solid var(--border-color)', overflow: 'hidden',
          marginBottom: '1.5rem',
        }}>
          {/* Top accent bar */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, #10b981, #3b82f6, #3b82f6, #f97316)' }} />

          <div style={{ padding: '1.75rem 2rem', display: 'flex', alignItems: 'flex-start', gap: '1.75rem', flexWrap: 'wrap' }}>
            {/* Logo */}
            {firm.logo_url ? (
              <div style={{
                width: 80, height: 80, borderRadius: 20, overflow: 'hidden',
                background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}>
                <img src={`${API}${firm.logo_url}`} alt={firm.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 10 }} />
              </div>
            ) : (
              <div style={{
                width: 80, height: 80, borderRadius: 20, background: 'var(--bg-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Building2 size={32} style={{ color: 'var(--text-secondary)' }} />
              </div>
            )}

            {/* Name + meta */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
                  {firm.name}
                </h1>
                {firm.status_color && (
                  <span style={{ background: sc.bg, color: sc.color, borderRadius: 99, padding: '3px 12px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {sc.label}
                  </span>
                )}
                {firm.featured && (
                  <span style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316', borderRadius: 99, padding: '3px 12px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    Featured
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                {firm.rating && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, fontSize: '0.9rem', color: Number(firm.rating) >= 4.5 ? '#f59e0b' : '#3b82f6' }}>
                    <Star size={15} fill="currentColor" stroke="currentColor" /> {firm.rating} Trustpilot
                  </span>
                )}
                {firm.website && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                    <Globe size={13} /> {safeHostname(firm.website)}
                  </span>
                )}
                {discountPct > 0 && firm.discount_code && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.83rem', color: '#10b981', fontWeight: 700 }}>
                    <Tag size={13} /> {discountPct}% OFF with code
                  </span>
                )}
              </div>

              {/* Platforms */}
              {firm.platforms?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                  {firm.platforms.map(p => (
                    <Pill key={p} color="var(--text-secondary)" bg="var(--bg-primary)">{p}</Pill>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end', flexShrink: 0 }}>
              <button
                onClick={toggleFav}
                title={isFav ? 'Remove from favorites' : 'Set as Favorite'}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: isFav ? 'rgba(59,130,246,0.12)' : 'var(--bg-primary)',
                  border: `1px solid ${isFav ? 'rgba(59,130,246,0.4)' : 'var(--border-color)'}`,
                  color: isFav ? '#3b82f6' : 'var(--text-secondary)',
                  borderRadius: 99, padding: '8px 16px', fontWeight: 700,
                  fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <Heart size={14} fill={isFav ? '#3b82f6' : 'none'} />
                {isFav ? 'Favorited' : 'Set as Favorite'}
              </button>

              {firm.website && (
                <a
                  href={safeHref(firm.website)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => axios.post(`${API}/api/prop-firms/${firm.id}/click`, { type: 'website' }).catch(() => {})}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))',
                    color: '#fff', borderRadius: 99, padding: '10px 22px',
                    fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none',
                    boxShadow: '0 8px 25px -5px rgba(59,130,246,0.4)',
                  }}
                >
                  Visit Site <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Promo Banner ── */}
        {firm.discount_code && discountPct > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.08))',
            border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20,
            padding: '1.25rem 1.75rem', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                background: 'rgba(16,185,129,0.15)', color: '#10b981',
                borderRadius: 12, padding: '8px 18px', fontWeight: 900,
                fontSize: '1.4rem', letterSpacing: '-0.5px', lineHeight: 1,
              }}>
                {discountPct}% OFF
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Exclusive Discount</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Use code at checkout</div>
              </div>
            </div>
            <CopyBtn code={firm.discount_code} />
          </div>
        )}

        {/* ── Tab Bar ── */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border-color)', paddingBottom: 0,
        }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 20px', fontWeight: 700, fontSize: '0.88rem',
                color: activeTab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === t.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                marginBottom: -1, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {t.label}
              {t.count != null && (
                <span style={{
                  background: activeTab === t.id ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  color: activeTab === t.id ? '#fff' : 'var(--text-secondary)',
                  borderRadius: 99, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 800,
                }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══ CHALLENGES TAB ══ */}
        {activeTab === 'challenges' && (() => {
          /* ── Group rows by plan_name ── */
          const planGroups = {};
          const planOrder = [];
          filteredRows.forEach(row => {
            const key = row.plan_name || '__default__';
            if (!planGroups[key]) { planGroups[key] = []; planOrder.push(key); }
            planGroups[key].push(row);
          });

          /* ── Stat cell helper ── */
          const Stat = ({ label, value, highlight, prefix }) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: highlight ? 'var(--accent-secondary)' : 'var(--text-primary)' }}>
                {prefix && value && value !== '—' ? prefix : ''}{value || '—'}
              </span>
            </div>
          );

          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={18} style={{ color: 'var(--accent-primary)' }} />
                  {firm.name} Plans & Challenges
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>({filteredRows.length})</span>
                </h2>
                <Toggle label="Apply Discount" checked={showDiscount} onChange={setShowDiscount} />
              </div>

              {/* Filter Bar */}
              <div style={{
                display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
                marginBottom: '1.5rem', padding: '1rem 1.25rem',
                background: 'var(--bg-secondary)', borderRadius: 14,
                border: '1px solid var(--border-color)',
              }}>
                <FilterSelect label="Account Size" value={sizeFilter} onChange={setSizeFilter} options={sizeOptions} />
                <FilterSelect label="Plans" value={plansFilter} onChange={setPlansFilter} options={plansOptions} />
                {programOptions.length > 1 && (
                  <FilterSelect label="Program" value={programFilter} onChange={setProgramFilter} options={programOptions} />
                )}
                {hasActiveFilters && (
                  <button
                    onClick={() => { setSizeFilter(''); setPlansFilter(''); setProgramFilter(''); }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)',
                      color: '#f43f5e', borderRadius: 99, padding: '6px 14px',
                      fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    <X size={12} /> Clear filters
                  </button>
                )}
              </div>

              {filteredRows.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  No challenges match the selected filters.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {planOrder.map(planKey => {
                    const planRows = planGroups[planKey];
                    const firstNotes = parseNotes(planRows[0].notes);
                    const badge = planTypeBadge(firstNotes.plan_type);
                    const isDefault = planKey === '__default__';
                    const hasEvalPhase = ['evaluation_funded', 'one_step', 'two_step'].includes(firstNotes.plan_type);

                    return (
                      <div key={planKey} style={{
                        background: 'var(--bg-secondary)', borderRadius: 20,
                        border: '1px solid var(--border-color)', overflow: 'hidden',
                      }}>
                        {/* ── Plan Header ── */}
                        <div style={{
                          padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12,
                          background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)',
                          flexWrap: 'wrap',
                        }}>
                          <Shield size={18} style={{ color: badge.color, flexShrink: 0 }} />
                          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                            {isDefault ? 'General' : planKey}
                          </h3>
                          <span style={{
                            background: badge.bg, color: badge.color,
                            borderRadius: 6, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700,
                          }}>
                            {planTypeLabel(firstNotes.plan_type)}
                          </span>
                          <span style={{
                            background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)',
                            borderRadius: 99, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700,
                          }}>
                            {planRows.length} size{planRows.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* ── Account Size Cards ── */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {planRows.map((row, rIdx) => {
                            const notes = parseNotes(row.notes);
                            const dd = parseDrawdown(row.drawdown_limit);
                            const rawPrice = showDiscount && Number(row.discount_percent) > 0 && row.price
                              ? row.price : (row.without_discount_usd || row.price);
                            const origPrice = showDiscount && Number(row.discount_percent) > 0 ? row.without_discount_usd : null;
                            const hasDisc = showDiscount && Number(row.discount_percent) > 0 && origPrice && origPrice !== rawPrice;

                            return (
                              <SizeRow
                                key={row.id}
                                row={row}
                                notes={notes}
                                dd={dd}
                                rawPrice={rawPrice}
                                origPrice={origPrice}
                                hasDisc={hasDisc}
                                hasEvalPhase={hasEvalPhase}
                                firm={firm}
                                API={API}
                                isLast={rIdx === planRows.length - 1}
                                Stat={Stat}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Discount code footer */}
              {firm.discount_code && (
                <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <Tag size={13} /> Use discount code <CopyBtn code={firm.discount_code} /> at checkout.
                </div>
              )}
            </div>
          );
        })()}

        {/* ══ OVERVIEW TAB ══ */}
        {activeTab === 'overview' && (() => {
          const InfoCard = ({ label, value, highlight }) => value == null || value === '' ? null : (
            <div style={{
              background: highlight ? 'linear-gradient(135deg,rgba(59,130,246,0.06),rgba(37,99,235,0.06))' : 'var(--bg-secondary)',
              padding: '1rem 1.25rem', borderRadius: 16,
              border: `1px solid ${highlight ? 'rgba(59,130,246,0.2)' : 'var(--border-color)'}`,
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: highlight ? 'var(--accent-secondary)' : 'var(--text-primary)', lineHeight: 1.2 }}>
                {value === true ? 'Yes' : value === false ? 'No' : value}
              </div>
            </div>
          );

          // Group rows by plan
          const planGroups = {};
          const planOrder = [];
          rows.forEach(row => {
            const key = row.plan_name || '__default__';
            if (!planGroups[key]) { planGroups[key] = []; planOrder.push(key); }
            planGroups[key].push(row);
          });

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

              {/* ── Firm Info ── */}
              <section>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  <Building2 size={18} style={{ color: 'var(--accent-primary)' }} /> Firm Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <InfoCard label="Trustpilot Rating" value={firm.rating ? `${firm.rating} / 5.0` : null} highlight />
                  {firm.website && (
                    <div style={{ background: 'var(--bg-secondary)', padding: '1rem 1.25rem', borderRadius: 16, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Website</div>
                      <a href={safeHref(firm.website)} target="_blank" rel="noreferrer" style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                        {safeHostname(firm.website)} <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                  <InfoCard label="Discount Code" value={firm.discount_code} highlight />
                  <InfoCard label="Account Category" value={firm.account_category} />
                </div>
              </section>

              {/* ── Platforms ── */}
              {firm.platforms?.length > 0 && (
                <section>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>
                    <Globe size={18} style={{ color: 'var(--accent-primary)' }} /> Supported Platforms
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {firm.platforms.map(p => (
                      <span key={p} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '6px 16px', fontWeight: 700, fontSize: '0.82rem' }}>{p}</span>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Features ── */}
              <section>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>
                  <Wrench size={18} style={{ color: 'var(--accent-primary)' }} /> Feature Support
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {[
                    { key: 'buffer', label: firm.buffer_amount ? `Buffer (${firm.buffer_amount})` : 'Buffer' },
                    { key: 'copy_trade', label: 'Copy Trading' },
                    { key: 'vpn', label: 'VPN Allowed' },
                    { key: 'dca', label: 'DCA Strategy' },
                    { key: 'news', label: 'News Trading' },
                    { key: 'bots', label: 'Trading Bots' },
                    { key: 'micro_scalping', label: 'Micro Scalping' },
                  ].map(({ key, label }) => (
                    <FeatureBadge key={key} label={label} enabled={firm[key]} />
                  ))}
                </div>
              </section>

              {/* ── ALL PLANS ── */}
              <section>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>
                  <Shield size={18} style={{ color: 'var(--accent-primary)' }} /> Plans Overview
                  <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)' }}>({planOrder.length} plan{planOrder.length !== 1 ? 's' : ''})</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {planOrder.map(planKey => {
                    const planRows = planGroups[planKey];
                    const firstNotes = parseNotes(planRows[0].notes);
                    const badge = planTypeBadge(firstNotes.plan_type);
                    const isDefault = planKey === '__default__';
                    const hasEval = ['evaluation_funded', 'one_step', 'two_step'].includes(firstNotes.plan_type);

                    return (
                      <div key={planKey} style={{
                        background: 'var(--bg-secondary)', borderRadius: 18,
                        border: '1px solid var(--border-color)', overflow: 'hidden',
                      }}>
                        {/* Plan header */}
                        <div style={{
                          padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: 10,
                          background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap',
                        }}>
                          <Shield size={16} style={{ color: badge.color }} />
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            {isDefault ? 'Default Plan' : planKey}
                          </span>
                          <span style={{ background: badge.bg, color: badge.color, borderRadius: 6, padding: '2px 9px', fontSize: '0.7rem', fontWeight: 700 }}>
                            {planTypeLabel(firstNotes.plan_type)}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {planRows.length} size{planRows.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Sizes summary table */}
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                {['Size', 'Price', 'Activation', hasEval && 'Profit Target', hasEval && 'Drawdown', 'Profit Split', 'Payout'].filter(Boolean).map(h => (
                                  <th key={h} style={{ padding: '8px 14px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {planRows.map((row, idx) => {
                                const notes = parseNotes(row.notes);
                                const dd = parseDrawdown(row.drawdown_limit);
                                return (
                                  <tr key={row.id} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 900, fontSize: '0.9rem', color: 'var(--accent-secondary)' }}>{row.plan_size || '—'}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem' }}>{fmtPrice(row.price) || fmtPrice(row.without_discount_usd) || '—'}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600 }}>{row.activation_fee != null && row.activation_fee !== '' ? (Number(row.activation_fee) === 0 ? 'Free' : `$${Number(row.activation_fee).toLocaleString()}`) : '—'}</td>
                                    {hasEval && <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600 }}>{row.profit_target ? `$${Number(row.profit_target).toLocaleString()}` : '—'}</td>}
                                    {hasEval && <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600 }}>{dd.type !== '—' ? `${dd.type} ${dd.amount}` : '—'}</td>}
                                    <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>{row.profit_split || '—'}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600 }}>{row.days_to_payout ? `${row.days_to_payout} days` : '—'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

            </div>
          );
        })()}
      </div>
    </>
  );
}
