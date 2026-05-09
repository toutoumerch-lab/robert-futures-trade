import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Settings, ShieldCheck, LogOut, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useBranding } from '../../context/BrandingContext';

const NAV_LINKS = [
  { to: '/',           label: 'Home' },
  { to: '/prop-firms', label: 'Prop Firms' },
  { to: '/blog',       label: 'Blog' },
  { to: '/courses',    label: 'Courses' },
  { to: '/about',      label: 'About' },
  { to: '/contact',    label: 'Contact' },
];

/* ── Animated hamburger bars ──────────────────────────────── */
const Hamburger = ({ open }) => (
  <span className="ham-wrap" aria-hidden>
    <motion.span className="ham-bar" animate={open ? { rotate: 45, y: 6 }  : { rotate: 0, y: 0 }}  transition={{ duration: 0.35, ease: [0.16,1,0.3,1] }} />
    <motion.span className="ham-bar" animate={open ? { opacity: 0, scaleX: 0.3 } : { opacity: 1, scaleX: 1 }} transition={{ duration: 0.2 }} />
    <motion.span className="ham-bar" animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }} transition={{ duration: 0.35, ease: [0.16,1,0.3,1] }} />
  </span>
);

/* ── Item variants for stagger ────────────────────────────── */
const listVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
  exit:   { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 32, skewX: '-3deg' },
  show:   { opacity: 1, y: 0,  skewX: '0deg', transition: { type: 'spring', damping: 22, stiffness: 280 } },
  exit:   { opacity: 0, y: -16, transition: { duration: 0.18, ease: 'easeIn' } },
};

/* ── Overlay variants ─────────────────────────────────────── */
const overlayVariants = {
  hidden: { opacity: 0, scale: 0.96, clipPath: 'inset(0 0 100% 0 round 0px)' },
  show:   { opacity: 1, scale: 1,    clipPath: 'inset(0 0 0%   0 round 0px)', transition: { duration: 0.55, ease: [0.16,1,0.3,1] } },
  exit:   { opacity: 0, scale: 0.97, clipPath: 'inset(0 0 100% 0 round 0px)', transition: { duration: 0.4,  ease: [0.7,0,1,1] } },
};

/* ── Navbar ───────────────────────────────────────────────── */
const Navbar = () => {
  const location  = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { siteLogo, siteName, logoSize, siteNameColor } = useBranding();
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '';

  /* ── Top bar ── */
  return (
    <>
      <motion.nav
        className="navbar glass"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          boxShadow:      scrolled ? '0 8px 32px rgba(0,0,0,0.35)' : 'none',
          backdropFilter: scrolled ? 'blur(28px) saturate(200%)' : 'blur(16px)',
          transition:     'box-shadow 0.4s, backdrop-filter 0.4s',
          borderBottom:   scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div className="container nav-content">
          {/* Brand */}
          <Link to="/" className="nav-brand flex items-center gap-3">
            {siteLogo ? (
              <motion.img
                src={`${import.meta.env.VITE_API_URL}${siteLogo}`}
                alt={siteName}
                style={{ height: `${logoSize}px`, width: 'auto', objectFit: 'contain' }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              />
            ) : (
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--gradient-lotus)', boxShadow: '0 0 10px rgba(37,99,235,0.6)', flexShrink: 0 }}
              />
            )}
            <span
              className={siteNameColor ? '' : 'text-gradient'}
              style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', ...(siteNameColor ? { color: siteNameColor } : {}) }}
            >
              {siteName}
            </span>
          </Link>

          {/* ── Desktop links ── */}
          <div className="nav-links nav-links-desktop">
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} className={`nav-item ${isActive(to) ? 'active' : ''}`}>{label}</Link>
            ))}
            {user?.role === 'admin' && (
              <Link to="/admin" className={`nav-item ${isActive('/admin') ? 'active' : ''}`} style={{ color: 'var(--accent-primary)' }}>Admin</Link>
            )}

            <motion.button className="theme-toggle" whileHover={{ scale: 1.1, rotate: 15 }} whileTap={{ scale: 0.9 }}
              style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: theme === 'dark' ? '#fbbf24' : '#475569', cursor: 'pointer' }}
              onClick={toggleTheme} aria-label="Toggle Theme">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={theme} initial={{ rotate: -90, opacity: 0, scale: 0.5 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 90, opacity: 0, scale: 0.5 }} transition={{ duration: 0.25 }} style={{ display: 'flex', alignItems: 'center' }}>
                  {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            <div className="nav-divider" />

            <AnimatePresence mode="wait" initial={false}>
              {user ? (
                <motion.div key="user-menu" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.28 }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Link to="/profile" className={`nav-item ${isActive('/profile') ? 'active' : ''}`}>{user.name.split(' ')[0]}</Link>
                  <Link to="/settings" title="Settings" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: isActive('/settings') ? 'rgba(37,99,235,0.12)' : 'transparent', color: isActive('/settings') ? '#60a5fa' : 'var(--text-secondary)', transition: 'all 0.2s' }}>
                    <Settings size={15} />
                  </Link>
                  <motion.button className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={logout}>Logout</motion.button>
                </motion.div>
              ) : (
                <motion.div key="sign-in" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.28 }}>
                  <Link to="/login" className="btn btn-primary" style={{ padding: '0.4rem 1.2rem', fontSize: '0.9rem' }}>Sign In</Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Mobile right controls ── */}
          <div className="nav-mobile-right">
            <motion.button className="mob-ctrl-btn" whileTap={{ scale: 0.87 }} onClick={toggleTheme} aria-label="Toggle theme"
              style={{ color: theme === 'dark' ? '#fbbf24' : '#64748b' }}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }} style={{ display: 'flex' }}>
                  {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            <motion.button
              className={`mob-ctrl-btn mob-ham ${menuOpen ? 'is-open' : ''}`}
              whileTap={{ scale: 0.87 }}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Toggle menu"
            >
              <Hamburger open={menuOpen} />
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* ── Full-screen mobile menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="fullmenu"
            className="mob-fullmenu"
            variants={overlayVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {/* Ambient glow orbs */}
            <div className="mob-glow mob-glow-1" />
            <div className="mob-glow mob-glow-2" />

            {/* ── Top bar inside menu ── */}
            <div className="mob-menu-topbar">
              <Link to="/" className="mob-menu-logo">
                <span className="mob-menu-logo-dot" />
                <span className="mob-menu-logo-text">{siteName}</span>
              </Link>
              <motion.button
                className="mob-close"
                onClick={() => setMenuOpen(false)}
                whileTap={{ scale: 0.88 }}
                aria-label="Close menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </motion.button>
            </div>

            {/* ── User strip (if logged in) ── */}
            {user && (
              <motion.div
                className="mob-user-strip"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.35 }}
              >
                <div className="mob-avatar-ring">
                  <div className="mob-avatar-inner">{initials}</div>
                </div>
                <div className="mob-user-info">
                  <span className="mob-user-name">{user.name}</span>
                  <span className="mob-user-tag">{user.role === 'admin' ? 'Administrator' : 'Member'}</span>
                </div>
              </motion.div>
            )}

            {/* ── Nav links ── */}
            <motion.nav
              className="mob-nav-list"
              variants={listVariants}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              {NAV_LINKS.map(({ to, label }, i) => {
                const active = isActive(to);
                return (
                  <motion.div key={to} variants={itemVariants} className="mob-nav-row">
                    <Link to={to} className={`mob-nav-link ${active ? 'is-active' : ''}`}>
                      <span className="mob-nav-index">{String(i + 1).padStart(2, '0')}</span>
                      <span className="mob-nav-text">{label}</span>
                      <motion.span
                        className="mob-nav-arrow"
                        animate={active ? { x: 0, opacity: 1 } : { x: -8, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ArrowRight size={20} strokeWidth={2.5} />
                      </motion.span>
                    </Link>
                  </motion.div>
                );
              })}

              {user?.role === 'admin' && (
                <motion.div variants={itemVariants} className="mob-nav-row">
                  <Link to="/admin" className={`mob-nav-link is-admin ${isActive('/admin') ? 'is-active' : ''}`}>
                    <span className="mob-nav-index"><ShieldCheck size={16} /></span>
                    <span className="mob-nav-text">Admin Panel</span>
                    <span className="mob-nav-arrow"><ArrowRight size={20} strokeWidth={2.5} /></span>
                  </Link>
                </motion.div>
              )}
            </motion.nav>

            {/* ── Bottom auth section ── */}
            <motion.div
              className="mob-menu-bottom"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4, ease: [0.16,1,0.3,1] }}
            >
              {user ? (
                <div className="mob-bottom-row">
                  <Link to="/profile" className="mob-bottom-btn">
                    <User size={15} />
                    <span>Profile</span>
                  </Link>
                  <Link to="/settings" className="mob-bottom-btn">
                    <Settings size={15} />
                    <span>Settings</span>
                  </Link>
                  <button className="mob-bottom-btn logout" onClick={logout}>
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link to="/login" className="mob-signin-cta">
                  <span>Get Started</span>
                  <ArrowRight size={16} strokeWidth={2.5} />
                </Link>
              )}
              <p className="mob-menu-copy">{siteName} · {new Date().getFullYear()}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
