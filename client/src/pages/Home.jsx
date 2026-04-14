import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../components/common/Card';
import Reveal from '../components/common/Reveal';
import { useBranding } from '../context/BrandingContext';
import { useParallax } from '../hooks/useScrollReveal';
import { Scale, Gem, Newspaper, Sparkles, ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react';

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
  const { siteLogo } = useBranding();
  const parallaxOffset = useParallax(0.08);

  /* Legacy fade-in observer for .fade-in classes */
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => e.target.classList.toggle('visible', e.isIntersecting)),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
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
            src={`http://localhost:5000${siteLogo}`}
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
                { icon: <TrendingUp size={15} />, text: '2,500+ Members' },
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

      {/* Gradient divider */}
      <div
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)',
          opacity: 0.25,
          margin: '0 5%',
        }}
      />

      {/* ── Stats ─────────────────────────────────────────── */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem value="2.5K+" label="Active Members" delay={0} />
            <StatItem value="$18M+" label="Member Funding" delay={80} />
            <StatItem value="50+"   label="Deep Dives"      delay={160} />
            <StatItem value="100%"  label="Unbiased"        delay={240} />
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
          margin: '0 5%',
        }}
      />

      {/* ── Features ──────────────────────────────────────── */}
      <section style={{ padding: '8rem 0' }}>
        <div className="container">
          <Reveal direction="up">
            <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
              <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>
                Engineered for <span className="text-gradient">Performance</span>
              </h2>
              <div style={{ height: '4px', width: '60px', background: 'var(--gradient-lotus)', margin: '0 auto', borderRadius: '4px' }} />
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <FeatureCard
              delay={0}
              icon={<Scale size={30} style={{ color: 'var(--accent-primary)' }} />}
              title="Transparent Analysis"
              desc="We audit the rules, fine print, and track record of every major prop firm. No fluff, just the facts."
              to="/prop-firms"
              linkText="View Audits"
            />
            <FeatureCard
              delay={100}
              icon={<Gem size={30} style={{ color: 'var(--accent-primary)' }} />}
              title="Elite Education"
              desc="Master high-probability setups and the institutional mindset. Designed for professional advancement."
              to="/courses"
              linkText="Explore Courses"
            />
            <FeatureCard
              delay={200}
              icon={<Newspaper size={30} style={{ color: 'var(--accent-primary)' }} />}
              title="Market Intelligence"
              desc="Daily strategic breakdowns of market context, sentiment, and major economic catalysts."
              to="/blog"
              linkText="Read Intel"
            />
          </div>
        </div>
      </section>

      {/* ── The Path ──────────────────────────────────────── */}
      <section style={{ padding: '8rem 0' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <Reveal direction="up">
            <div
              className="glass"
              style={{
                padding: 'clamp(2.5rem, 6vw, 5rem)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Inner glow */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(ellipse at 50% -10%, rgba(37,99,235,0.1), transparent 65%)',
                  pointerEvents: 'none',
                }}
              />
              <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontFamily: 'var(--font-serif)', marginBottom: '4rem', position: 'relative' }}>
                The Road to <span className="text-gradient">Freedom</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '0 3rem', position: 'relative' }}>
                <Step num="I"   title="Foundation"  desc="Master the mechanics of market structure and professional risk management."          delay={0} />
                <Step num="II"  title="Selection"   desc="Identify the funding partner that aligns with your specific trading style."         delay={80} />
                <Step num="III" title="Challenge"   desc="Apply elite strategies with the backing of our insights to secure your capital."    delay={160} />
                <Step num="IV"  title="Scaling"     desc="Grow your funded capital and achieve the lifestyle you've engineered."              delay={240} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section style={{ padding: '8rem 0', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <AnimatedBlob
          color1="rgba(37,99,235,0.4)"
          color2="transparent"
          delay={2}
          style={{ width: '700px', height: '700px', top: '-40%', left: '50%', transform: 'translateX(-50%)' }}
        />
        <div className="container" style={{ maxWidth: '800px', position: 'relative', zIndex: 1 }}>
          <Reveal direction="up">
            <h2 style={{ fontSize: 'clamp(2.5rem,6vw,4rem)', fontFamily: 'var(--font-serif)', marginBottom: '1.5rem', letterSpacing: '-1px' }}>
              Define Your <span className="text-gradient">Future</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.2rem', lineHeight: 1.7 }}>
              Secure your place in the future of trading education.
            </p>
            <Link
              to="/register"
              className="btn btn-primary pulse-glow"
              style={{ padding: '1.25rem 4rem', fontSize: '1.15rem', borderRadius: '99px' }}
            >
              Get Started Now <ArrowRight size={18} />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default Home;
