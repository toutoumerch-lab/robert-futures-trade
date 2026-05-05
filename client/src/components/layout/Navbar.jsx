import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Settings, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useBranding } from '../../context/BrandingContext';

const NAV_LINKS = [
  { to: '/',           label: 'Home' },
  { to: '/courses',    label: 'Courses' },
  { to: '/prop-firms', label: 'Prop Firms' },
  { to: '/blog',       label: 'Blog' },
  { to: '/about',      label: 'About' },
  { to: '/contact',    label: 'Contact' },
];

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { siteLogo, siteName, logoSize, siteNameColor } = useBranding();
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  const isActive = (path) =>
    location.pathname.startsWith(path) && path !== '/'
      ? 'active'
      : location.pathname === '/' && path === '/'
      ? 'active'
      : '';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

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
              <Link key={to} to={to} className={`nav-item ${isActive(to)}`}>{label}</Link>
            ))}

            {user?.role === 'admin' && (
              <Link to="/admin" className={`nav-item ${isActive('/admin')}`} style={{ color: 'var(--accent-primary)' }}>
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
                  <Link to="/profile" className={`nav-item ${isActive('/profile')}`}>{user.name.split(' ')[0]}</Link>
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

          {/* Mobile right side: theme toggle + hamburger */}
          <div className="nav-mobile-right">
            <motion.button
              className="theme-toggle"
              whileTap={{ scale: 0.9 }}
              style={{
                width: '38px', height: '38px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                color: theme === 'dark' ? '#fbbf24' : '#475569', cursor: 'pointer',
              }}
              onClick={toggleTheme}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </motion.button>

            <motion.button
              className="hamburger-btn"
              whileTap={{ scale: 0.9 }}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Toggle Menu"
              style={{
                width: '38px', height: '38px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: menuOpen ? 'rgba(99,102,241,0.15)' : 'var(--bg-secondary)',
                border: '1px solid var(--border)', cursor: 'pointer',
                color: menuOpen ? 'var(--accent-primary)' : 'var(--text-primary)',
              }}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 48,
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
              }}
            />
            <motion.div
              key="drawer"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: 'min(80vw, 300px)', zIndex: 49,
                background: 'var(--bg-primary)',
                borderLeft: '1px solid var(--border)',
                boxShadow: '-20px 0 60px rgba(0,0,0,0.4)',
                display: 'flex', flexDirection: 'column',
                padding: '1.5rem',
                overflowY: 'auto',
              }}
            >
              {/* Drawer header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <span className="text-gradient" style={{ fontWeight: 800, fontSize: '1.1rem' }}>{siteName}</span>
                <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                  <X size={22} />
                </button>
              </div>

              {/* Nav links */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                {NAV_LINKS.map(({ to, label }, i) => (
                  <motion.div
                    key={to}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={to}
                      className={`nav-item ${isActive(to)}`}
                      style={{
                        display: 'block', padding: '0.85rem 1rem',
                        borderRadius: '10px', fontSize: '1rem', fontWeight: 600,
                        background: isActive(to) ? 'rgba(99,102,241,0.1)' : 'transparent',
                        color: isActive(to) ? 'var(--accent-primary)' : 'var(--text-primary)',
                        borderLeft: isActive(to) ? '3px solid var(--accent-primary)' : '3px solid transparent',
                      }}
                    >
                      {label}
                    </Link>
                  </motion.div>
                ))}

                {user?.role === 'admin' && (
                  <Link to="/admin" style={{
                    display: 'block', padding: '0.85rem 1rem', borderRadius: '10px',
                    fontSize: '1rem', fontWeight: 700, color: 'var(--accent-primary)',
                    borderLeft: '3px solid var(--accent-primary)',
                    background: 'rgba(99,102,241,0.1)',
                  }}>Admin</Link>
                )}
              </div>

              {/* Bottom: auth */}
              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {user ? (
                  <>
                    <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontWeight: 600 }}>
                      👤 {user.name}
                    </Link>
                    <Link to="/settings" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      <Settings size={16} /> Settings
                    </Link>
                    <button onClick={logout} className="btn btn-outline" style={{ width: '100%', padding: '0.75rem' }}>Logout</button>
                  </>
                ) : (
                  <Link to="/login" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', textAlign: 'center', fontSize: '1rem' }}>Sign In</Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
