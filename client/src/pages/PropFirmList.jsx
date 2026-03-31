import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import Card from '../components/common/Card';

const StatBox = ({ label, value, highlight, large }) => {
  if (value == null || value === '' || value === false) return null;
  return (
    <div style={{ 
      background: highlight ? 'linear-gradient(135deg, rgba(236,72,153,0.05), rgba(168,85,247,0.05))' : 'var(--bg-secondary)', 
      padding: large ? '1.5rem' : '1.25rem', 
      borderRadius: '24px', 
      border: 'none', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      gap: '0.4rem',
      boxShadow: highlight ? '0 15px 35px -5px rgba(236,72,153,0.1)' : '0 8px 25px -5px rgba(0,0,0,0.03)',
      transition: 'transform 0.2s ease-out'
    }} className="hover:-translate-y-1">
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: large ? '1.75rem' : '1.25rem', fontWeight: 900, color: highlight ? 'var(--accent-purple)' : 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.5px' }}>{value === true ? 'Yes' : value}</span>
    </div>
  );
};

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
  const [viewingFirm, setViewingFirm] = useState(null);

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
              <Card 
                key={firm.id} 
                className="firm-card hover:shadow-xl transition-shadow" 
                style={{ cursor: 'pointer', position: 'relative' }} 
                onClick={() => setViewingFirm(firm)}
              >
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
                          e.stopPropagation();
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
                  <div className="firm-stat" style={firm.discount_usd ? { background: 'linear-gradient(135deg, rgba(236,72,153,0.05), rgba(168,85,247,0.05))', border: '1px solid rgba(236,72,153,0.15)' } : {}}>
                    <div className="firm-stat-label">Initial Cost</div>
                    <div className="firm-stat-value" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      {firm.discount_usd ? (
                         <>
                           <span style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.5px', lineHeight: 1 }}>${firm.discount_usd}</span>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                             <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>${firm.without_discount_usd}</span>
                             {firm.discount_percent && <span style={{ background: 'var(--accent-pink)', color: '#fff', fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 800, boxShadow: '0 2px 5px rgba(236,72,153,0.3)' }}>-{firm.discount_percent}%</span>}
                           </div>
                         </>
                      ) : (
                         <span style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800 }}>
                           {firm.activation_fee ? `$${firm.activation_fee}` : firm.fifty_k_initial_cost ? `$${firm.fifty_k_initial_cost}` : 'N/A'}
                         </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-4 items-center justify-between border-t pt-5" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex gap-3">
                    {firm.discord && (
                      <a href={firm.discord} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="badge" style={{ color: '#5865F2', background: 'rgba(88, 101, 242, 0.1)', textDecoration: 'none', border: '1px solid rgba(88, 101, 242, 0.3)', fontWeight: 600 }}>
                        💬 Discord
                      </a>
                    )}
                  </div>
                  {firm.website && (
                    <a href={firm.website} target="_blank" rel="noreferrer" 
                       onClick={e => e.stopPropagation()}
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

      {viewingFirm && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', pointerEvents: 'auto', animation: 'fadeIn 0.2s ease-out' }} onClick={() => setViewingFirm(null)}>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
            .modal-content-glass::-webkit-scrollbar { width: 0px; }
          `}</style>
          
          <div className="modal-content-glass" style={{ background: 'var(--bg-primary)', width: '100%', maxWidth: '950px', maxHeight: '90vh', borderRadius: '32px', overflowY: 'auto', border: 'none', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)', cursor: 'auto', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} onClick={e => e.stopPropagation()}>
            
            {/* Super Clean Sticky Header */}
            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(var(--bg-primary-rgb), 0.85)', backdropFilter: 'blur(24px)' }}>
               {/* Ambient Glow Line */}
               <div style={{ height: '4px', background: 'linear-gradient(90deg, #10b981, #3b82f6, #ec4899, #f97316)', width: '100%', opacity: 0.8 }} />
               
               <div style={{ padding: '2rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
                    {viewingFirm.logo_url && (
                      <div style={{ width: '80px', height: '80px', borderRadius: '24px', overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
                        <img src={`http://localhost:5000${viewingFirm.logo_url}`} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }} />
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <h2 style={{ fontSize: '2.8rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)', letterSpacing: '-1px', lineHeight: 1 }}>{viewingFirm.name}</h2>
                      <div className="flex items-center gap-4 mt-2">
                        {viewingFirm.rating && <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#f59e0b' }}>★</span> {viewingFirm.rating} Trust Score</span>}
                        {viewingFirm.featured && <span style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(249,115,22,0.1))', color: '#f97316', padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Featured</span>}
                      </div>
                    </div>
                 </div>
                 
                 <div className="flex flex-col items-end gap-3">
                   <button onClick={() => setViewingFirm(null)} style={{ background: 'var(--bg-secondary)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', fontSize: '1.2rem' }} className="hover:bg-red-500 hover:text-white hover:shadow-lg">✕</button>
                   {viewingFirm.website && (
                      <a href={viewingFirm.website} target="_blank" rel="noreferrer" 
                         style={{ background: 'linear-gradient(135deg, var(--accent-pink), var(--accent-purple))', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '99px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 25px -5px rgba(236, 72, 153, 0.4)', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}
                         className="hover:shadow-[0_12px_30px_-5px_rgba(236,72,153,0.6)] hover:-translate-y-1"
                      >
                        Visit Official Site 🚀
                      </a>
                   )}
                 </div>
               </div>
            </div>

            <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '4rem' }}>
                
                {/* 1. Basic Information */}
                <div>
                   <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                     🏢 Basic Information
                   </h4>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                     
                     <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '20px', display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Account Category</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800 }}>{viewingFirm.account_category || '-'}</span>
                     </div>
                     
                     <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '20px', display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Trustpilot Rating</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800 }}>⭐ {viewingFirm.rating ? `${viewingFirm.rating} / 5` : '-'}</span>
                     </div>

                     <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '20px', display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Supported Platforms</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {(viewingFirm.platforms && viewingFirm.platforms.length > 0) ? viewingFirm.platforms.map(p => (
                               <span key={p} style={{ background: 'var(--bg-primary)', padding: '0.6rem 1.2rem', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 700, border: '1px solid var(--border)', color: 'var(--text-primary)', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>{p}</span>
                          )) : <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>No platforms listed</span>}
                        </div>
                     </div>
                   </div>
                </div>

                {/* 2. Pricing Details */}
                <div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
                     <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>
                       💲 Pricing Details
                     </h4>
                     {viewingFirm.discount_code && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(viewingFirm.discount_code);
                            const btn = e.currentTarget;
                            const originalHtml = btn.innerHTML;
                            btn.innerHTML = '<span style="font-size: 15px;">Copied! ✅</span>';
                            setTimeout(() => { btn.innerHTML = originalHtml; }, 1500);
                          }}
                          style={{ cursor: 'pointer', background: 'linear-gradient(90deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.2)', padding: '0.4rem 1.25rem', borderRadius: '99px', color: '#10b981', fontWeight: 800, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                          className="hover:-translate-y-1 hover:shadow-lg"
                          title="Copy Promo Code"
                        >
                           <span style={{ fontSize: '18px' }}>🎟️</span> Use Code: <span style={{ color: 'var(--text-primary)' }}>{viewingFirm.discount_code}</span>
                        </button>
                     )}
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                     <StatBox label="Activation Fee" value={viewingFirm.activation_fee != null && viewingFirm.activation_fee !== '' ? `$${viewingFirm.activation_fee}` : '-'} />
                     <StatBox label="Reset Fee" value={viewingFirm.reset_fee != null && viewingFirm.reset_fee !== '' ? `$${viewingFirm.reset_fee}` : '-'} />
                     <StatBox label="50K All In" value={viewingFirm.fifty_k_all_in != null && viewingFirm.fifty_k_all_in !== '' ? `$${viewingFirm.fifty_k_all_in}` : '-'} />
                     <StatBox label="50K Initial Cost" value={viewingFirm.fifty_k_initial_cost != null && viewingFirm.fifty_k_initial_cost !== '' ? `$${viewingFirm.fifty_k_initial_cost}` : '-'} />
                     <StatBox label="Without Discount" value={viewingFirm.without_discount_usd != null && viewingFirm.without_discount_usd !== '' ? `$${viewingFirm.without_discount_usd}` : '-'} />
                     <StatBox label="Discount Applied" value={viewingFirm.discount_usd != null && viewingFirm.discount_usd !== '' ? `$${viewingFirm.discount_usd} ${viewingFirm.discount_percent ? '('+viewingFirm.discount_percent+'%)' : ''}` : '-'} highlight />
                   </div>
                </div>

                {/* 3. Trading Rules & Metrics */}
                <div>
                   <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                     ⚙️ Trading Rules & Metrics
                   </h4>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                     <StatBox label="Profit Target" value={viewingFirm.profit_target} />
                     <StatBox label="Profit Split" value={viewingFirm.profit_split} highlight />
                     <StatBox label="Daily Loss Limit (DLL)" value={viewingFirm.dll} />
                     <StatBox label="Max Withdrawal" value={viewingFirm.max_withdrawal} />
                     <StatBox label="Drawdown & Amt" value={viewingFirm.drawdown_limit} />
                     <StatBox label="Days to Pass" value={viewingFirm.days_to_pass} />
                     <StatBox label="Days to Payout" value={viewingFirm.days_to_payout} />
                     <StatBox label="Eval (%)" value={viewingFirm.eval} />
                     <StatBox label="PA (%)" value={viewingFirm.pa} />
                     <StatBox label="Max Accounts" value={viewingFirm.max_accounts} />
                   </div>
                </div>

                {/* 4. Feature Support */}
                <div style={{ paddingBottom: '0.5rem' }}>
                   <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                     🔧 Feature Support
                   </h4>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                      {['buffer', 'copy_trade', 'vpn', 'dca', 'news', 'bots', 'micro_scalping'].map(feat => (
                         <span key={feat} style={{ 
                           padding: '0.6rem 1.2rem', 
                           background: viewingFirm[feat] ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary)', 
                           color: viewingFirm[feat] ? '#10b981' : 'var(--text-secondary)', 
                           borderRadius: '12px', 
                           fontSize: '13px', 
                           fontWeight: 700, 
                           border: viewingFirm[feat] ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border)'
                         }}>
                           {viewingFirm[feat] ? '✓' : '✗'} {feat.replace('_', ' ').toUpperCase()}
                         </span>
                      ))}
                   </div>
                </div>
                
                {/* 4. Notes Context */}
                {viewingFirm.notes && (
                  <div style={{ padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '24px', fontSize: '16px', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.1rem', letterSpacing: '-0.5px', fontWeight: 800 }}>
                       <span style={{ fontSize: '20px' }}>📝</span> Author Notes
                    </strong>
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
