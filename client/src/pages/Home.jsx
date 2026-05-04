import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useAnimation } from 'framer-motion';
import Card from '../components/common/Card';
import Reveal from '../components/common/Reveal';
import { useBranding } from '../context/BrandingContext';
import { useParallax } from '../hooks/useScrollReveal';
import { Scale, Gem, Newspaper, Sparkles, ArrowRight, TrendingUp, Shield, Zap, BookOpen, Trophy, Rss } from 'lucide-react';
const YoutubeSVG = ({ size = 36, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"/>
  </svg>
);


/* ── Animation variants ─────────────────────────────────── */
const vFadeLeft  = { hidden:{opacity:0,x:-70},  visible:{opacity:1,x:0,  transition:{duration:0.75,ease:[0.16,1,0.3,1]}} };
const vFadeRight = { hidden:{opacity:0,x:70},   visible:{opacity:1,x:0,  transition:{duration:0.75,ease:[0.16,1,0.3,1]}} };
const vFadeUp2   = { hidden:{opacity:0,y:60},   visible:{opacity:1,y:0,  transition:{duration:0.75,ease:[0.16,1,0.3,1]}} };
const vStagger   = { visible:{ transition:{ staggerChildren:0.13 }} };
const vPop       = { hidden:{opacity:0,scale:0.5,y:20}, visible:{opacity:1,scale:1,y:0,transition:{type:'spring',stiffness:300,damping:20}} };

/* ── Floating glow orb ──────────────────────────────────── */
const FloatOrb = ({ color, size='400px', style={} }) => (
  <motion.div
    animate={{ y:[0,-22,0], scale:[1,1.07,1] }}
    transition={{ duration:6, repeat:Infinity, ease:'easeInOut' }}
    style={{ position:'absolute', width:size, height:size, borderRadius:'50%',
      background:`radial-gradient(circle, ${color}, transparent 70%)`,
      filter:'blur(60px)', pointerEvents:'none', zIndex:0, ...style }}
  />
);

/* ── Shimmer divider ────────────────────────────────────── */
const ShimmerDiv = () => (
  <div style={{ position:'relative', height:'1px', margin:'0 5%', overflow:'hidden' }}>
    <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)' }}/>
    <motion.div
      animate={{ x:['-100%','200%'] }}
      transition={{ duration:2.8, repeat:Infinity, ease:'linear', repeatDelay:1.5 }}
      style={{ position:'absolute', top:0, left:0, width:'35%', height:'100%',
        background:'linear-gradient(90deg,transparent,rgba(37,99,235,0.55),transparent)' }}
    />
  </div>
);

/* ── Animated background blob ──────────────────────────── */
const AnimatedBlob = ({ color1, color2, delay = 0, style = {} }) => (
  <motion.div
    animate={{
      borderRadius: [
        '40% 60% 70% 30% / 40% 50% 60% 50%',
        '60% 40% 30% 70% / 60% 30% 70% 40%',
        '40% 60% 70% 30% / 40% 50% 60% 50%',
      ],
      x: [0, 50, 0],
      y: [0, 70, 0],
    }}
    transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay }}
    style={{
      position: 'absolute',
      background: `radial-gradient(circle at center, ${color1}, ${color2}, transparent)`,
      filter: 'blur(90px)',
      opacity: 0.35,
      zIndex: 0,
      pointerEvents: 'none',
      ...style,
    }}
  />
);

/* ── Floating particle dots ─────────────────────────────── */
const Particle = ({ x, y, delay, size }) => (
  <motion.div
    animate={{ y: [0, -18, 0], opacity: [0.3, 0.8, 0.3] }}
    transition={{ duration: 3 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    style={{
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'var(--accent-primary)',
      pointerEvents: 'none',
      zIndex: 0,
    }}
  />
);

/* ── Stat item ──────────────────────────────────────────── */
const StatItem = ({ value, label, delay = 0 }) => (
  <Reveal delay={delay} direction="up">
    <div style={{ textAlign: 'center', padding: '1.5rem' }}>
      <div
        className="text-gradient"
        style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1 }}
      >
        {value}
      </div>
      <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.5rem', fontSize: '0.95rem' }}>
        {label}
      </div>
    </div>
  </Reveal>
);

/* ── Feature card ───────────────────────────────────────── */
const FeatureCard = ({ icon, title, desc, to, linkText, delay = 0 }) => (
  <Reveal delay={delay} direction="up">
    <Card
      className="feature-card border-gradient"
      style={{
        padding: '2.5rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s ease',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = '0 24px 50px rgba(37,99,235,0.18)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '18px',
          background: 'rgba(37,99,235,0.1)',
          border: '1px solid rgba(37,99,235,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.75rem',
        }}
      >
        {icon}
      </div>
      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.3px' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '2rem', flex: 1 }}>{desc}</p>
      <Link
        to={to}
        className="text-gradient"
        style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
      >
        {linkText} <ArrowRight size={14} />
      </Link>
    </Card>
  </Reveal>
);

/* ── Step ───────────────────────────────────────────────── */
const Step = ({ num, title, desc, delay = 0 }) => (
  <Reveal delay={delay} direction="left">
    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem', alignItems: 'flex-start' }}>
      <div
        className="text-gradient"
        style={{ fontSize: '2rem', fontWeight: 900, opacity: 0.6, flexShrink: 0, lineHeight: 1, minWidth: '2.5rem' }}
      >
        {num}
      </div>
      <div>
        <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{title}</h4>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{desc}</p>
      </div>
    </div>
  </Reveal>
);

/* ── Main Component ─────────────────────────────────────── */
const Home = () => {
  const { siteLogo, youtubeWatchUrl, youtubeSubscribeUrl } = useBranding();
  const parallaxOffset = useParallax(0.08);
  const [liveStats, setLiveStats] = useState({ courses: '...', members: '2.5K+', posts: '...', countries: '10+' });

  /* Legacy fade-in observer for .fade-in classes */
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => e.target.classList.toggle('visible', e.isIntersecting)),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // Live stats
    Promise.all([
      fetch('http://localhost:5001/api/courses').then(r => r.json()).catch(() => []),
      fetch('http://localhost:5001/api/posts').then(r => r.json()).catch(() => []),
      fetch('http://localhost:5001/api/about/stats').then(r => r.json()).catch(() => ({})),
    ]).then(([courses, posts, about]) => {
      setLiveStats({
        courses:   Array.isArray(courses) ? courses.length + '+' : '0+',
        members:   about.students ? Number(about.students).toLocaleString() + '+' : '2.5K+',
        posts:     Array.isArray(posts) ? posts.length + '+' : '0+',
        countries: about.countries ? about.countries + '+' : '10+',
      });
    });

    return () => observer.disconnect();
  }, []);

  /* Stagger variants */
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <div style={{ overflow: 'hidden' }}>

      {/* ── Background Atmosphere ───────────────────────── */}
      <AnimatedBlob
        color1="rgba(16,185,129,0.6)"
        color2="rgba(16,185,129,0.1)"
        delay={0}
        style={{ width: '500px', height: '500px', top: '-10%', left: '-8%' }}
      />
      <AnimatedBlob
        color1="rgba(37,99,235,0.55)"
        color2="rgba(37,99,235,0.05)"
        delay={4}
        style={{ width: '600px', height: '600px', top: '5%', right: '-12%' }}
      />
      <AnimatedBlob
        color1="rgba(99,102,241,0.4)"
        color2="rgba(99,102,241,0.05)"
        delay={8}
        style={{ width: '400px', height: '400px', top: '40%', left: '45%' }}
      />

      {/* Floating particles */}
      {[
        { x: 10, y: 15, delay: 0, size: '5px' },
        { x: 85, y: 20, delay: 1.2, size: '4px' },
        { x: 50, y: 8,  delay: 0.6, size: '6px' },
        { x: 25, y: 70, delay: 2,   size: '4px' },
        { x: 75, y: 65, delay: 1.5, size: '5px' },
        { x: 60, y: 85, delay: 0.9, size: '3px' },
      ].map((p, i) => <Particle key={i} {...p} />)}

      {/* ── Hero ──────────────────────────────────────────── */}
      <section
        style={{
          minHeight: '92vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          padding: '6rem 0',
        }}
      >
        {/* Parallax watermark */}
        {siteLogo && (
          <img
            src={`http://localhost:5001${siteLogo}`}
            alt="Background Logo"
            className="hero-watermark absolute pointer-events-none select-none"
            style={{
              top: '50%',
              left: '50%',
              width: 'clamp(300px, 50vw, 600px)',
              aspectRatio: '1 / 1',
              zIndex: 0,
              transform: `translate(-50%, calc(-50% + ${parallaxOffset}px))`,
            }}
          />
        )}

        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div variants={itemVariants}>
              <div
                className="glass pulse-glow"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '99px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  marginBottom: '2rem',
                  color: 'var(--accent-primary)',
                  border: '1px solid rgba(37,99,235,0.25)',
                }}
              >
                <Sparkles size={15} /> Precision-Engineered Trading Experience
              </div>
            </motion.div>

            {/* H1 */}
            <motion.h1
              variants={itemVariants}
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(3rem, 8vw, 5.5rem)',
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: '-2px',
                marginBottom: '1.75rem',
              }}
            >
              Elevate Your Edge.<br />
              <span className="text-gradient">Fund Your Vision.</span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              variants={itemVariants}
              style={{
                fontSize: '1.2rem',
                color: 'var(--text-secondary)',
                maxWidth: '640px',
                margin: '0 auto 3rem',
                lineHeight: 1.8,
              }}
            >
              Access elite market insights and institutional-grade prop firm analysis.
              Built for traders who demand excellence.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/courses" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.05rem' }}>
                Scale Your Skills <ArrowRight size={16} />
              </Link>
              <Link
                to="/prop-firms"
                className="btn btn-outline"
                style={{ padding: '1rem 2.5rem', fontSize: '1.05rem' }}
              >
                Compare Firms
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              variants={itemVariants}
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '2rem',
                marginTop: '3rem',
                flexWrap: 'wrap',
              }}
            >
              {[
                { icon: <Shield size={15} />, text: 'Verified Data' },
                { icon: <Zap size={15} />, text: 'Real-time Updates' },
                { icon: <TrendingUp size={15} />, text: '400+ Members' },
              ].map(({ icon, text }) => (
                <div
                  key={text}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  <span style={{ color: 'var(--accent-primary)' }}>{icon}</span>
                  {text}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 1 — Prop Firms ───────────────────────── */}
      <section style={{ padding: '8rem 0', position: 'relative', overflow: 'hidden' }}>
        <FloatOrb color="rgba(16,185,129,0.1)" size="500px" style={{ bottom:'-10%', left:'25%' }} />
        <div className="container" style={{ position:'relative', zIndex:1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5rem', flexWrap: 'wrap' }}>

            {/* Left — visual steps */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once:true, margin:'-60px' }} variants={vFadeLeft} style={{ flex:'1 1 340px' }}>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once:true, margin:'-60px' }} variants={vStagger}
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                {[
                  { step: '01', title: 'Browse Firms', desc: 'Compare rules, fees, and payout structures side by side.' },
                  { step: '02', title: 'Pick Your Eval', desc: 'Choose the challenge that fits your trading style.' },
                  { step: '03', title: 'Get Funded', desc: 'Pass the eval and start trading with real capital.' },
                ].map(({ step, title, desc }) => (
                  <motion.div key={step} variants={vFadeLeft}
                    whileHover={{ x:6, boxShadow:'0 8px 28px rgba(16,185,129,0.12)' }}
                    style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.25rem 1.5rem' }}
                  >
                    <motion.div whileHover={{ rotate:360 }} transition={{ duration:0.5 }}
                      style={{ flexShrink: 0, width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.78rem', color: '#10b981' }}
                    >{step}</motion.div>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2px' }}>{title}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — text */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once:true, margin:'-60px' }} variants={vFadeRight} style={{ flex:'1 1 340px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', padding: '5px 16px', borderRadius: '99px', color: '#10b981', fontWeight: 700, fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                <Trophy size={14} /> Prop Firm Marketplace
              </div>
              <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1.15, marginBottom: '1.25rem' }}>
                Get Funded & Start<br /><span style={{ background: 'linear-gradient(135deg,#10b981,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Earning Real Money</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '2rem', maxWidth: '480px' }}>
                Browse the top prop firms we've verified and audited. Buy an evaluation account, pass the challenge using our strategies, and trade with funded capital — keeping up to 90% of profits.
              </p>
              <Link to="/prop-firms"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.85rem 2rem', borderRadius: '12px', background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff', fontWeight: 800, fontSize: '0.95rem', textDecoration: 'none', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}
              >
                <Trophy size={18} /> Browse Prop Firms <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <ShimmerDiv />

      {/* ── SECTION 2 — YouTube Live ─────────────────────── */}
      <section style={{ padding: '8rem 0', position: 'relative', overflow: 'hidden' }}>
        {/* Red glow blob */}
        <div style={{ position: 'absolute', top: '10%', right: '-5%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,0,0,0.08), transparent 70%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position:'relative', zIndex:1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5rem', flexWrap: 'wrap', flexDirection: 'row-reverse' }}>

            {/* Right — YouTube preview card */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once:true, margin:'-60px' }} variants={vFadeRight} style={{ flex:'1 1 340px' }}>
              <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(255,0,0,0.15)', border: '1px solid rgba(255,0,0,0.15)' }}>
                <div style={{ background: 'linear-gradient(135deg, #1a0000, #0d0d0d)', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px', gap: '1.25rem' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff0000, #cc0000)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(255,0,0,0.4)', animation: 'pulse 2s infinite' }}>
                    <YoutubeSVG size={36} color="#fff" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,0,0,0.15)', border: '1px solid rgba(255,0,0,0.3)', padding: '4px 14px', borderRadius: '99px', color: '#ff4444', fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ff4444', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                      Live Every Day
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: 0 }}>Join the daily trading session — free</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Left — text */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once:true, margin:'-60px' }} variants={vFadeLeft} style={{ flex:'1 1 340px' }}>

              {/* Blurred content + Coming Soon overlay */}
              <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', marginBottom: '2rem' }}>
                {/* Blurred text */}
                <div style={{ filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,0,0,0.08)', border: '1px solid rgba(255,0,0,0.2)', padding: '5px 16px', borderRadius: '99px', color: '#ff6666', fontWeight: 700, fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                    <YoutubeSVG size={14} color="currentColor" /> YouTube Community
                  </div>
                  <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1.15, marginBottom: '1.25rem' }}>
                    Trade Live With Us<br /><span style={{ background: 'linear-gradient(135deg,#ff4444,#ff8888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Every Single Day — Free</span>
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem', maxWidth: '480px' }}>
                    Join our live YouTube sessions every morning. We break down the market structure, call key levels, and trade in real time — completely free, no strings attached.
                  </p>
                </div>

                {/* Coming Soon moving text */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <motion.span
                    animate={{ x: ['-35%', '35%', '-35%'] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
                      fontWeight: 900,
                      letterSpacing: '-1px',
                      whiteSpace: 'nowrap',
                      color: 'rgba(255,255,255,0.92)',
                      textShadow: '0 0 40px rgba(255,60,60,0.7), 0 2px 24px rgba(0,0,0,0.9)',
                    }}
                  >
                    Coming Soon...
                  </motion.span>
                </div>
              </div>

              {/* Buttons — clear and fully clickable */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <a href={youtubeWatchUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.85rem 2rem', borderRadius: '12px', background: 'linear-gradient(135deg,#ff0000,#cc0000)', color: '#fff', fontWeight: 800, fontSize: '0.95rem', textDecoration: 'none', boxShadow: '0 8px 24px rgba(255,0,0,0.35)', transition: 'opacity 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity='0.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity='1'}
                >
                  <YoutubeSVG size={18} color="currentColor" /> Watch Live Now
                </a>
                <a href={youtubeSubscribeUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.85rem 2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,0,0,0.4)'; e.currentTarget.style.color='#ff6666'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.color='var(--text-secondary)'; }}
                >
                  Subscribe Free
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <ShimmerDiv />

      {/* ── SECTION 3 — Courses ──────────────────────────── */}
      <section style={{ padding: '8rem 0', position: 'relative', overflow: 'hidden' }}>
        <FloatOrb color="rgba(37,99,235,0.12)" size="500px" style={{ top:'10%', right:'-6%' }} />
        <FloatOrb color="rgba(139,92,246,0.08)" size="300px" style={{ bottom:'0%', left:'20%' }} />
        <div className="container" style={{ position:'relative', zIndex:1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5rem', flexWrap: 'wrap' }}>

            {/* Left — visual */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once:true, margin:'-60px' }} variants={vFadeLeft} style={{ flex:'1 1 340px' }}>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once:true, margin:'-60px' }} variants={vStagger}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
              >
                {[
                  { icon: '📈', label: 'Market Structure', color: 'rgba(37,99,235,0.15)' },
                  { icon: '⚡', label: 'Scalping Mastery', color: 'rgba(139,92,246,0.15)' },
                  { icon: '🎯', label: 'Entry & Exit', color: 'rgba(16,185,129,0.15)' },
                  { icon: '🛡️', label: 'Risk Management', color: 'rgba(245,158,11,0.15)' },
                ].map(({ icon, label, color }) => (
                  <motion.div key={label} variants={vPop} whileHover={{ y:-6, scale:1.05, boxShadow:'0 14px 32px rgba(0,0,0,0.2)' }}
                    style={{ background: color, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '1.5rem', textAlign: 'center', cursor:'default' }}
                  >
                    <motion.div animate={{ rotate:[0,10,-10,0] }} transition={{ duration:3, repeat:Infinity, repeatDelay:2 }}
                      style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
                    >{icon}</motion.div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — text */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once:true, margin:'-60px' }} variants={vFadeRight} style={{ flex:'1 1 340px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)', padding: '5px 16px', borderRadius: '99px', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                <BookOpen size={14} /> Trading Education
              </div>
              <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1.15, marginBottom: '1.25rem' }}>
                Learn to Trade Like<br /><span className="text-gradient">a Professional</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '2rem', maxWidth: '480px' }}>
                From market structure to advanced scalping strategies — our courses are built for traders who are serious about getting funded and staying funded. Step-by-step, no fluff.
              </p>
              <Link to="/courses"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.85rem 2rem', borderRadius: '12px', background: 'linear-gradient(135deg,var(--accent-secondary),var(--accent-primary))', color: '#fff', fontWeight: 800, fontSize: '0.95rem', textDecoration: 'none', boxShadow: '0 8px 24px rgba(37,99,235,0.35)' }}
              >
                <BookOpen size={18} /> Browse Courses <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <ShimmerDiv />

      {/* ── SECTION 4 — Blog ─────────────────────────────── */}
      <section style={{ padding: '8rem 0', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
        <FloatOrb color="rgba(99,102,241,0.1)" size="600px" style={{ top:'-20%', left:'50%', transform:'translateX(-50%)' }} />
        <div className="container" style={{ maxWidth: '860px', position: 'relative', zIndex: 1 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true, margin:'-60px' }} variants={vFadeUp2}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', padding: '5px 16px', borderRadius: '99px', color: '#818cf8', fontWeight: 700, fontSize: '0.82rem', marginBottom: '1.5rem' }}>
              <Rss size={14} /> Daily Market Posts
            </div>
            <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1.15, marginBottom: '1.25rem' }}>
              Stay Ahead With Our<br /><span style={{ background: 'linear-gradient(135deg,#6366f1,#a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Daily Trading Posts</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '3rem', maxWidth: '560px', margin: '0 auto 3rem' }}>
              We publish fresh market breakdowns, trade ideas, and economic analysis every day. Actionable insights you can use before the market opens — all in one place.
            </p>

            {/* 3 preview pills */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once:true, margin:'-40px' }} variants={vStagger}
              style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '3rem' }}
            >
              {['📊 Market Structure', '📰 Economic Calendar', '🎯 Trade Ideas', '⚡ Scalping Setups', '🌍 Global Macro'].map(tag => (
                <motion.span key={tag} variants={vPop} whileHover={{ scale:1.12, y:-3, background:'rgba(99,102,241,0.22)' }}
                  style={{ padding: '6px 18px', borderRadius: '99px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', fontWeight: 700, fontSize: '0.82rem', cursor:'default', display:'inline-block' }}
                >{tag}</motion.span>
              ))}
            </motion.div>

            <Link to="/blog"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.9rem 2.25rem', borderRadius: '12px', background: 'linear-gradient(135deg,#4f46e5,#6366f1)', color: '#fff', fontWeight: 800, fontSize: '0.95rem', textDecoration: 'none', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}
            >
              <Rss size={18} /> Read Daily Posts <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default Home;

