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
const DiscordSVG = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
  </svg>
);
const FacebookSVG = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramSVG = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
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
  const { siteName, siteLogo, socialTwitter, socialYoutube, socialInstagram, socialDiscord, socialFacebook, youtubeWatchUrl } = useBranding();
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
            {(youtubeWatchUrl || socialYoutube) && (
              <a
                href={youtubeWatchUrl || socialYoutube}
                target="_blank"
                rel="noopener noreferrer"
                className="ftr-cta-yt"
              >
                <YoutubeSVG /> Watch Live
              </a>
            )}
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
            {socialYoutube   && <SocialBtn href={socialYoutube}   Icon={YoutubeSVG}   label="YouTube"   hoverColor="#ff0000" />}
            {socialTwitter   && <SocialBtn href={socialTwitter}   Icon={TwitterSVG}   label="Twitter"   hoverColor="#1d9bf0" />}
            {socialInstagram && <SocialBtn href={socialInstagram} Icon={InstagramSVG} label="Instagram" hoverColor="#e1306c" />}
            {socialDiscord   && <SocialBtn href={socialDiscord}   Icon={DiscordSVG}   label="Discord"   hoverColor="#5865f2" />}
            {socialFacebook  && <SocialBtn href={socialFacebook}  Icon={FacebookSVG}  label="Facebook"  hoverColor="#1877f2" />}
          </div>
        </div>

        {/* Learn */}
        <div className="ftr-col">
          <h4 className="ftr-col-title">Learn</h4>
          <FooterLink to="/courses"><BookOpen size={13} /> All Courses</FooterLink>
          <FooterLink href={socialYoutube || 'https://youtube.com'}><span className="ftr-link-icon"><YoutubeSVG /></span> Live Sessions</FooterLink>
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
