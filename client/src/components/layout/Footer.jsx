import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBranding } from '../../context/BrandingContext';
import { TrendingUp, BookOpen, Building2, FileText, Info, Mail, Shield, ChevronRight } from 'lucide-react';

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

const SocialBtn = ({ href, Icon, label, hoverColor }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="ftr-social-btn"
    style={{ '--hover-color': hoverColor }}
  >
    <Icon />
  </a>
);

const FooterLink = ({ to, href, children }) => {
  if (href) return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="ftr-link">{children}</a>
  );
  return <Link to={to} className="ftr-link">{children}</Link>;
};

const Footer = () => {
  const { siteName, siteLogo } = useBranding();
  const [stats, setStats] = useState({ courses: 0, posts: 0 });

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/api/courses`).then(r => r.json()).catch(() => []),
      fetch(`${import.meta.env.VITE_API_URL}/api/posts`).then(r => r.json()).catch(() => []),
    ]).then(([courses, posts]) => {
      setStats({
        courses: Array.isArray(courses) ? courses.length : 0,
        posts:   Array.isArray(posts)   ? posts.length   : 0,
      });
    });
  }, []);

  const year = new Date().getFullYear();

  return (
    <footer className="ftr-root">

      {/* ── CTA band ── */}
      <div className="ftr-cta-band">
        <div className="container ftr-cta-inner">
          <div className="ftr-cta-text">
            <h3 className="ftr-cta-title">Ready to start trading funded?</h3>
            <p className="ftr-cta-sub">Join traders already using our platform — free to start.</p>
          </div>
          <div className="ftr-cta-btns">
            <Link to="/register" className="ftr-cta-primary">
              Get Started Free <ChevronRight size={15} />
            </Link>
            <a
              href="https://www.youtube.com/@RobertFuturesTrades"
              target="_blank"
              rel="noopener noreferrer"
              className="ftr-cta-yt"
            >
              <YoutubeSVG /> Watch Live
            </a>
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="container ftr-grid">

        {/* Brand column */}
        <div className="ftr-brand-col">
          <div className="ftr-brand-row">
            {siteLogo
              ? <img src={`${import.meta.env.VITE_API_URL}${siteLogo}`} alt={siteName} className="ftr-logo-img" />
              : <div className="ftr-logo-dot" />
            }
            <span className="ftr-brand-name text-gradient">{siteName}</span>
          </div>
          <p className="ftr-brand-desc">
            Premium trading education, daily live sessions on YouTube, prop firm marketplace and market intelligence.
          </p>
          <div className="ftr-stat-chips">
            {[
              { label: `${stats.courses} Courses`,  cls: 'chip-blue'  },
              { label: `${stats.posts} Posts`,      cls: 'chip-purple'},
              { label: `1+ Countries`,              cls: 'chip-green' },
            ].map(({ label, cls }) => (
              <span key={label} className={`ftr-chip ${cls}`}>{label}</span>
            ))}
          </div>
          <div className="ftr-socials">
            <SocialBtn href="https://www.youtube.com/@RobertFuturesTrades" Icon={YoutubeSVG}   label="YouTube"   hoverColor="#ff0000" />
            <SocialBtn href="https://twitter.com/"   Icon={TwitterSVG}   label="Twitter"   hoverColor="#1d9bf0" />
            <SocialBtn href="https://instagram.com/" Icon={InstagramSVG} label="Instagram" hoverColor="#e1306c" />
          </div>
        </div>

        {/* Learn */}
        <div className="ftr-col">
          <h4 className="ftr-col-title">Learn</h4>
          <FooterLink to="/courses"><BookOpen size={13} /> All Courses</FooterLink>
          <FooterLink href="https://www.youtube.com/@RobertFuturesTrades"><span className="ftr-link-icon"><YoutubeSVG /></span> Live Sessions</FooterLink>
          <FooterLink to="/blog"><FileText size={13} /> Daily Blog</FooterLink>
        </div>

        {/* Trade */}
        <div className="ftr-col">
          <h4 className="ftr-col-title">Trade</h4>
          <FooterLink to="/prop-firms"><Building2 size={13} /> Prop Firms</FooterLink>
          <FooterLink to="/prop-firms"><TrendingUp size={13} /> Eval Accounts</FooterLink>
        </div>

        {/* Company */}
        <div className="ftr-col">
          <h4 className="ftr-col-title">Company</h4>
          <FooterLink to="/about"><Info size={13} /> About Us</FooterLink>
          <FooterLink to="/contact"><Mail size={13} /> Contact</FooterLink>
          <FooterLink to="#"><Shield size={13} /> Privacy Policy</FooterLink>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="ftr-bottom">
        <div className="container ftr-bottom-inner">
          <span className="ftr-copy">
            © {year} <strong>{siteName}</strong>. All rights reserved.
          </span>
          <div className="ftr-legal-links">
            <Link to="/terms"         className="ftr-legal-link">Terms</Link>
            <Link to="/privacy"       className="ftr-legal-link">Privacy</Link>
            <Link to="/cookie-policy" className="ftr-legal-link">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
