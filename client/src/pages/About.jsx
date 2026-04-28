import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import axios from 'axios';
import {
  TrendingUp, Target, ShieldCheck, Users, BookOpen,
  BarChart2, Award, ArrowRight, Quote, Zap, Globe, Clock, ThumbsUp,
} from 'lucide-react';

const API_BASE = 'http://localhost:5000';

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
  { year: '2019', title: 'First Trade', desc: 'Robert enters the futures market — learns the hard way through prop firm challenges, blown accounts, and relentless study.' },
  { year: '2021', title: 'Consistency Achieved', desc: 'After mastering ICT concepts and liquidity theory, Robert begins posting public trade breakdowns with 80%+ win rates.' },
  { year: '2022', title: 'Community Founded', desc: 'First private Discord opens. 200 committed traders join in the first month, hungry for structured, actionable education.' },
  { year: '2023', title: 'Platform Launched', desc: 'Robert Trades Futures launches its full course library — structured paths from beginner price action to advanced prop-firm strategies.' },
  { year: '2024', title: 'Global Reach', desc: 'Students from 60+ countries. Hundreds of funded accounts. The platform expands with live sessions, blog analysis, and mentor reviews.' },
];

const TEAM = [
  {
    name: 'Robert',
    role: 'Founder & Head Mentor',
    bio: 'Futures trader with 5+ years of consistent profitability. Specialises in ICT methodology, liquidity engineering, and prop firm evaluation strategies.',
    initials: 'R',
    hue: '213',
  },
  {
    name: 'Sofia M.',
    role: 'Risk & Psychology Coach',
    bio: 'Former institutional desk analyst turned trading educator. Focuses on trader psychology, position sizing, and emotional discipline frameworks.',
    initials: 'S',
    hue: '265',
  },
  {
    name: 'James O.',
    role: 'Macro & Fundamentals',
    bio: 'Macro economist and CME futures specialist. Bridges the gap between fundamental catalysts and technical price structure.',
    initials: 'J',
    hue: '160',
  },
];

const TESTIMONIALS = [
  { quote: 'Robert\'s framework took me from consistently losing to passing my FTMO challenge in 3 weeks. The liquidity concepts alone are worth 10x the course price.', name: 'Khalid A.', tag: 'FTMO Funded' },
  { quote: 'I\'ve taken $2,000 worth of trading courses. Nothing clicked until I found Robert Trades Futures. The structure and depth here is unmatched.', name: 'Maria T.', tag: 'Apex Funded' },
  { quote: 'The prop firm module is exactly what the industry needed. Clear rules, real scenarios, and no fluff. My pass rate went from 0/4 to 3/4.', name: 'Dev P.', tag: 'E8 Markets Funded' },
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
            {STATS.map(({ icon: Icon, value, suffix, label }, i) => (
              <Reveal key={label} delay={i * 0.08}>
                <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '2rem 1.5rem', textAlign: 'center', transition: 'border-color 0.3s, transform 0.3s', cursor: 'default' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
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
            ))}
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
                  <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {['ICT Concepts', 'Liquidity Theory', 'Prop Firms', 'Futures'].map(tag => (
                      <span key={tag} style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.3rem 0.9rem', borderRadius: '99px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', color: '#93c5fd', letterSpacing: '0.04em' }}>{tag}</span>
                    ))}
                  </div>
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
              From Zero to Funded — Then to Thousands
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
            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#60a5fa', marginBottom: '0.75rem' }}>The Team</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, letterSpacing: '-1px', color: 'var(--text-primary)', margin: 0 }}>
              Traders Teaching Traders
            </h2>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }} className="about-team-grid">
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
