import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Moon, Settings, Home, BookOpen, Building2,
  Newspaper, Info, Mail, ShieldCheck, LogOut, User, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useBranding } from '../../context/BrandingContext';

const NAV_LINKS = [
  { to: '/',           label: 'Home',       icon: Home },
  { to: '/courses',    label: 'Courses',    icon: BookOpen },
  { to: '/prop-firms', label: 'Prop Firms', icon: Building2 },
  { to: '/blog',       label: 'Blog',       icon: Newspaper },
  { to: '/about',      label: 'About',      icon: Info },
  { to: '/contact',    label: 'Contact',    icon: Mail },
];

/* Animated hamburger → X bars */
const HamburgerIcon = ({ open }) => (
  <div className="ham-icon" aria-hidden>
    <motion.span animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.3 }} />
    <motion.span animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }} transition={{ duration: 0.2 }} />
    <motion.span animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.3 }} />
  </div>
);

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { siteLogo, siteName, logoSize, siteNameColor } = useBranding();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) =>
    location.pathname.startsWith(path) && path !== '/'
      ? true
      : location.pathname === '/' && path === '/'
      ? true
      : false;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
      <motion.nav
        className="navbar glass"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        style={{
          boxShadow: scrolled
            ? '0 8px 32px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.04)'
            : '0 1px 0 rgba(255,255,255,0.04)',
          backdropFilter: scrolled ? 'blur(28px) saturate(200%)' : 'blur(16px)',
          transition: 'box-shadow 0.4s ease, backdrop-filter 0.4s ease',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.04)',
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
                className="brand-dot"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: '10px', height: '10px',
                  background: 'var(--gradient-lotus)',
                  borderRadius: '50%',
                  boxShadow: '0 0 10px rgba(37,99,235,0.6)',
                }}
              />
            )}
            <span
              className={siteNameColor ? '' : 'text-gradient'}
              style={{
                fontWeight: 800,
                fontSize: '1.25rem',
                letterSpacing: '-0.02em',
                ...(siteNameColor ? { color: siteNameColor } : {}),
              }}
            >
              {siteName}
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="nav-links nav-links-desktop">
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} className={`nav-item ${isActive(to) ? 'active' : ''}`}>{label}</Link>
            ))}

            {user?.role === 'admin' && (
              <Link to="/admin" className={`nav-item ${isActive('/admin') ? 'active' : ''}`} style={{ color: 'var(--accent-primary)' }}>
                Admin
              </Link>
            )}

            <motion.button
              className="theme-toggle"
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                color: theme === 'dark' ? '#fbbf24' : '#475569',
                cursor: 'pointer',
              }}
              onClick={toggleTheme}
              aria-label="Toggle Theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            <div className="nav-divider" />

            <AnimatePresence mode="wait" initial={false}>
              {user ? (
                <motion.div
                  key="user-menu"
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.28 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                >
                  <Link to="/profile" className={`nav-item ${isActive('/profile') ? 'active' : ''}`}>{user.name.split(' ')[0]}</Link>
                  <Link to="/settings" title="Settings" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '32px', height: '32px', borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: isActive('/settings') ? 'rgba(37,99,235,0.12)' : 'transparent',
                    color: isActive('/settings') ? '#60a5fa' : 'var(--text-secondary)',
                    transition: 'all 0.2s', flexShrink: 0,
                  }}>
                    <Settings size={15} />
                  </Link>
                  <motion.button
                    className="btn btn-outline"
                    style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={logout}
                  >Logout</motion.button>
                </motion.div>
              ) : (
                <motion.div key="sign-in" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.28 }}>
                  <Link to="/login" className="btn btn-primary" style={{ padding: '0.4rem 1.2rem', fontSize: '0.9rem' }}>Sign In</Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile right side */}
          <div className="nav-mobile-right">
            <motion.button
              className="mob-theme-btn"
              whileTap={{ scale: 0.88 }}
              onClick={toggleTheme}
              aria-label="Toggle Theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.22 }}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            <motion.button
              className={`mob-ham-btn ${menuOpen ? 'open' : ''}`}
              whileTap={{ scale: 0.88 }}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Toggle Menu"
            >
              <HamburgerIcon open={menuOpen} />
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mob-overlay"
              className="mob-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              key="mob-drawer"
              className="mob-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {/* ── Drawer header ── */}
              <div className="mob-drawer-header">
                <div className="mob-drawer-header-bg" />
                {user ? (
                  <div className="mob-user-card">
                    <div className="mob-avatar">{initials}</div>
                    <div>
                      <div className="mob-user-name">{user.name}</div>
                      <div className="mob-user-email">{user.email}</div>
                    </div>
                  </div>
                ) : (
                  <div className="mob-brand-header">
                    <div className="mob-brand-dot" />
                    <span className="mob-brand-name">{siteName}</span>
                  </div>
                )}

                <button className="mob-close-btn" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                  <motion.div animate={{ rotate: menuOpen ? 0 : -90 }} transition={{ duration: 0.3 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </motion.div>
                </button>
              </div>

              {/* ── Nav links ── */}
              <nav className="mob-nav">
                {NAV_LINKS.map(({ to, label, icon: Icon }, i) => {
                  const active = isActive(to);
                  return (
                    <motion.div
                      key={to}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.06 + i * 0.055, type: 'spring', damping: 22, stiffness: 260 }}
                    >
                      <Link to={to} className={`mob-nav-item ${active ? 'active' : ''}`}>
                        <span className="mob-nav-icon-wrap">
                          <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                        </span>
                        <span className="mob-nav-label">{label}</span>
                        {active && (
                          <motion.div
                            layoutId="mob-active-pill"
                            className="mob-active-pill"
                            transition={{ type: 'spring', damping: 26, stiffness: 380 }}
                          />
                        )}
                        <ChevronRight size={14} className="mob-nav-chevron" />
                      </Link>
                    </motion.div>
                  );
                })}

                {user?.role === 'admin' && (
                  <motion.div
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 + NAV_LINKS.length * 0.055, type: 'spring', damping: 22, stiffness: 260 }}
                  >
                    <Link to="/admin" className={`mob-nav-item admin ${isActive('/admin') ? 'active' : ''}`}>
                      <span className="mob-nav-icon-wrap admin">
                        <ShieldCheck size={18} strokeWidth={2} />
                      </span>
                      <span className="mob-nav-label">Admin Panel</span>
                      <ChevronRight size={14} className="mob-nav-chevron" />
                    </Link>
                  </motion.div>
                )}
              </nav>

              {/* ── Divider ── */}
              <div className="mob-divider" />

              {/* ── Auth section ── */}
              <div className="mob-auth">
                {user ? (
                  <>
                    <Link to="/profile" className="mob-auth-link">
                      <User size={16} />
                      <span>My Profile</span>
                    </Link>
                    <Link to="/settings" className="mob-auth-link">
                      <Settings size={16} />
                      <span>Settings</span>
                    </Link>
                    <motion.button
                      className="mob-logout-btn"
                      whileTap={{ scale: 0.97 }}
                      onClick={logout}
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </motion.button>
                  </>
                ) : (
                  <Link to="/login" className="mob-signin-btn">
                    Sign In
                    <ChevronRight size={16} />
                  </Link>
                )}
              </div>

              {/* ── Footer tag ── */}
              <div className="mob-drawer-footer">
                <span>{siteName} © {new Date().getFullYear()}</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
