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
    if (sort === 'allocation') return b.max_allocation - a.max_allocation;
    if (sort === 'cost') return a.cost - b.cost;
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
            {[['name', 'Name'], ['allocation', 'Max Allocation'], ['cost', 'Lowest Cost']].map(([val, label]) => (
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
                  <h3 className="text-gradient" style={{ fontSize: '1.3rem' }}>{firm.name}</h3>
                  <span className="badge badge-user">Reviewed</span>
                </div>
                <p className="mb-6" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {firm.description}
                </p>

                <div className="firm-stats-grid mb-6">
                  <div className="firm-stat">
                    <div className="firm-stat-label">Max Allocation</div>
                    <div className="firm-stat-value">${Number(firm.max_allocation).toLocaleString()}</div>
                  </div>
                  <div className="firm-stat">
                    <div className="firm-stat-label">Profit Split</div>
                    <div className="firm-stat-value" style={{ color: 'var(--success)' }}>{firm.profit_split}</div>
                  </div>
                  <div className="firm-stat">
                    <div className="firm-stat-label">Eval Cost</div>
                    <div className="firm-stat-value" style={{ color: 'var(--accent-tertiary)' }}>${firm.cost}</div>
                  </div>
                </div>

                <ScoreBar label="Profit Split Score" value={parseFloat(firm.profit_split)} max={100} />

                <div className="mt-4">
                  <a href="#" style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>
                    Read Full Review →
                  </a>
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
