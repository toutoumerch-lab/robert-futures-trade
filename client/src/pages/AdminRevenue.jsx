import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowLeft, DollarSign, BarChart3, Users, TrendingUp, Loader, Info } from 'lucide-react';

const AdminRevenue = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    axios.get('http://localhost:5000/api/admin/revenue', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setData(res.data))
    .catch(err => {
      console.error('Failed fetching revenue:', err);
    })
    .finally(() => setLoading(false));
  }, [user, token, navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size={48} className="spin-animation" style={{ color: '#3b82f6', marginBottom: '1rem' }} />
        <h3 style={{ color: 'var(--text-secondary)' }}>Loading Revenue Engine...</h3>
      </div>
    );
  }

  if (!data) return <div style={{ padding: '4rem', textAlign: 'center', color: '#ef4444' }}>Error loading data.</div>;

  return (
    <div style={{ padding: '2rem 5%', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <button 
            onClick={() => navigate('/admin')} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, padding: 0, marginBottom: '0.5rem' }}
          >
            <ArrowLeft size={16} /> Back to Admin
          </button>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px', margin: 0 }}>Revenue Dashboard</h1>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', padding: '1.5rem', border: '1px solid var(--border)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Revenue</h3>
            <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '14px' }}>
              <DollarSign size={24} />
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
            ${data.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', padding: '1.5rem', border: '1px solid var(--border)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Sales</h3>
            <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '14px' }}>
              <BarChart3 size={24} />
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
            {data.totalSales}
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', padding: '1.5rem', border: '1px solid var(--border)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Avg Order Value</h3>
              <div title="Calculated as: Total Revenue ÷ Total Sales" style={{ display: 'flex', alignItems: 'center', cursor: 'help', color: 'var(--text-secondary)' }}>
                <Info size={14} />
              </div>
            </div>
            <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '14px' }}>
              <TrendingUp size={24} />
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
            ${data.averageOrderValue}
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', padding: '1.5rem', border: '1px solid var(--border)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Buyers</h3>
            <div style={{ padding: '10px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', borderRadius: '14px' }}>
              <Users size={24} />
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
            {data.activeUsers}
          </div>
        </div>
      </div>

      {/* Charts Array */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        
        {/* Line Chart */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', padding: '2rem', border: '1px solid var(--border)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>Revenue Over Time</h3>
          {data.revenueByDate.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.revenueByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <RechartsTooltip 
                  contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 600, color: 'var(--text-primary)' }}
                  formatter={(val) => [`$${val}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" fill="#3b82f6" fillOpacity={0.1} stroke="#3b82f6" strokeWidth={4} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No temporal data available.</div>
          )}
        </div>

        {/* Bar Chart */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', padding: '2rem', border: '1px solid var(--border)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>Sales by Course</h3>
          {data.revenueByCourse.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.revenueByCourse}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.split(' ')[0] + '...'} />
                <YAxis yAxisId="left" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 600, color: 'var(--text-primary)' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                <Bar yAxisId="right" dataKey="sales" name="Sales (Volume)" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No course sales available.</div>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>Recent Transactions</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '1rem 2rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>User</th>
                <th style={{ padding: '1rem 2rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Course</th>
                <th style={{ padding: '1rem 2rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Amount</th>
                <th style={{ padding: '1rem 2rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSales.length > 0 ? data.recentSales.map(sale => (
                <tr key={sale.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem 2rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{sale.user_name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{sale.user_email}</div>
                  </td>
                  <td style={{ padding: '1rem 2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{sale.course_title}</td>
                  <td style={{ padding: '1rem 2rem' }}>
                    <span style={{ display: 'inline-block', padding: '4px 10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px', fontWeight: 800, fontSize: '0.9rem' }}>
                      ${parseFloat(sale.amount).toFixed(2)}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 2rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    {new Date(sale.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No transactions recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default AdminRevenue;
