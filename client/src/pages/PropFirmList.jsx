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
                      <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <img src={`http://localhost:5000${firm.logo_url}`} alt={firm.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                    <h3 className="text-gradient" style={{ fontSize: '1.3rem', margin: 0 }}>{firm.name}</h3>
                  </div>
                  {firm.featured && <span className="badge badge-user" style={{ background: 'var(--accent)', color: '#fff', border: 'none' }}>Featured</span>}
                </div>
                {firm.notes && (
                  <p className="mb-6" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {firm.notes.length > 150 ? firm.notes.substring(0, 150) + "..." : firm.notes}
                  </p>
                )}

                <div className="firm-stats-grid mb-6">
                  <div className="firm-stat">
                    <div className="firm-stat-label">Max Funding</div>
                    <div className="firm-stat-value">{firm.max_accounts || 'Varied'}</div>
                  </div>
                  <div className="firm-stat">
                    <div className="firm-stat-label">Profit Split</div>
                    <div className="firm-stat-value" style={{ color: 'var(--success)' }}>{firm.profit_split || '-'}</div>
                  </div>
                  <div className="firm-stat">
                    <div className="firm-stat-label">Initial Cost</div>
                    <div className="firm-stat-value" style={{ color: 'var(--accent-tertiary)' }}>
                       {firm.activation_fee ? `$${firm.activation_fee}` : firm.fifty_k_initial_cost ? `$${firm.fifty_k_initial_cost}` : '-'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-4">
                  {firm.website && (
                    <a href={firm.website} target="_blank" rel="noreferrer" className="badge" style={{ color: '#fff', background: 'rgba(255,255,255,0.05)', textDecoration: 'none' }}>
                      🔗 Visit Website
                    </a>
                  )}
                  {firm.discord && (
                    <a href={firm.discord} target="_blank" rel="noreferrer" className="badge" style={{ color: '#fff', background: 'rgba(88, 101, 242, 0.2)', textDecoration: 'none' }}>
                      💬 Discord
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
