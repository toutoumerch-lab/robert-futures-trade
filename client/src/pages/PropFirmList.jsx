import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card from '../components/common/Card';

const ScoreBar = ({ label, value, max = 100 }) => (
  <div className="score-bar-wrap">
    <div className="flex justify-between mb-1">
      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{value}</span>
    </div>
    <div className="score-bar-bg">
      <div className="score-bar-fill" style={{ width: `${Math.min((parseFloat(value) / max) * 100, 100)}%` }} />
    </div>
  </div>
);

const PropFirmList = () => {
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('name');

  useEffect(() => {
    axios.get('http://localhost:5000/api/prop-firms')
      .then(res => setFirms(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...firms].sort((a, b) => {
    // We map backend data to sorting variables since database column names changed
    const aCost = Number(a.activation_fee || a.fifty_k_initial_cost || 0);
    const bCost = Number(b.activation_fee || b.fifty_k_initial_cost || 0);
    
    if (sort === 'cost') return aCost - bCost;
    return a.name.localeCompare(b.name);
  });

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
        {/* Sort Bar */}
        {!loading && firms.length > 0 && (
          <div className="flex items-center gap-4 mb-8">
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sort by:</span>
            {[['name', 'Name'], ['cost', 'Lowest Cost']].map(([val, label]) => (
              <button
                key={val}
                className={`sort-btn ${sort === val ? 'active' : ''}`}
                onClick={() => setSort(val)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="loading-state">Loading prop firms…</div>
        ) : firms.length === 0 ? (
          <div className="empty-state-page">
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏦</p>
            <h3 className="mb-2">Reviews Coming Soon</h3>
            <p style={{ color: 'var(--text-secondary)' }}>We're working on in-depth prop firm reviews. Stay tuned.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sorted.map(firm => (
              <Card key={firm.id} className="firm-card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    {firm.logo_url && (
                      <div style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                        <img src={`http://localhost:5000${firm.logo_url}`} alt={firm.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                      </div>
                    )}
                    <div>
                      <h3 className="text-gradient" style={{ fontSize: '1.4rem', margin: 0, fontWeight: 700 }}>{firm.name}</h3>
                      {firm.featured && <span className="text-yellow-500 text-xs font-semibold mt-1 block tracking-wide">⭐ FEATURED</span>}
                    </div>
                  </div>
                  
                  {/* Discount Code Badge */}
                  {firm.discount_code && (
                    <div className="flex flex-col items-end">
                      <button 
                        onClick={(e) => { 
                          navigator.clipboard.writeText(firm.discount_code); 
                          const btn = e.currentTarget; 
                          const originalHtml = btn.innerHTML; 
                          btn.innerHTML = 'Copied! ✅'; 
                          setTimeout(() => { btn.innerHTML = originalHtml; }, 1500); 
                        }}
                        className="badge" 
                        style={{ cursor: 'pointer', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700, letterSpacing: '0.5px', transition: 'transform 0.1s' }}
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        title="Click to Copy Promo Code"
                      >
                        Code: {firm.discount_code} 📋
                      </button>
                    </div>
                  )}
                </div>
                {firm.notes && (
                  <p className="mb-6" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {firm.notes.length > 150 ? firm.notes.substring(0, 150) + "..." : firm.notes}
                  </p>
                )}

                <div className="firm-stats-grid mb-6">
                  <div className="firm-stat">
                    <div className="firm-stat-label">Trustpilot</div>
                    <div className="firm-stat-value" style={{ color: firm.rating >= 4.5 ? 'var(--success)' : firm.rating >= 4.0 ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                      {firm.rating ? `⭐ ${firm.rating}` : 'N/A'}
                    </div>
                  </div>

                  <div className="firm-stat">
                    <div className="firm-stat-label">Activation Fee</div>
                    <div className="firm-stat-value">{firm.activation_fee ? `$${firm.activation_fee}` : 'None'}</div>
                  </div>
                  <div className="firm-stat" style={firm.discount_usd ? { background: 'rgba(236, 72, 153, 0.05)', border: '1px solid rgba(236, 72, 153, 0.2)' } : {}}>
                    <div className="firm-stat-label">Initial Cost</div>
                    <div className="firm-stat-value">
                      {firm.discount_usd ? (
                         <div className="flex flex-col">
                           <span style={{ color: 'var(--accent-tertiary)', fontWeight: 800, fontSize: '1.25rem' }}>${firm.discount_usd}</span>
                           <div className="flex items-center gap-2 mt-1">
                             <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>${firm.without_discount_usd}</span>
                             {firm.discount_percent && <span style={{ background: 'var(--accent-tertiary)', color: '#fff', fontSize: '0.7rem', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: 700 }}>-{firm.discount_percent}%</span>}
                           </div>
                         </div>
                      ) : (
                         <span style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                           {firm.activation_fee ? `$${firm.activation_fee}` : firm.fifty_k_initial_cost ? `$${firm.fifty_k_initial_cost}` : 'N/A'}
                         </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-4 items-center justify-between border-t pt-5" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex gap-3">
                    {firm.discord && (
                      <a href={firm.discord} target="_blank" rel="noreferrer" className="badge" style={{ color: '#5865F2', background: 'rgba(88, 101, 242, 0.1)', textDecoration: 'none', border: '1px solid rgba(88, 101, 242, 0.3)', fontWeight: 600 }}>
                        💬 Discord
                      </a>
                    )}
                  </div>
                  {firm.website && (
                    <a href={firm.website} target="_blank" rel="noreferrer" 
                       style={{ background: 'linear-gradient(135deg, var(--accent-pink), var(--accent-purple))', color: '#fff', padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)', transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                       onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(236, 72, 153, 0.4)'; }}
                       onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(236, 72, 153, 0.3)'; }}
                    >
                      Visit Website 🚀
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropFirmList;
