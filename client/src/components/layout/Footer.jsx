import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBranding } from '../../context/BrandingContext';
import { Youtube, Twitter, TrendingUp, BookOpen, Building2, FileText, Info, Mail, Shield, ChevronRight } from 'lucide-react';

const FooterLink = ({ to, href, children }) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    color: 'var(--text-secondary)', textDecoration: 'none',
    fontSize: '0.9rem', fontWeight: 500, lineHeight: 2,
    transition: 'color 0.2s',
  };
  const hover = { color: 'var(--text-primary)' };
  if (href) return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={base}
      onMouseEnter={e => Object.assign(e.currentTarget.style, hover)}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
    >{children}</a>
  );
  return (
    <Link to={to} style={base}
      onMouseEnter={e => Object.assign(e.currentTarget.style, hover)}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
    >{children}</Link>
  );
};

const SocialBtn = ({ href, icon: Icon, label, color }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
    style={{ width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'all 0.22s' }}
    onMouseEnter={e => { e.currentTarget.style.background = color; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.transform = 'translateY(0)'; }}
  >
    <Icon size={16} />
  </a>
);

const Footer = () => {
  const { siteName, siteLogo } = useBranding();
  const [stats, setStats] = useState({ courses: 0, posts: 0, countries: 0 });

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:5000/api/courses').then(r => r.json()).catch(() => []),
      fetch('http://localhost:5000/api/posts').then(r => r.json()).catch(() => []),
      fetch('http://localhost:5000/api/admin/analytics/countries', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(r => r.ok ? r.json() : {}).catch(() => ({})),
    ]).then(([courses, posts, geo]) => {
      setStats({
        courses: Array.isArray(courses) ? courses.length : 0,
        posts:   Array.isArray(posts)   ? posts.length   : 0,
        countries: geo?.totalCountries ?? 0,
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
              Join thousands of traders already using our platform — free to start.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '0.75rem 1.75rem', borderRadius: '12px', background: 'linear-gradient(135deg,var(--accent-secondary),var(--accent-primary))', color: '#fff', fontWeight: 800, fontSize: '0.9rem', textDecoration: 'none', boxShadow: '0 6px 20px rgba(37,99,235,0.3)' }}>
              Get Started Free <ChevronRight size={15} />
            </Link>
            <a href="https://www.youtube.com/@RobertFuturesTrades" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '0.75rem 1.75rem', borderRadius: '12px', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)', color: '#ff6666', fontWeight: 800, fontSize: '0.9rem', textDecoration: 'none' }}>
              <Youtube size={16} /> Watch Live
            </a>
          </div>
        </div>
      </div>

      {/* ── Main footer grid ─────────────────────────────── */}
      <div className="container" style={{ padding: '4rem 0 3rem', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '3rem', flexWrap: 'wrap' }}>

        {/* Brand column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
            {siteLogo ? (
              <img src={`http://localhost:5000${siteLogo}`} alt={siteName} style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
            ) : (
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--gradient-lotus)', boxShadow: '0 0 10px rgba(37,99,235,0.6)' }} />
            )}
            <span style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.3px' }} className="text-gradient">{siteName}</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.8, maxWidth: '280px', marginBottom: '1.5rem' }}>
            Premium trading education, daily live sessions on YouTube, prop firm marketplace and market intelligence — all in one place.
          </p>

          {/* Live stats pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {[
              { label: `${stats.courses} Courses`, color: 'rgba(37,99,235,0.12)', text: '#60a5fa' },
              { label: `${stats.posts} Posts`, color: 'rgba(99,102,241,0.12)', text: '#a5b4fc' },
              { label: `${stats.countries || '10'}+ Countries`, color: 'rgba(16,185,129,0.12)', text: '#34d399' },
            ].map(({ label, color, text }) => (
              <span key={label} style={{ padding: '3px 12px', borderRadius: '99px', background: color, color: text, fontWeight: 700, fontSize: '0.75rem', border: `1px solid ${color.replace('0.12', '0.25')}` }}>{label}</span>
            ))}
          </div>

          {/* Socials */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <SocialBtn href="https://www.youtube.com/@RobertFuturesTrades" icon={Youtube}   label="YouTube"   color="#ff0000" />
            <SocialBtn href="https://twitter.com/"   icon={Twitter}   label="Twitter"   color="#1d9bf0" />
            <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
              style={{ width: "38px", height: "38px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-secondary)", textDecoration: "none", transition: "all 0.22s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#e1306c"; e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
            </a>
          </div>
        </div>

        {/* Learn */}
        <div>
          <h4 style={{ fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Learn</h4>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FooterLink to="/courses"><BookOpen size={13} /> All Courses</FooterLink>
            <FooterLink href="https://www.youtube.com/@RobertFuturesTrades"><Youtube size={13} /> Live Sessions</FooterLink>
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
            {['Terms of Service', 'Privacy Policy', 'Cookie Policy'].map(t => (
              <a key={t} href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              >{t}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
