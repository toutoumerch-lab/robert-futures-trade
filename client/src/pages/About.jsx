import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import axios from 'axios';
import {
  TrendingUp, Target, ShieldCheck, Users, BookOpen,
  BarChart2, Award, ArrowRight, Quote, Zap, Globe, Clock, ThumbsUp, Info,
} from 'lucide-react';

const API_BASE = 'http://localhost:5001';

/* ─── helpers ─────────────────────────────────────────────── */
const easing = [0.16, 1, 0.3, 1];
const fadeUp  = (delay = 0) => ({
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: easing, delay } },
});
const fadeIn = (delay = 0) => ({
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.5, delay } },
});

/* ─── animated counter ────────────────────────────────────── */
const Counter = ({ to, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1600;
    const step = 16;
    const increment = to / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= to) { setCount(to); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [inView, to]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
};

/* ─── Reveal wrapper ──────────────────────────────────────── */
const Reveal = ({ children, delay = 0, className = '', style = {} }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      variants={fadeUp(delay)}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
    >
      {children}
    </motion.div>
  );
};

/* ─── Satisfaction tooltip ────────────────────────────────── */
const SatisfactionTooltip = () => {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Info trigger */}
      <button
        type="button"
        aria-label="How satisfaction is calculated"
        style={{
          background: 'none', border: 'none', padding: '2px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.3)',
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#60a5fa'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
      >
        <Info size={14} />
      </button>

      {/* Tooltip popover */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: '260px', zIndex: 999,
          background: 'rgba(15,23,42,0.97)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(37,99,235,0.25)', borderRadius: '14px',
          padding: '1rem 1.1rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          textAlign: 'left',
          animation: 'fadeIn 0.15s ease',
        }}>
          {/* Arrow */}
          <div style={{
            position: 'absolute', top: '-6px', right: '12px',
            width: '12px', height: '12px',
            background: 'rgba(15,23,42,0.97)',
            border: '1px solid rgba(37,99,235,0.25)',
            borderRight: 'none', borderBottom: 'none',
            transform: 'rotate(45deg)',
          }} />

          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#60a5fa', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            How it's calculated
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
            Students rate each lesson <strong style={{ color: 'var(--text-primary)' }}>1–5 stars</strong>. The average is mapped to a 0–100% scale:
          </p>
          <div style={{
            background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.15)',
            borderRadius: '8px', padding: '0.6rem 0.8rem', fontFamily: 'monospace',
            fontSize: '0.78rem', color: '#93c5fd', marginBottom: '0.75rem', lineHeight: 1.8,
          }}>
            (avg_rating − 1) ÷ 4 × 100
          </div>
          <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ color: 'var(--text-secondary)', fontWeight: 700, textAlign: 'left', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>Stars</th>
                <th style={{ color: 'var(--text-secondary)', fontWeight: 700, textAlign: 'right', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>Satisfaction</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['⭐⭐⭐⭐⭐  5.0', '100%'],
                ['⭐⭐⭐⭐     4.0', '75%'],
                ['⭐⭐⭐         3.0', '50%'],
                ['⭐⭐             2.0', '25%'],
                ['⭐                 1.0', '0%'],
              ].map(([s, p]) => (
                <tr key={s}>
                  <td style={{ padding: '3px 0', color: 'var(--text-secondary)' }}>{s}</td>
                  <td style={{ padding: '3px 0', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 700 }}>{p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ─── static data ─────────────────────────────────────────── */
const STATS_DEFAULTS = [
  { icon: Users,    key: 'active_students', suffix: '+', label: 'Active Students',   fallback: 2400 },
  { icon: BookOpen, key: 'courses_modules', suffix: '+', label: 'Courses',         fallback: 12   },
  { icon: ThumbsUp,  key: 'satisfaction_rate', suffix: '%', label: 'Student Satisfaction', fallback: null },
  { icon: Globe,    key: 'countries',       suffix: '+', label: 'Countries Reached', fallback: 60   },
];



const VALUES = [
  {
    icon: Target,
    title: 'Precision Over Noise',
    desc: 'Every lesson strips away the fluff. We teach only what actually moves markets — price action, liquidity, and institutional order flow.',
    hue: '213',
  },
  {
    icon: ShieldCheck,
    title: 'Risk-First Mindset',
    desc: 'Capital preservation is non-negotiable. We build traders who understand that surviving drawdowns is more important than chasing peaks.',
    hue: '160',
  },
  {
    icon: Zap,
    title: 'Execution-Ready',
    desc: 'Theory without practice is worthless. Every concept is paired with live examples, trade reviews, and real prop firm scenarios.',
    hue: '38',
  },
  {
    icon: TrendingUp,
    title: 'Consistent Edge',
    desc: 'We don\'t teach lottery trading. We engineer repeatable, rule-based frameworks that compound over time and survive all market conditions.',
    hue: '265',
  },
];

const TIMELINE = [
  { year: '2020', title: 'First Trade', desc: 'Robert enters the markets. The early years are a grind — learning price action, working through losses, and building the screen time that no shortcut replaces.' },
  { year: '2024', title: 'The Turning Point', desc: 'Robert discovers Auction Market Theory and order flow. The pieces finally click. Trading shifts from pattern-guessing to reading what the market is actually doing.' },
  { year: '2024', title: 'Community Founded', desc: 'A small private group forms around the same methods — traders who want structure over hype and are willing to put in the work.' },
  { year: 'May 2026', title: 'Platform Launching', desc: 'Robert Trades Futures goes live — beginner course built around AMT and Order Flow, from the fundamentals up to prop-firm-ready execution.' },
];

const TEAM = [
  {
    name: 'Robert',
    role: 'Founder & Head Mentor',
    bio: 'Robert started trading in 2020 — grinding through losses, rebuilding, and accumulating the screen time that books can\'t replace. The real shift came in 2024 when he discovered Auction Market Theory and order flow, turning years of pattern-guessing into a structured, repeatable edge. He built a private community around those same principles — traders who wanted depth over hype. In May 2026, he launched Robert Trades Futures to bring that full system to anyone serious enough to do the work.',
    initials: 'R',
    hue: '213',
  },
];

const TESTIMONIALS = [
  { quote: 'It was great, man. I loved it — taught me a lot honestly.', name: 'Jesse E.', tag: 'Course Student' },
  { quote: 'I loved every minute of it -- sometimes we really need the extra hand.', name: 'Subham F.', tag: 'Course Student' },
  { quote: 'I love everything you do, I appreciate all your help, started making $$ with this..', name: 'Ricky G.', tag: 'Course Student' },
];

/* ═══════════════════════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════════════════════ */
export default function About() {
  // ── Live stats fetched from API
  const [apiStats, setApiStats] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/api/about/stats`)
      .then(res => setApiStats(res.data))
      .catch(() => setApiStats(null)); // silently fall back to defaults
  }, []);

  // Merge API data into STATS_DEFAULTS (fallback to hardcoded values if API unavailable)
  const STATS = STATS_DEFAULTS.map(s => ({
    ...s,
    value: apiStats ? (apiStats[s.key] ?? s.fallback) : s.fallback,
  }));

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', padding: '7rem 0 6rem', overflow: 'hidden' }}>
        {/* Radial glow */}
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '900px', height: '500px', background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        {/* Grid lines */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <motion.div variants={fadeIn(0)} initial="hidden" animate="show" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: '99px', padding: '0.35rem 1rem', marginBottom: '1.5rem', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#60a5fa' }}>
            <Award size={12} /> Our Story
          </motion.div>

          <motion.h1 variants={fadeUp(0.05)} initial="hidden" animate="show" style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4rem)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.08, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
            Built by a Trader,<br />
            <span className="text-gradient">For Traders.</span>
          </motion.h1>

          <motion.p variants={fadeUp(0.1)} initial="hidden" animate="show" style={{ fontSize: 'clamp(1rem, 2vw, 1.18rem)', color: 'var(--text-secondary)', maxWidth: '620px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            Robert Trades Futures was born out of frustration — thousands of dollars wasted on courses that taught theory
            but never showed you how to actually trade. We exist to change that.
          </motion.p>

          <motion.div variants={fadeUp(0.15)} initial="hidden" animate="show" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/courses" className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1rem', fontWeight: 800, borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              Explore Courses <ArrowRight size={16} />
            </Link>
            <Link to="/blog" style={{ padding: '0.85rem 2rem', fontSize: '1rem', fontWeight: 700, borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)'; e.currentTarget.style.color = '#93c5fd'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              Read the Blog
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══ STATS ═════════════════════════════════════════════════ */}
      <section style={{ padding: '0 0 5rem' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }} className="about-stats-grid">
            {STATS.map(({ icon: Icon, value, suffix, label, key }, i) => {
              const isSatisfaction = key === 'satisfaction_rate';
              return (
              <Reveal key={label} delay={i * 0.08}>
                <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '2rem 1.5rem', textAlign: 'center', transition: 'border-color 0.3s, transform 0.3s', cursor: 'default', position: 'relative' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {/* Tooltip info icon — only on satisfaction card */}
                  {isSatisfaction && (
                    <div style={{ position: 'absolute', top: '14px', right: '14px' }}>
                      <SatisfactionTooltip />
                    </div>
                  )}

                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#60a5fa' }}>
                    <Icon size={22} />
                  </div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-1.5px', color: 'var(--text-primary)', lineHeight: 1 }}>
                    {value === null
                      ? <span style={{ fontSize: '1.8rem', color: 'var(--text-secondary)' }}>—</span>
                      : <Counter to={value} suffix={suffix} />
                    }
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 600 }}>{label}</div>
                  {value === null && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.3rem', opacity: 0.6 }}>No reviews yet</div>
                  )}
                </div>
              </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ MISSION SPLIT ══════════════════════════════════════════ */}
      <section style={{ padding: '5rem 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }} className="about-split-grid">
            {/* Left — visual */}
            <Reveal>
              <div style={{ position: 'relative' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(37,99,235,0.02))', border: '1px solid rgba(37,99,235,0.15)', borderRadius: '28px', padding: '3rem', position: 'relative', overflow: 'hidden' }}>
                  {/* decorative corner glow */}
                  <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(37,99,235,0.15), transparent 70%)', pointerEvents: 'none' }} />

                  <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#60a5fa', marginBottom: '1.5rem' }}>Our Mission</div>
                  <p style={{ fontSize: '1.45rem', fontWeight: 800, lineHeight: 1.5, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.4px' }}>
                    "To make institutional-grade trading education accessible to every serious trader on the planet."
                  </p>

                </div>

                {/* floating mini card */}
                <div style={{ position: 'absolute', bottom: '-24px', right: '-24px', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <TrendingUp size={18} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Avg student outcome</div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#10b981' }}>Funded in &lt;90 days</div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Right — text */}
            <div>
              <Reveal delay={0.05}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#60a5fa', marginBottom: '1rem' }}>Why We Exist</div>
                <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1.15, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
                  Most education fails traders before they even start.
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.75, marginBottom: '1rem' }}>
                  The trading education industry is flooded with influencers selling recycled PDF strategies and cherry-picked screenshots.
                  Real traders lose real money following that content.
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.75, marginBottom: '1.75rem' }}>
                  Robert Trades Futures was built to be different — a structured curriculum built on years of live market performance,
                  not just theory. Every concept is tested, refined, and proven in real prop firm environments before it's taught.
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <Link to="/courses" className="btn btn-primary" style={{ padding: '0.8rem 1.75rem', fontWeight: 800, borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  Start Learning <ArrowRight size={15} />
                </Link>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ══ VALUES ════════════════════════════════════════════════ */}
      <section style={{ padding: '5rem 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container">
          <Reveal style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#60a5fa', marginBottom: '0.75rem' }}>Core Values</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, letterSpacing: '-1px', color: 'var(--text-primary)', margin: 0 }}>
              What We Stand For
            </h2>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }} className="about-values-grid">
            {VALUES.map(({ icon: Icon, title, desc, hue }, i) => (
              <Reveal key={title} delay={i * 0.07}>
                <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '2rem', display: 'flex', gap: '1.25rem', transition: 'all 0.3s', cursor: 'default' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `hsla(${hue},80%,60%,0.3)`; e.currentTarget.style.background = `hsla(${hue},80%,60%,0.04)`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: `hsla(${hue},80%,60%,0.1)`, border: `1px solid hsla(${hue},80%,60%,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: `hsl(${hue},80%,68%)` }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.2px' }}>{title}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TIMELINE ══════════════════════════════════════════════ */}
      <section style={{ padding: '5rem 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container">
          <Reveal style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#60a5fa', marginBottom: '0.75rem' }}>Our Journey</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, letterSpacing: '-1px', color: 'var(--text-primary)', margin: 0 }}>
              From First Chart to Full Platform
            </h2>
          </Reveal>

          <div style={{ position: 'relative', maxWidth: '760px', margin: '0 auto' }}>
            {/* vertical line */}
            <div style={{ position: 'absolute', left: '80px', top: 0, bottom: 0, width: '1px', background: 'linear-gradient(to bottom, transparent, rgba(37,99,235,0.4) 10%, rgba(37,99,235,0.4) 90%, transparent)', pointerEvents: 'none' }} />

            {TIMELINE.map(({ year, title, desc }, i) => (
              <Reveal key={year} delay={i * 0.1} style={{ display: 'flex', gap: '2rem', marginBottom: '2.5rem', alignItems: 'flex-start' }}>
                {/* Year bubble */}
                <div style={{ flexShrink: 0, width: '80px', textAlign: 'center', paddingTop: '0.35rem' }}>
                  <div style={{ display: 'inline-flex', padding: '0.3rem 0.7rem', borderRadius: '99px', background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)', fontSize: '0.72rem', fontWeight: 900, color: '#60a5fa', letterSpacing: '0.04em' }}>{year}</div>
                </div>
                {/* Dot */}
                <div style={{ position: 'relative', flexShrink: 0, marginTop: '0.55rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 0 0 4px rgba(37,99,235,0.15)', position: 'relative', zIndex: 1 }} />
                </div>
                {/* Text */}
                <div style={{ paddingBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem', letterSpacing: '-0.2px' }}>{title}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TEAM ══════════════════════════════════════════════════ */}
      <section style={{ padding: '5rem 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container">
          <Reveal style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#60a5fa', marginBottom: '0.75rem' }}>The Founder</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, letterSpacing: '-1px', color: 'var(--text-primary)', margin: 0 }}>
              The Trader Behind the Platform
            </h2>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', maxWidth: '520px', margin: '0 auto' }}>
            {TEAM.map(({ name, role, bio, initials, hue }, i) => (
              <Reveal key={name} delay={i * 0.1}>
                <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px', padding: '2rem', textAlign: 'center', transition: 'all 0.3s', cursor: 'default' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `hsla(${hue},80%,60%,0.3)`; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 16px 40px -8px hsla(${hue},80%,40%,0.15)`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* Avatar */}
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: `linear-gradient(135deg, hsl(${hue},80%,40%), hsl(${hue},80%,55%))`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.6rem', fontWeight: 900, color: '#fff', boxShadow: `0 8px 24px hsla(${hue},80%,50%,0.3)` }}>
                    {initials}
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{name}</h3>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: `hsl(${hue},80%,68%)`, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>{role}</div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{bio}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══════════════════════════════════════════ */}
      <section style={{ padding: '5rem 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container">
          <Reveal style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#60a5fa', marginBottom: '0.75rem' }}>Student Results</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, letterSpacing: '-1px', color: 'var(--text-primary)', margin: 0 }}>
              Real Traders. Real Accounts.
            </h2>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }} className="about-team-grid">
            {TESTIMONIALS.map(({ quote, name, tag }, i) => (
              <Reveal key={name} delay={i * 0.08}>
                <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', transition: 'all 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <Quote size={22} style={{ color: 'rgba(37,99,235,0.4)', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, flex: 1 }}>"{quote}"</p>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                      {name[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>{name}</div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981' }}>{tag}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════════ */}
      <section style={{ padding: '5rem 0 7rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <Reveal>
            <div style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(37,99,235,0.03))', border: '1px solid rgba(37,99,235,0.18)', borderRadius: '32px', padding: '4rem 2rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '300px', background: 'radial-gradient(ellipse, rgba(37,99,235,0.12), transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: '99px', padding: '0.3rem 0.9rem', marginBottom: '1.5rem', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#60a5fa' }}>
                  <Clock size={11} /> Limited Cohort Spots
                </div>
                <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-1.5px', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  Ready to trade with an edge?
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto 2rem', lineHeight: 1.65 }}>
                  Join thousands of traders who have transformed their results with structured, institutional-level education.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/courses" className="btn btn-primary" style={{ padding: '0.9rem 2.25rem', fontSize: '1rem', fontWeight: 800, borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    Browse Courses <ArrowRight size={16} />
                  </Link>
                  <Link to="/blog" style={{ padding: '0.9rem 2.25rem', fontSize: '1rem', fontWeight: 700, borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)'; e.currentTarget.style.color = '#93c5fd'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    Free Blog Articles
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── responsive helpers ─────────────────────────────────── */}
      <style>{`
        @media (max-width: 1024px) {
          .about-stats-grid  { grid-template-columns: repeat(2, 1fr) !important; }
          .about-team-grid   { grid-template-columns: repeat(2, 1fr) !important; }
          .about-values-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .about-split-grid  { grid-template-columns: 1fr !important; gap: 3rem !important; }
        }
        @media (max-width: 640px) {
          .about-stats-grid  { grid-template-columns: 1fr !important; }
          .about-team-grid   { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
