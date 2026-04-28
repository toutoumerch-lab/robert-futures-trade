/**
 * AdminAnalytics.jsx
 * Full interactive analytics dashboard for admin.
 * Sections: Overview KPIs, Revenue, Enrollments, Courses drill-down,
 *           Users table, Activity feed, AI Insights.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, BookOpen, DollarSign,
  Activity, BarChart2, Zap, ArrowLeft, RefreshCw,
  Search, ChevronLeft, ChevronRight, Award, AlertTriangle,
  CheckCircle, Info, Filter, Eye, Clock, Building2, ExternalLink, MousePointer2, Star, Globe,
} from 'lucide-react';

/* ─── constants ─────────────────────────────────────────────── */
const API = 'http://localhost:5000/api/admin/analytics';
const RANGES = [
  { label: '7 days',  value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: '1 year',  value: '1y' },
  { label: 'All time',value: 'all' },
];
const CHART_COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#ec4899','#84cc16'];
const GRID_STROKE = 'rgba(255,255,255,0.05)';
const AXIS_STYLE  = { fontSize: 11, fill: 'var(--text-secondary)' };
const TOOLTIP_STYLE = {
  contentStyle: { background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '13px', fontWeight: 600 },
  itemStyle: { color: 'var(--text-primary)' },
};
const easing = [0.16, 1, 0.3, 1];

/* ─── tiny helpers ───────────────────────────────────────────── */
const fmt$  = n => `$${Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtN  = n => Number(n||0).toLocaleString();
const ago   = ts => {
  const s = Math.floor((Date.now()-new Date(ts))/1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600)return `${Math.floor(s/60)}m ago`;
  if (s < 86400)return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

/* ─── sub-components ─────────────────────────────────────────── */

// Animated KPI card
const KPICard = ({ icon: Icon, label, value, change, color, prefix='', loading }) => {
  const up = change >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--bg-secondary)', borderRadius: '20px',
        padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden',
      }}
    >
      {/* glow accent */}
      <div style={{ position:'absolute', top:0, right:0, width:'120px', height:'120px',
        borderRadius:'50%', background: `${color}15`, transform:'translate(30%,-30%)', pointerEvents:'none' }} />

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
        <span style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
        <div style={{ padding:'9px', background:`${color}18`, borderRadius:'12px', color }}>
          <Icon size={18} />
        </div>
      </div>

      {loading ? (
        <div style={{ height:'40px', background:'rgba(255,255,255,0.06)', borderRadius:'8px', animation:'pulse 1.5s infinite' }} />
      ) : (
        <>
          <div style={{ fontSize:'2.2rem', fontWeight:900, color:'var(--text-primary)', letterSpacing:'-1.5px', lineHeight:1 }}>
            {prefix}{typeof value==='number' ? fmtN(value) : value}
          </div>
          {change !== undefined && (
            <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'0.6rem', fontSize:'0.82rem', fontWeight:700, color: up?'#10b981':'#ef4444' }}>
              {up ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}
              {Math.abs(change)}% vs prev period
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

// Section wrapper
const Section = ({ title, subtitle, action, children, style={} }) => (
  <div style={{ background:'var(--bg-secondary)', borderRadius:'20px', border:'1px solid rgba(255,255,255,0.07)', overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,0.2)', ...style }}>
    <div style={{ padding:'1.25rem 1.75rem', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <div>
        <h3 style={{ margin:0, fontSize:'1rem', fontWeight:800, color:'var(--text-primary)', letterSpacing:'-0.3px' }}>{title}</h3>
        {subtitle && <p style={{ margin:'2px 0 0', fontSize:'0.78rem', color:'var(--text-secondary)' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
    <div style={{ padding:'1.5rem' }}>{children}</div>
  </div>
);

// Pill tabs
const Tabs = ({ tabs, active, onChange }) => (
  <div style={{ display:'flex', background:'rgba(255,255,255,0.04)', borderRadius:'12px', padding:'4px', gap:'2px' }}>
    {tabs.map(t => (
      <button key={t.value} onClick={() => onChange(t.value)}
        style={{
          padding:'6px 14px', borderRadius:'9px', border:'none', cursor:'pointer',
          fontFamily:'var(--font-sans)', fontWeight:700, fontSize:'0.82rem',
          background: active===t.value ? 'rgba(59,130,246,0.2)' : 'transparent',
          color: active===t.value ? '#60a5fa' : 'var(--text-secondary)',
          transition:'all 0.2s',
        }}
      >{t.label}</button>
    ))}
  </div>
);

// Custom recharts tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#0d1117', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', padding:'10px 14px', fontSize:'13px' }}>
      <p style={{ margin:'0 0 6px', color:'var(--text-secondary)', fontWeight:600 }}>{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{ margin:'2px 0', color:p.color, fontWeight:700 }}>
          {p.name}: {p.name.toLowerCase().includes('revenue') || p.name.toLowerCase().includes('$') ? fmt$(p.value) : fmtN(p.value)}
        </p>
      ))}
    </div>
  );
};

// Progress bar row
const ProgressRow = ({ label, value, max, color='#3b82f6', suffix='%' }) => {
  const pct = max > 0 ? Math.min((value/max)*100, 100) : 0;
  return (
    <div style={{ marginBottom:'0.85rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
        <span style={{ fontSize:'0.82rem', color:'var(--text-secondary)', fontWeight:600 }}>{label}</span>
        <span style={{ fontSize:'0.82rem', color:'var(--text-primary)', fontWeight:800 }}>{value}{suffix}</span>
      </div>
      <div style={{ height:'6px', background:'rgba(255,255,255,0.06)', borderRadius:'3px', overflow:'hidden' }}>
        <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:0.8, ease:easing }}
          style={{ height:'100%', background:color, borderRadius:'3px' }} />
      </div>
    </div>
  );
};

// Insight card
const InsightCard = ({ insight }) => {
  const map = {
    warning:     { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
    success:     { icon: CheckCircle,   color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
    opportunity: { icon: Zap,           color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)' },
    info:        { icon: Info,          color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
  };
  const { icon: Icon, color, bg, border } = map[insight.type] || map.info;
  return (
    <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
      style={{ background:bg, border:`1px solid ${border}`, borderRadius:'16px', padding:'1.1rem 1.25rem', marginBottom:'0.85rem', display:'flex', gap:'1rem' }}
    >
      <div style={{ flexShrink:0, width:'34px', height:'34px', borderRadius:'10px', background:`${color}20`, display:'flex', alignItems:'center', justifyContent:'center', color }}>
        <Icon size={16} />
      </div>
      <div style={{ flex:1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'4px' }}>
          <span style={{ fontSize:'0.9rem', fontWeight:800, color:'var(--text-primary)' }}>{insight.title}</span>
          <span style={{ fontSize:'0.72rem', fontWeight:800, color, background:`${color}15`, padding:'2px 8px', borderRadius:'6px', flexShrink:0, marginLeft:'8px' }}>{insight.metric}</span>
        </div>
        <p style={{ margin:0, fontSize:'0.82rem', color:'var(--text-secondary)', lineHeight:1.6 }}>{insight.body}</p>
      </div>
    </motion.div>
  );
};

// Activity event
const ActivityEvent = ({ event }) => {
  const map = {
    enrollment: { icon: BookOpen, color:'#3b82f6', label:'Enrolled in' },
    payment:    { icon: DollarSign, color:'#10b981', label:'Purchased' },
    signup:     { icon: Users, color:'#8b5cf6', label:'Signed up:' },
  };
  const { icon: Icon, color, label } = map[event.type] || map.enrollment;
  return (
    <div style={{ display:'flex', gap:'0.85rem', alignItems:'flex-start', padding:'0.6rem 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0 }}>
        <Icon size={13} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ margin:0, fontSize:'0.82rem', color:'var(--text-primary)', fontWeight:600 }}>
          <span style={{ color }}>{event.actor}</span>{' '}
          <span style={{ color:'var(--text-secondary)', fontWeight:400 }}>{label}</span>{' '}
          <span>{event.subject}</span>
          {event.amount !== undefined && <span style={{ color:'#10b981', fontWeight:800 }}> · {fmt$(event.amount)}</span>}
        </p>
        <p style={{ margin:'2px 0 0', fontSize:'0.72rem', color:'var(--text-secondary)' }}>{ago(event.ts)}</p>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   Main Dashboard Component
   ══════════════════════════════════════════════════════════════ */
export default function AdminAnalytics() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [range, setRange]             = useState('30d');
  const [activeTab, setActiveTab]     = useState('overview'); // overview|courses|users|activity|insights|countries
  const [overview, setOverview]       = useState(null);
  const [courses, setCourses]         = useState(null);
  const [users, setUsers]             = useState(null);
  const [activity, setActivity]       = useState(null);
  const [insights, setInsights]       = useState(null);
  const [propFirms, setPropFirms]     = useState(null);
  const [countries, setCountries]     = useState(null);
  const [drillCourse, setDrillCourse] = useState(null);
  const [userSearch, setUserSearch]   = useState('');
  const [userPage, setUserPage]       = useState(1);
  const [loading, setLoading]         = useState({});
  const [chartType, setChartType]     = useState('area'); // area|line|bar for revenue
  const searchTimer = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };

  // Redirect non-admins
  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/dashboard');
  }, [user, navigate]);

  const setLoad = (key, v) => setLoading(l => ({ ...l, [key]: v }));

  // ── Fetch overview + courses on range/tab change ─────────────
  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'courses') {
      setLoad('overview', true);
      axios.get(`${API}/overview?range=${range}`, { headers })
        .then(r => setOverview(r.data))
        .catch(console.error)
        .finally(() => setLoad('overview', false));
    }
    if (activeTab === 'courses') {
      setLoad('courses', true);
      axios.get(`${API}/courses?range=${range}`, { headers })
        .then(r => setCourses(r.data))
        .catch(console.error)
        .finally(() => setLoad('courses', false));
    }
    if (activeTab === 'activity') {
      setLoad('activity', true);
      axios.get(`${API}/activity`, { headers })
        .then(r => setActivity(r.data))
        .catch(console.error)
        .finally(() => setLoad('activity', false));
    }
    if (activeTab === 'insights') {
      setLoad('insights', true);
      axios.get(`${API}/ai-insights`, { headers })
        .then(r => setInsights(r.data))
        .catch(console.error)
        .finally(() => setLoad('insights', false));
    }
    if (activeTab === 'propfirms') {
      setLoad('propfirms', true);
      axios.get(`${API}/prop-firms?range=${range}`, { headers })
        .then(r => setPropFirms(r.data))
        .catch(console.error)
        .finally(() => setLoad('propfirms', false));
    }
    if (activeTab === 'countries') {
      setLoad('countries', true);
      axios.get(`${API}/countries`, { headers })
        .then(r => setCountries(r.data))
        .catch(console.error)
        .finally(() => setLoad('countries', false));
    }
  }, [activeTab, range]);

  // ── Fetch users when tab/search/page changes ─────────────────
  useEffect(() => {
    if (activeTab !== 'users') return;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setLoad('users', true);
      axios.get(`${API}/users?range=${range}&search=${encodeURIComponent(userSearch)}&page=${userPage}`, { headers })
        .then(r => setUsers(r.data))
        .catch(console.error)
        .finally(() => setLoad('users', false));
    }, 300);
  }, [activeTab, userSearch, userPage, range]);

  // ── Drill-down into a course ─────────────────────────────────
  const drillDown = useCallback(async (courseId) => {
    setLoad('drill', true);
    try {
      const r = await axios.get(`${API}/courses?range=${range}&courseId=${courseId}`, { headers });
      setDrillCourse({ courseId, data: r.data.lessonBreakdown, course: courses?.courses?.find(c=>c.id===courseId) });
    } catch(e) { console.error(e); }
    finally { setLoad('drill', false); }
  }, [range, courses]);

  if (!user || user.role !== 'admin') return null;

  /* ── Shared nav / header ──────────────────────────────────────*/
  const Header = () => (
    <div style={{ marginBottom:'2rem' }}>
      <button onClick={() => navigate('/admin')}
        style={{ display:'flex',alignItems:'center',gap:'6px',background:'transparent',border:'none',
          color:'var(--text-secondary)',cursor:'pointer',fontSize:'0.85rem',fontWeight:600,padding:0,marginBottom:'0.75rem' }}>
        <ArrowLeft size={14}/> Back to Admin
      </button>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:'1rem' }}>
        <div>
          <h1 style={{ margin:0,fontSize:'clamp(1.6rem,3vw,2.2rem)',fontWeight:900,letterSpacing:'-1.5px',color:'var(--text-primary)' }}>
            Analytics <span className="text-gradient">Dashboard</span>
          </h1>
          <p style={{ margin:'4px 0 0',color:'var(--text-secondary)',fontSize:'0.9rem' }}>
            Real-time insights · {new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
          </p>
        </div>
        <div style={{ display:'flex',gap:'0.75rem',alignItems:'center',flexWrap:'wrap' }}>
          {/* Range selector */}
          <div style={{ display:'flex',background:'rgba(255,255,255,0.04)',borderRadius:'12px',padding:'4px',gap:'2px' }}>
            {RANGES.map(r => (
              <button key={r.value} onClick={() => setRange(r.value)}
                style={{ padding:'6px 12px',borderRadius:'9px',border:'none',cursor:'pointer',
                  fontFamily:'var(--font-sans)',fontWeight:700,fontSize:'0.8rem',
                  background:range===r.value?'rgba(59,130,246,0.25)':'transparent',
                  color:range===r.value?'#60a5fa':'var(--text-secondary)',transition:'all 0.2s',whiteSpace:'nowrap' }}>
                {r.label}
              </button>
            ))}
          </div>
          <button onClick={() => { setOverview(null); setActiveTab(t=>t); }}
            style={{ padding:'8px 14px',borderRadius:'12px',border:'1px solid rgba(255,255,255,0.1)',
              background:'transparent',color:'var(--text-secondary)',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',
              fontFamily:'var(--font-sans)',fontWeight:700,fontSize:'0.82rem' }}>
            <RefreshCw size={13}/> Refresh
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex',gap:'0',marginTop:'1.5rem',borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        {[
          { value:'overview',  label:'Overview',    icon:BarChart2 },
          { value:'courses',   label:'Courses',     icon:BookOpen },
          { value:'users',     label:'Users',       icon:Users },
          { value:'activity',  label:'Activity',    icon:Activity },
          { value:'insights',  label:'AI Insights', icon:Zap },
          { value:'propfirms', label:'Prop Firms',  icon:Building2 },
          { value:'countries', label:'Countries',   icon:Globe },
        ].map(({ value, label, icon:Icon }) => (
          <button key={value} onClick={() => setActiveTab(value)}
            style={{ display:'flex',alignItems:'center',gap:'6px',padding:'10px 18px',border:'none',
              background:'transparent',cursor:'pointer',fontFamily:'var(--font-sans)',fontWeight:700,fontSize:'0.88rem',
              color:activeTab===value?'#60a5fa':'var(--text-secondary)',
              borderBottom:activeTab===value?'2px solid #3b82f6':'2px solid transparent',
              transition:'all 0.2s',marginBottom:'-1px' }}>
            <Icon size={14}/> {label}
          </button>
        ))}
      </div>
    </div>
  );

  /* ── OVERVIEW tab ────────────────────────────────────────────*/
  const OverviewTab = () => {
    const kpiLoad = loading.overview;
    const kpis = overview?.kpis || {};
    const revTrend = overview?.revenueTrend || [];
    const enrTrend = overview?.enrollmentTrend || [];
    const userTrend= overview?.userTrend || [];
    const byCourse = overview?.revenueByCourse || [];

    return (
      <AnimatePresence mode="wait">
        <motion.div key="overview" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.3,ease:easing}}>
          {/* KPI grid */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'1.25rem',marginBottom:'1.75rem' }}>
            <KPICard icon={Users}     label="Total Users"       value={kpis.totalUsers}        color="#3b82f6" loading={kpiLoad}/>
            <KPICard icon={BookOpen}  label="Courses"           value={kpis.totalCourses}       color="#10b981" loading={kpiLoad}/>
            <KPICard icon={Activity}  label="New Enrollments"   value={kpis.totalEnrollments}   change={kpis.enrollmentChange} color="#f59e0b" loading={kpiLoad}/>
            <KPICard icon={DollarSign}label="Revenue"           prefix="$" value={kpis.totalRevenue?.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})||'0.00'} change={kpis.revenueChange} color="#8b5cf6" loading={kpiLoad}/>
          </div>

          {/* Revenue chart */}
          <div style={{ display:'grid',gridTemplateColumns:'2fr 1fr',gap:'1.25rem',marginBottom:'1.25rem' }} className="analytics-main-grid">
            <Section title="Revenue Over Time" subtitle={`${RANGES.find(r=>r.value===range)?.label} · click bars to inspect`}
              action={
                <div style={{display:'flex',gap:'4px'}}>
                  {[{v:'area',l:'Area'},{v:'bar',l:'Bar'},{v:'line',l:'Line'}].map(t=>(
                    <button key={t.v} onClick={()=>setChartType(t.v)}
                      style={{padding:'4px 10px',borderRadius:'8px',border:`1px solid ${chartType===t.v?'rgba(59,130,246,0.5)':'rgba(255,255,255,0.08)'}`,
                        background:chartType===t.v?'rgba(59,130,246,0.15)':'transparent',color:chartType===t.v?'#60a5fa':'var(--text-secondary)',
                        cursor:'pointer',fontFamily:'var(--font-sans)',fontWeight:700,fontSize:'0.75rem'}}>
                      {t.l}
                    </button>
                  ))}
                </div>
              }
            >
              {revTrend.length === 0 ? (
                <div style={{height:'260px',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-secondary)',fontSize:'0.9rem'}}>
                  No revenue data for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  {chartType === 'bar' ? (
                    <BarChart data={revTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false}/>
                      <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false}/>
                      <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={v=>`$${v}`}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Bar dataKey="revenue" name="Revenue ($)" fill="#3b82f6" radius={[5,5,0,0]} barSize={20}/>
                    </BarChart>
                  ) : chartType === 'line' ? (
                    <LineChart data={revTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false}/>
                      <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false}/>
                      <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={v=>`$${v}`}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Line dataKey="revenue" name="Revenue ($)" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{r:5}}/>
                    </LineChart>
                  ) : (
                    <AreaChart data={revTrend}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25}/>
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false}/>
                      <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false}/>
                      <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={v=>`$${v}`}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#3b82f6" strokeWidth={3} fill="url(#revGrad)" activeDot={{r:5}}/>
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              )}
            </Section>

            {/* Revenue by course donut/bar */}
            <Section title="Revenue by Course">
              {byCourse.length === 0 ? (
                <div style={{height:'260px',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-secondary)',fontSize:'0.9rem'}}>No data</div>
              ) : (
                <div>
                  {byCourse.slice(0,6).map((c, i) => (
                    <ProgressRow key={i} label={c.name.length>22?c.name.substring(0,22)+'…':c.name}
                      value={fmt$(c.revenue)} max={byCourse[0].revenue} suffix=""
                      color={CHART_COLORS[i % CHART_COLORS.length]}/>
                  ))}
                </div>
              )}
            </Section>
          </div>

          {/* Enrollment + User trend */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.25rem' }} className="analytics-sub-grid">
            <Section title="Enrollment Trend">
              {enrTrend.length === 0 ? (
                <div style={{height:'200px',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-secondary)'}}>No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={enrTrend}>
                    <defs>
                      <linearGradient id="enrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false}/>
                    <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false}/>
                    <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Area type="monotone" dataKey="enrollments" name="Enrollments" stroke="#10b981" strokeWidth={2.5} fill="url(#enrGrad)" activeDot={{r:4}}/>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Section>
            <Section title="New Users">
              {userTrend.length === 0 ? (
                <div style={{height:'200px',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-secondary)'}}>No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={userTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false}/>
                    <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false}/>
                    <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Bar dataKey="users" name="New Users" fill="#8b5cf6" radius={[4,4,0,0]} barSize={16}/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Section>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  /* ── COURSES tab ─────────────────────────────────────────────*/
  const CoursesTab = () => {
    const list = courses?.courses || [];
    if (drillCourse) {
      const c = drillCourse.course;
      const lessons = drillCourse.data || [];
      return (
        <motion.div key="drill" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0}} transition={{duration:0.3,ease:easing}}>
          <button onClick={() => setDrillCourse(null)}
            style={{display:'flex',alignItems:'center',gap:'6px',background:'transparent',border:'none',
              color:'var(--text-secondary)',cursor:'pointer',fontSize:'0.85rem',fontWeight:700,padding:'0 0 1rem',marginBottom:'0.5rem'}}>
            <ChevronLeft size={14}/> Back to courses
          </button>
          <Section title={`Lesson completion · ${c?.title||'Course'}`} subtitle={`${c?.lessonCount||0} lessons · ${c?.enrollments||0} enrolled`}>
            {lessons.length === 0 ? (
              <p style={{color:'var(--text-secondary)',textAlign:'center',padding:'2rem'}}>No lesson data yet.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={lessons} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false}/>
                    <XAxis type="number" domain={[0,100]} tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`}/>
                    <YAxis type="category" dataKey="title" tick={{fontSize:10,fill:'var(--text-secondary)'}} tickLine={false} axisLine={false} width={120}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Bar dataKey="completionPct" name="Completion %" radius={[0,5,5,0]} barSize={14}>
                      {lessons.map((_, i) => <Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{marginTop:'1.5rem'}}>
                  {lessons.map(l => (
                    <ProgressRow key={l.id} label={`${l.module} › ${l.title}`} value={l.completionPct} max={100} color={l.completionPct>60?'#10b981':l.completionPct>30?'#f59e0b':'#ef4444'}/>
                  ))}
                </div>
              </>
            )}
          </Section>
        </motion.div>
      );
    }

    return (
      <motion.div key="courses" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.3,ease:easing}}>
        {loading.courses && <p style={{color:'var(--text-secondary)',marginBottom:'1rem',fontSize:'0.85rem'}}>Loading course data…</p>}
        <Section title="Course Performance" subtitle="Click any row to drill down into lesson-level completion">
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.85rem'}}>
              <thead>
                <tr style={{borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                  {['Course','Level','Enrollments','Avg Completion','Revenue','Sales',''].map(h=>(
                    <th key={h} style={{padding:'10px 14px',textAlign:'left',color:'var(--text-secondary)',fontWeight:700,fontSize:'0.75rem',textTransform:'uppercase',letterSpacing:'0.05em',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.length === 0 && (
                  <tr><td colSpan={7} style={{padding:'3rem',textAlign:'center',color:'var(--text-secondary)'}}>No course data.</td></tr>
                )}
                {list.map((c,i) => (
                  <tr key={c.id} style={{borderBottom:'1px solid rgba(255,255,255,0.04)',transition:'background 0.15s',cursor:'pointer'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.025)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    onClick={()=>drillDown(c.id)}
                  >
                    <td style={{padding:'12px 14px'}}>
                      <div style={{fontWeight:700,color:'var(--text-primary)',maxWidth:'200px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.title}</div>
                      <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>{c.lessonCount} lessons · {c.moduleCount} modules</div>
                    </td>
                    <td style={{padding:'12px 14px'}}>
                      <span style={{padding:'3px 8px',borderRadius:'6px',fontSize:'0.72rem',fontWeight:700,
                        background:c.level==='Beginner'?'rgba(16,185,129,0.12)':c.level==='Advanced'?'rgba(239,68,68,0.12)':'rgba(245,158,11,0.12)',
                        color:c.level==='Beginner'?'#10b981':c.level==='Advanced'?'#ef4444':'#f59e0b'}}>{c.level||'—'}</span>
                    </td>
                    <td style={{padding:'12px 14px',fontWeight:700,color:'var(--text-primary)'}}>{fmtN(c.enrollments)}</td>
                    <td style={{padding:'12px 14px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <div style={{flex:1,height:'5px',background:'rgba(255,255,255,0.07)',borderRadius:'3px',overflow:'hidden',minWidth:'60px'}}>
                          <div style={{height:'100%',width:`${c.avgCompletion}%`,background:c.avgCompletion>60?'#10b981':c.avgCompletion>30?'#f59e0b':'#ef4444',borderRadius:'3px'}}/>
                        </div>
                        <span style={{fontSize:'0.78rem',fontWeight:800,color:'var(--text-primary)',width:'30px'}}>{c.avgCompletion}%</span>
                      </div>
                    </td>
                    <td style={{padding:'12px 14px',color:'#10b981',fontWeight:800}}>{fmt$(c.revenue)}</td>
                    <td style={{padding:'12px 14px',color:'var(--text-primary)',fontWeight:700}}>{fmtN(c.sales)}</td>
                    <td style={{padding:'12px 14px'}}>
                      <button style={{padding:'5px 10px',borderRadius:'8px',border:'1px solid rgba(59,130,246,0.3)',background:'rgba(59,130,246,0.08)',
                        color:'#60a5fa',cursor:'pointer',fontFamily:'var(--font-sans)',fontWeight:700,fontSize:'0.75rem',display:'flex',alignItems:'center',gap:'4px'}}>
                        <Eye size={11}/> Drill
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </motion.div>
    );
  };

  /* ── USERS tab ───────────────────────────────────────────────*/
  const UsersTab = () => {
    const list  = users?.users || [];
    const total = users?.total || 0;
    const pages = users?.pages || 1;
    const seg   = users?.segments || {};

    return (
      <motion.div key="users" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.3,ease:easing}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.25rem',marginBottom:'1.25rem'}} className="analytics-sub-grid">
          <KPICard icon={Users}   label="New Users (period)" value={seg.newUsers||0}       color="#3b82f6"/>
          <KPICard icon={Activity}label="Returning Users"    value={seg.returningUsers||0}  color="#10b981"/>
        </div>
        <Section title={`All Users · ${fmtN(total)} total`}
          action={
            <div style={{position:'relative'}}>
              <Search size={13} style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'var(--text-secondary)'}}/>
              <input value={userSearch} onChange={e=>{setUserSearch(e.target.value);setUserPage(1);}}
                placeholder="Search by name or email…"
                style={{paddingLeft:'30px',paddingRight:'12px',paddingTop:'8px',paddingBottom:'8px',
                  border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',
                  background:'rgba(255,255,255,0.04)',color:'var(--text-primary)',
                  fontFamily:'var(--font-sans)',fontSize:'0.82rem',outline:'none',width:'240px'}}/>
            </div>
          }
        >
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.85rem'}}>
              <thead>
                <tr style={{borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                  {['User','Joined','Country','Courses','Spent','Purchases'].map(h=>(
                    <th key={h} style={{padding:'10px 14px',textAlign:'left',color:'var(--text-secondary)',fontWeight:700,fontSize:'0.75rem',textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading.users && (
                  <tr><td colSpan={5} style={{padding:'2rem',textAlign:'center',color:'var(--text-secondary)'}}>Loading…</td></tr>
                )}
                {!loading.users && list.length === 0 && (
                  <tr><td colSpan={5} style={{padding:'2rem',textAlign:'center',color:'var(--text-secondary)'}}>No users found.</td></tr>
                )}
                {list.map(u => (
                  <tr key={u.id} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.025)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{padding:'12px 14px'}}>
                      <div style={{fontWeight:700,color:'var(--text-primary)'}}>{u.name}</div>
                      <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>{u.email}</div>
                    </td>
                    <td style={{padding:'12px 14px',color:'var(--text-secondary)',fontSize:'0.8rem'}}>
                      {new Date(u.joinedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                    </td>
                    <td style={{padding:'12px 14px'}}>
                      {u.countryCode ? (
                        <span style={{display:'flex',alignItems:'center',gap:'5px',fontSize:'0.82rem'}}>
                          <span style={{fontSize:'1rem'}}>
                            {String.fromCodePoint(...(u.countryCode||'').toUpperCase().split('').map(c=>0x1F1E6-65+c.charCodeAt(0)))}
                          </span>
                          <span style={{color:'var(--text-secondary)',fontWeight:600}}>{u.country}</span>
                        </span>
                      ) : (
                        <span style={{color:'var(--text-secondary)',opacity:0.35}}>—</span>
                      )}
                    </td>
                    <td style={{padding:'12px 14px',fontWeight:700,color:'var(--text-primary)'}}>{u.enrolledCourses}</td>
                    <td style={{padding:'12px 14px',color:'#10b981',fontWeight:800}}>{fmt$(u.totalSpent)}</td>
                    <td style={{padding:'12px 14px',fontWeight:700,color:'var(--text-primary)'}}>{u.purchases}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:'8px',marginTop:'1.25rem'}}>
              <button onClick={()=>setUserPage(p=>Math.max(1,p-1))} disabled={userPage===1}
                style={{padding:'6px 12px',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.1)',background:'transparent',
                  color:userPage===1?'rgba(255,255,255,0.2)':'var(--text-secondary)',cursor:userPage===1?'default':'pointer',
                  fontFamily:'var(--font-sans)',display:'flex',alignItems:'center',gap:'4px',fontWeight:700,fontSize:'0.82rem'}}>
                <ChevronLeft size={13}/> Prev
              </button>
              <span style={{fontSize:'0.82rem',color:'var(--text-secondary)',fontWeight:600}}>
                Page {userPage} of {pages}
              </span>
              <button onClick={()=>setUserPage(p=>Math.min(pages,p+1))} disabled={userPage===pages}
                style={{padding:'6px 12px',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.1)',background:'transparent',
                  color:userPage===pages?'rgba(255,255,255,0.2)':'var(--text-secondary)',cursor:userPage===pages?'default':'pointer',
                  fontFamily:'var(--font-sans)',display:'flex',alignItems:'center',gap:'4px',fontWeight:700,fontSize:'0.82rem'}}>
                Next <ChevronRight size={13}/>
              </button>
            </div>
          )}
        </Section>
      </motion.div>
    );
  };

  /* ── ACTIVITY tab ────────────────────────────────────────────*/
  const ActivityTab = () => {
    const feed = activity?.feed || [];
    return (
      <motion.div key="activity" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.3,ease:easing}}>
        <Section title="Real-time Activity Feed" subtitle="Last 30 events across the platform"
          action={
            <button onClick={()=>{setLoad('activity',true);axios.get(`${API}/activity`,{headers}).then(r=>setActivity(r.data)).catch(console.error).finally(()=>setLoad('activity',false));}}
              style={{padding:'6px 12px',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.1)',background:'transparent',
                color:'var(--text-secondary)',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',
                fontFamily:'var(--font-sans)',fontWeight:700,fontSize:'0.8rem'}}>
              <RefreshCw size={12}/> Refresh
            </button>
          }
        >
          {loading.activity ? (
            <p style={{color:'var(--text-secondary)',textAlign:'center',padding:'2rem'}}>Loading feed…</p>
          ) : feed.length === 0 ? (
            <p style={{color:'var(--text-secondary)',textAlign:'center',padding:'2rem'}}>No recent activity.</p>
          ) : (
            <div>{feed.map((e,i) => <ActivityEvent key={i} event={e}/>)}</div>
          )}
        </Section>
      </motion.div>
    );
  };

  /* ── AI INSIGHTS tab ─────────────────────────────────────────*/
  const InsightsTab = () => {
    const list = insights?.insights || [];
    return (
      <motion.div key="insights" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.3,ease:easing}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'1.5rem',padding:'1rem 1.25rem',
          background:'rgba(139,92,246,0.07)',border:'1px solid rgba(139,92,246,0.2)',borderRadius:'16px'}}>
          <Zap size={18} style={{color:'#8b5cf6',flexShrink:0}}/>
          <p style={{margin:0,fontSize:'0.85rem',color:'var(--text-secondary)',lineHeight:1.5}}>
            <strong style={{color:'var(--text-primary)'}}>AI Insights</strong> — rule-based analysis derived from your real platform data.
            {insights?.generatedAt && <span> Generated {new Date(insights.generatedAt).toLocaleTimeString()}.</span>}
          </p>
        </div>
        {loading.insights ? (
          <p style={{color:'var(--text-secondary)',textAlign:'center',padding:'3rem'}}>Generating insights…</p>
        ) : list.length === 0 ? (
          <p style={{color:'var(--text-secondary)',textAlign:'center',padding:'3rem'}}>No insights available yet. Add more data to generate analysis.</p>
        ) : (
          <div>{list.map((ins,i) => <InsightCard key={i} insight={ins}/>)}</div>
        )}
      </motion.div>
    );
  };

  /* ── PROP FIRMS analytics tab ───────────────────────────────*/
  const PropFirmsTab = () => {
    const pf = propFirms;
    const kpis = pf?.kpis || {};
    const topFirms = pf?.topFirms || [];
    const trend = pf?.clickTrend || [];
    const types = pf?.typeBreakdown || [];
    const maxClicks = topFirms[0]?.totalClicks || 1;

    const typeColor = { view:'#3b82f6', website:'#10b981', affiliate:'#f59e0b' };

    return (
      <motion.div key="propfirms" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.3,ease:easing}}>

        {/* KPI row */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'1.25rem',marginBottom:'1.75rem'}}>
          <KPICard icon={MousePointer2} label="Total Clicks"  value={kpis.totalClicks||0}  color="#3b82f6" loading={loading.propfirms}/>
          <KPICard icon={Building2}    label="Firms Clicked" value={kpis.uniqueFirms||0}  color="#10b981" loading={loading.propfirms}/>
          <KPICard icon={Building2}    label="Total Firms"   value={kpis.totalFirms||0}   color="#8b5cf6" loading={loading.propfirms}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'1.25rem',marginBottom:'1.25rem'}} className="analytics-main-grid">
          {/* Click trend */}
          <Section title="Daily Click Trend" subtitle="All prop firm interactions over time">
            {trend.length === 0 ? (
              <div style={{height:'220px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'0.75rem',color:'var(--text-secondary)'}}>
                <MousePointer2 size={32} style={{opacity:0.2}}/>
                <p style={{margin:0,fontSize:'0.9rem'}}>No clicks recorded yet — go browse some prop firms!</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="pfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false}/>
                  <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false}/>
                  <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#3b82f6" strokeWidth={2.5} fill="url(#pfGrad)" activeDot={{r:4}}/>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Section>

          {/* Click type breakdown */}
          <Section title="Click Types">
            {types.length === 0 ? (
              <div style={{height:'220px',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-secondary)',fontSize:'0.9rem'}}>No data</div>
            ) : (
              <div style={{paddingTop:'0.5rem'}}>
                {types.map(t => (
                  <div key={t.type} style={{marginBottom:'1.25rem'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                      <span style={{fontSize:'0.85rem',fontWeight:700,color:'var(--text-primary)',textTransform:'capitalize'}}>{t.type}</span>
                      <span style={{fontSize:'0.85rem',fontWeight:800,color:typeColor[t.type]||'#3b82f6'}}>{fmtN(t.count)}</span>
                    </div>
                    <div style={{height:'8px',background:'rgba(255,255,255,0.06)',borderRadius:'4px',overflow:'hidden'}}>
                      <motion.div initial={{width:0}} animate={{width:`${Math.min((t.count/(types.reduce((a,x)=>a+x.count,0)||1))*100,100)}%`}}
                        transition={{duration:0.8,ease:easing}}
                        style={{height:'100%',background:typeColor[t.type]||'#3b82f6',borderRadius:'4px'}}/>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Top clicked firms ranked list */}
        <Section title="Most In-Demand Prop Firms" subtitle="Ranked by total user interactions (views + site visits)">
          {topFirms.length === 0 ? (
            <div style={{padding:'3rem',textAlign:'center'}}>
              <Building2 size={40} style={{opacity:0.15,marginBottom:'1rem'}}/>
              <p style={{color:'var(--text-secondary)',fontSize:'0.9rem',margin:0}}>No interaction data yet. Users need to browse prop firms first.</p>
            </div>
          ) : (
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.85rem'}}>
                <thead>
                  <tr style={{borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                    {['#','Firm','Rating','Total Clicks','Views','Site Visits','Popularity',''].map(h => (
                      <th key={h} style={{padding:'10px 14px',textAlign:'left',color:'var(--text-secondary)',fontWeight:700,fontSize:'0.75rem',textTransform:'uppercase',letterSpacing:'0.05em',whiteSpace:'nowrap'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topFirms.map((f, i) => (
                    <tr key={f.id} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.025)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <td style={{padding:'12px 14px'}}>
                        <div style={{width:'26px',height:'26px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                          background:i===0?'rgba(245,158,11,0.15)':i===1?'rgba(203,213,225,0.1)':i===2?'rgba(180,83,9,0.1)':'rgba(255,255,255,0.04)',
                          fontWeight:900,fontSize:'0.78rem',
                          color:i===0?'#f59e0b':i===1?'#94a3b8':i===2?'#b45309':'var(--text-secondary)'}}>
                          {i+1}
                        </div>
                      </td>
                      <td style={{padding:'12px 14px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                          {f.logoUrl && <img src={`http://localhost:5000${f.logoUrl}`} alt="" style={{width:'32px',height:'32px',borderRadius:'8px',objectFit:'contain',background:'#fff',padding:'3px',flexShrink:0}}/>}
                          <div>
                            <div style={{fontWeight:700,color:'var(--text-primary)'}}>{f.name}</div>
                            {f.featured && <span style={{fontSize:'0.65rem',fontWeight:800,color:'#f97316',textTransform:'uppercase',letterSpacing:'0.06em'}}>Featured</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{padding:'12px 14px'}}>
                        {f.rating ? <span style={{display:'inline-flex',alignItems:'center',gap:'4px',color:'#f59e0b',fontWeight:700}}><Star size={13} fill="#f59e0b" stroke="#f59e0b"/>{f.rating}</span> : <span style={{color:'var(--text-secondary)'}}>—</span>}
                      </td>
                      <td style={{padding:'12px 14px'}}>
                        <span style={{fontWeight:900,fontSize:'1.05rem',color:i===0?'#f59e0b':'var(--text-primary)'}}>{fmtN(f.totalClicks)}</span>
                      </td>
                      <td style={{padding:'12px 14px',color:'#3b82f6',fontWeight:700}}>{fmtN(f.viewClicks)}</td>
                      <td style={{padding:'12px 14px',color:'#10b981',fontWeight:700}}>{fmtN(f.websiteClicks)}</td>
                      <td style={{padding:'12px 14px',minWidth:'120px'}}>
                        <div style={{height:'6px',background:'rgba(255,255,255,0.06)',borderRadius:'3px',overflow:'hidden'}}>
                          <motion.div initial={{width:0}} animate={{width:`${maxClicks>0?(f.totalClicks/maxClicks)*100:0}%`}} transition={{duration:0.8,ease:easing,delay:i*0.05}}
                            style={{height:'100%',background:i===0?'linear-gradient(90deg,#f59e0b,#ef4444)':'#3b82f6',borderRadius:'3px'}}/>
                        </div>
                      </td>
                      <td style={{padding:'12px 14px'}}>
                        {f.website && <a href={f.website} target="_blank" rel="noreferrer" style={{padding:'5px 10px',borderRadius:'8px',border:'1px solid rgba(16,185,129,0.3)',background:'rgba(16,185,129,0.08)',color:'#10b981',textDecoration:'none',fontWeight:700,fontSize:'0.75rem',display:'inline-flex',alignItems:'center',gap:'4px'}}>Visit <ExternalLink size={11}/></a>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </motion.div>
    );
  };

  /* ── COUNTRIES tab ────────────────────────────────────────────*/
  const CountriesTab = () => {
    const data   = countries?.countries  || [];
    const total  = countries?.totalDistinct || 0;
    const noGeo  = countries?.noGeoCount    || 0;
    const withGeo = data.reduce((s, c) => s + c.count, 0);

    const toFlag = (code) => {
      if (!code || code.length !== 2) return '🌐';
      return String.fromCodePoint(...code.toUpperCase().split('').map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
    };

    return (
      <motion.div key="countries" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.3,ease:easing}}>
        {/* KPI row */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'1.25rem',marginBottom:'1.75rem'}}>
          <KPICard icon={Globe}  label="Countries Reached" value={total}   color="#3b82f6" loading={loading.countries}/>
          <KPICard icon={Users}  label="Users with Location" value={withGeo} color="#10b981" loading={loading.countries}/>
          <KPICard icon={Users}  label="Location Unknown"   value={noGeo}   color="#f59e0b" loading={loading.countries}/>
        </div>

        <Section
          title="Users by Country"
          subtitle={total > 0 ? `${total} countries detected · location recorded on login/register` : 'No location data yet — will populate as users log in'}
        >
          {loading.countries ? (
            <p style={{color:'var(--text-secondary)',textAlign:'center',padding:'3rem'}}>Loading…</p>
          ) : data.length === 0 ? (
            <div style={{textAlign:'center',padding:'4rem 2rem'}}>
              <Globe size={48} style={{color:'var(--accent-primary)',opacity:0.3,marginBottom:'1rem'}}/>
              <h3 style={{color:'var(--text-primary)',marginBottom:'0.5rem'}}>No location data yet</h3>
              <p style={{color:'var(--text-secondary)',fontSize:'0.9rem',maxWidth:'380px',margin:'0 auto'}}>
                Country is recorded automatically when users log in or register.
                Data will appear here once users start signing in from production.
              </p>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2rem'}} className="analytics-sub-grid">
              {/* Bar chart */}
              <div>
                <ResponsiveContainer width="100%" height={Math.max(220, data.length * 38)}>
                  <BarChart data={data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false}/>
                    <XAxis type="number" tick={AXIS_STYLE} tickLine={false} axisLine={false}/>
                    <YAxis type="category" dataKey="country" tick={{fontSize:11,fill:'var(--text-secondary)'}} tickLine={false} axisLine={false} width={110}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Bar dataKey="count" name="Users" radius={[0,5,5,0]} barSize={14}>
                      {data.map((_,i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Ranked list with flags + progress bars */}
              <div style={{paddingTop:'0.25rem'}}>
                {data.map((c, i) => (
                  <div key={c.code} style={{marginBottom:'0.9rem'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'5px'}}>
                      <span style={{display:'flex',alignItems:'center',gap:'7px',fontSize:'0.85rem',fontWeight:700,color:'var(--text-primary)'}}>
                        <span style={{fontSize:'1.15rem',lineHeight:1}}>{toFlag(c.code)}</span>
                        {c.country}
                      </span>
                      <span style={{fontSize:'0.8rem',fontWeight:800,color:'var(--text-secondary)'}}>
                        {c.count} · {c.percentage}%
                      </span>
                    </div>
                    <div style={{height:'6px',background:'rgba(255,255,255,0.06)',borderRadius:'3px',overflow:'hidden'}}>
                      <motion.div
                        initial={{width:0}}
                        animate={{width:`${c.percentage}%`}}
                        transition={{duration:0.7,ease:easing,delay:i*0.04}}
                        style={{height:'100%',background:CHART_COLORS[i%CHART_COLORS.length],borderRadius:'3px'}}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      </motion.div>
    );
  };

  /* ── Render ──────────────────────────────────────────────────*/
  return (
    <div style={{ padding:'2rem 5%', maxWidth:'1400px', margin:'0 auto' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @media(max-width:900px){
          .analytics-main-grid { grid-template-columns:1fr !important; }
          .analytics-sub-grid  { grid-template-columns:1fr !important; }
        }
      `}</style>

      <Header/>

      <AnimatePresence mode="wait">
        {activeTab === 'overview'  && <OverviewTab  key="overview"/>}
        {activeTab === 'courses'   && <CoursesTab   key="courses"/>}
        {activeTab === 'users'     && <UsersTab      key="users"/>}
        {activeTab === 'activity'  && <ActivityTab   key="activity"/>}
        {activeTab === 'insights'  && <InsightsTab   key="insights"/>}
        {activeTab === 'propfirms' && <PropFirmsTab  key="propfirms"/>}
        {activeTab === 'countries' && <CountriesTab  key="countries"/>}
      </AnimatePresence>
    </div>
  );
}
