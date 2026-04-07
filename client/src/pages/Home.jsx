import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../components/common/Card';
import { useBranding } from '../context/BrandingContext';

const StatItem = ({ value, label }) => (
  <div className="stat-item text-center">
    <div className="stat-value text-gradient" style={{ fontSize: '2.5rem', fontWeight: '800' }}>{value}</div>
    <div className="stat-label" style={{ fontWeight: '500', opacity: 0.8 }}>{label}</div>
  </div>
);

const FeatureCard = ({ icon, title, desc, to, linkText }) => (
  <Card className="feature-card border-gradient" style={{ padding: '2.5rem' }}>
    <div className="feature-icon" style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>{icon}</div>
    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{title}</h3>
    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '2rem' }}>{desc}</p>
    <Link to={to} className="text-gradient" style={{ fontWeight: '600' }}>{linkText} â†’</Link>
  </Card>
);

const AnimatedBlob = ({ className, color1, color2, delay = 0, size = '400px' }) => (
  <motion.div
    className={`watercolor-blob ${className}`}
    animate={{
      borderRadius: ["40% 60% 70% 30% / 40% 50% 60% 50%", "60% 40% 30% 70% / 60% 30% 70% 40%", "40% 60% 70% 30% / 40% 50% 60% 50%"],
      x: [0, 40, 0],
      y: [0, 60, 0],
    }}
    transition={{
      duration: 12,
      repeat: Infinity,
      ease: "easeInOut",
      delay
    }}
    style={{
      position: 'absolute',
      width: size,
      height: size,
      background: `radial-gradient(circle at center, ${color1}, ${color2}, transparent)`,
      filter: 'blur(80px)',
      opacity: 0.4,
      zIndex: -1,
    }}
  />
);

const Step = ({ num, title, desc }) => (
  <div className="step-item flex gap-6 mb-12">
    <div className="step-num text-gradient" style={{ fontSize: '1.5rem', fontWeight: '800', opacity: 0.5 }}>{num}</div>
    <div>
      <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{title}</h4>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
    </div>
  </div>
);

const Home = () => {
  const { siteLogo } = useBranding();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => e.target.classList.toggle('visible', e.isIntersecting)),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ overflow: 'hidden' }}>
      {/* â”€â”€ Background Blobs (Surgical Placement) â”€â”€ */}
      <AnimatedBlob className="blob-hero-1" color1="var(--accent-teal)" color2="rgba(16, 185, 129, 0)" style={{ top: '-10%', left: '10%' }} />
      <AnimatedBlob className="blob-hero-2" color1="var(--accent-primary)" color2="rgba(37, 99, 235, 0)" delay={3} style={{ top: '20%', right: '5%' }} size="500px" />
      
      {/* â”€â”€ Hero â”€â”€ */}
      <section className="hero-section" style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', position: 'relative' }}>
        
        {/* Static Background Image from Branding */}
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
              zIndex: 0
            }}
          />
        )}

        <div className="container text-center" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-badge fade-in inline-block py-2 px-6 mb-8 glass" style={{ borderRadius: 'var(--radius-full)', fontWeight: '600', fontSize: '0.9rem' }}>
            âœ¨ Precision-Engineered Trading Experience
          </div>
          <h1 className="hero-title fade-in" style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(3rem, 8vw, 5rem)', marginBottom: '1.5rem' }}>
            Elevate Your Edge.<br />
            <span className="text-gradient">Fund Your Vision.</span>
          </h1>
          <p className="hero-sub fade-in" style={{ fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto 3rem', color: 'var(--text-secondary)' }}>
            Access elite market insights and institutional-grade prop firm analysis.
            Built for traders who demand excellence.
          </p>
          <div className="flex justify-center gap-6 fade-in">
            <Link to="/courses" className="btn btn-primary">
              Scale Your Skills
            </Link>
            <Link to="/prop-firms" className="btn btn-outline">
              Compare Firms
            </Link>
          </div>
        </div>
      </section>

      {/* â”€â”€ Stats â”€â”€ */}
      <section className="fade-in" style={{ padding: '4rem 0' }}>
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem value="2.5K+" label="Active Members" />
            <StatItem value="$18M+" label="Member Funding" />
            <StatItem value="50+" label="Deep Dives" />
            <StatItem value="100%" label="Unbiased" />
          </div>
        </div>
      </section>

      {/* â”€â”€ Features â”€â”€ */}
      <section className="section-pad fade-in">
        <div className="container">
          <div className="section-header text-center mb-20">
            <h2 style={{ fontSize: '3rem', marginBottom: '1rem', fontFamily: 'var(--font-serif)' }}>
              Engineered for <span className="text-gradient">Performance</span>
            </h2>
            <div style={{ height: '4px', width: '60px', background: 'var(--gradient-lotus)', margin: '0 auto', borderRadius: '4px' }}></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <FeatureCard
              icon="âš–ï¸"
              title="Transparent Analysis"
              desc="We audit the rules, the fine print, and the track record of every major prop firm. No fluff, just the facts."
              to="/prop-firms"
              linkText="View Audits"
            />
            <FeatureCard
              icon="ðŸ’Ž"
              title="Elite Education"
              desc="Master high-probability setups and the institutional mindset. Designed for professional advancement."
              to="/courses"
              linkText="Explore Courses"
            />
            <FeatureCard
              icon="ðŸ—žï¸"
              title="Market Intelligence"
              desc="Daily strategic breakdowns of market context, sentiment, and major economic catalysts."
              to="/blog"
              linkText="Read Intel"
            />
          </div>
        </div>
      </section>

      {/* â”€â”€ Path â”€â”€ */}
      <section className="section-pad fade-in">
        <div className="container" style={{ maxWidth: '900px' }}>
          <div className="glass" style={{ padding: '5rem', borderRadius: 'var(--radius-xl)' }}>
            <h2 className="text-center mb-16" style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)' }}>
              The Road to <span className="text-gradient">Freedom</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
              <Step num="I" title="Foundation" desc="Master the mechanics of market structure and professional risk management." />
              <Step num="II" title="Selection" desc="Identify the funding partner that aligns with your specific trading style." />
              <Step num="III" title="Challenge" desc="Apply elite strategies with the backing of our insights to secure your capital." />
              <Step num="IV" title="Scaling" desc="Grow your funded capital and achieve the lifestyle you've engineered." />
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ CTA â”€â”€ */}
      <section className="section-pad text-center fade-in">
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 className="mb-6" style={{ fontSize: '3.5rem', fontFamily: 'var(--font-serif)' }}>Define Your <span className="text-gradient">Future</span></h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.25rem' }}>
            Secure your place in the future of trading education.
          </p>
          <Link to="/register" className="btn btn-primary" style={{ padding: '1.25rem 4rem', fontSize: '1.2rem' }}>
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
