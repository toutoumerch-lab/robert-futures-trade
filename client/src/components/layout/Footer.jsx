import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBranding } from '../../context/BrandingContext';
import { TrendingUp, BookOpen, Building2, FileText, Info, Mail, Shield, ChevronRight } from 'lucide-react';

/* ── Inline SVGs for social icons not in this lucide version ── */
const YoutubeSVG = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"/>
  </svg>
);

const TwitterSVG = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const InstagramSVG = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

const SocialBtn = ({ href, Icon, label, hoverBg }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
    style={{ width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'all 0.22s' }}
    onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.transform = 'translateY(0)'; }}
  >
    <Icon />
  </a>
);

const FooterLink = ({ to, href, children }) => {
  const base = { display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, lineHeight: 2, transition: 'color 0.2s' };
  if (href) return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={base}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
    >{children}</a>
  );
  return (
    <Link to={to} style={base}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
    >{children}</Link>
  );
};

const Footer = () => {
  const { siteName, siteLogo } = useBranding();
  const [stats, setStats] = useState({ courses: 0, posts: 0, countries: 0 });

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/api/courses`).then(r => r.json()).catch(() => []),
      fetch(`${import.meta.env.VITE_API_URL}/api/posts`).then(r => r.json()).catch(() => []),
    ]).then(([courses, posts]) => {
      setStats({
        courses:   Array.isArray(courses) ? courses.length : 0,
        posts:     Array.isArray(posts)   ? posts.length   : 0,
        countries: 1,
      });
    });
  }, []);

  const year = new Date().getFullYear();

  return (
    <footer style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'var(--bg-primary)' }}>

      {/* ── CTA band ─────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '3rem 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.35rem', letterSpacing: '-0.5px', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
              Ready to start trading funded?
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
              Join traders already using our platform — free to start.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '0.75rem 1.75rem', borderRadius: '12px', background: 'linear-gradient(135deg,var(--accent-secondary),var(--accent-primary))', color: '#fff', fontWeight: 800, fontSize: '0.9rem', textDecoration: 'none', boxShadow: '0 6px 20px rgba(37,99,235,0.3)' }}>
              Get Started Free <ChevronRight size={15} />
            </Link>
            <a href="https://www.youtube.com/@RobertFuturesTrades" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '0.75rem 1.75rem', borderRadius: '12px', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)', color: '#ff6666', fontWeight: 800, fontSize: '0.9rem', textDecoration: 'none' }}>
              <YoutubeSVG /> Watch Live
            </a>
          </div>
        </div>
      </div>

      {/* ── Main grid ────────────────────────────────────── */}
      <div className="container" style={{ padding: '4rem 0 3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem' }}>

        {/* Brand */}
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
            {siteLogo
              ? <img src={`${import.meta.env.VITE_API_URL}${siteLogo}`} alt={siteName} style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
              : <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--gradient-lotus)', boxShadow: '0 0 10px rgba(37,99,235,0.6)' }} />
            }
            <span style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.3px' }} className="text-gradient">{siteName}</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.8, maxWidth: '280px', marginBottom: '1.5rem' }}>
            Premium trading education, daily live sessions on YouTube, prop firm marketplace and market intelligence.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {[
              { label: `${stats.courses} Courses`, color: 'rgba(37,99,235,0.12)', text: '#60a5fa', border: 'rgba(37,99,235,0.25)' },
              { label: `${stats.posts} Posts`,   color: 'rgba(99,102,241,0.12)', text: '#a5b4fc', border: 'rgba(99,102,241,0.25)' },
              { label: `${stats.countries}+ Countries`, color: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.25)' },
            ].map(({ label, color, text, border }) => (
              <span key={label} style={{ padding: '3px 12px', borderRadius: '99px', background: color, color: text, fontWeight: 700, fontSize: '0.75rem', border: `1px solid ${border}` }}>{label}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <SocialBtn href="https://www.youtube.com/@RobertFuturesTrades" Icon={YoutubeSVG}   label="YouTube"   hoverBg="#ff0000" />
            <SocialBtn href="https://twitter.com/"   Icon={TwitterSVG}   label="Twitter"   hoverBg="#1d9bf0" />
            <SocialBtn href="https://instagram.com/" Icon={InstagramSVG} label="Instagram" hoverBg="#e1306c" />
          </div>
        </div>

        {/* Learn */}
        <div>
          <h4 style={{ fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Learn</h4>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FooterLink to="/courses"><BookOpen size={13} /> All Courses</FooterLink>
            <FooterLink href="https://www.youtube.com/@RobertFuturesTrades"><span style={{ display: 'inline-flex' }}><YoutubeSVG /></span> Live Sessions</FooterLink>
            <FooterLink to="/blog"><FileText size={13} /> Daily Blog</FooterLink>
          </div>
        </div>

        {/* Trade */}
        <div>
          <h4 style={{ fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Trade</h4>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FooterLink to="/prop-firms"><Building2 size={13} /> Prop Firms</FooterLink>
            <FooterLink to="/prop-firms"><TrendingUp size={13} /> Eval Accounts</FooterLink>
          </div>
        </div>

        {/* Company */}
        <div>
          <h4 style={{ fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Company</h4>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FooterLink to="/about"><Info size={13} /> About Us</FooterLink>
            <FooterLink to="/contact"><Mail size={13} /> Contact</FooterLink>
            <FooterLink to="#"><Shield size={13} /> Privacy Policy</FooterLink>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            © {year} <strong style={{ color: 'var(--text-primary)' }}>{siteName}</strong>. All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
              <Link to="/terms" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                Terms of Service
              </Link>
              <Link to="/privacy" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                Privacy Policy
              </Link>
              <Link to="/cookie-policy" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                Cookie Policy
              </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
