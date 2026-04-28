import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useBranding } from '../../context/BrandingContext';

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { siteLogo, siteName, logoSize, siteNameColor } = useBranding();
  const [scrolled, setScrolled] = useState(false);

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

  return (
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
              src={`http://localhost:5000${siteLogo}`}
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

        {/* Nav links */}
        <div className="nav-links">
          {[
            { to: '/',          label: 'Home' },
            { to: '/courses',   label: 'Courses' },
            { to: '/prop-firms',label: 'Prop Firms' },
            { to: '/blog',      label: 'Blog' },
            { to: '/about',     label: 'About' },
            { to: '/contact',   label: 'Contact' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} className={`nav-item ${isActive(to)}`}>
              {label}
            </Link>
          ))}

          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className={`nav-item ${isActive('/admin')}`}
              style={{ color: 'var(--accent-primary)' }}
            >
              Admin
            </Link>
          )}

          {/* Theme toggle */}
          <motion.button
            className="theme-toggle"
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            style={{
              width: '40px', height: '40px',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: theme === 'dark' ? '#fbbf24' : '#475569',
              boxShadow: theme === 'dark'
                ? '0 0 12px rgba(251,191,36,0.2)'
                : '0 4px 10px rgba(0,0,0,0.05)',
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

          {/* User auth */}
          <AnimatePresence mode="wait" initial={false}>
            {user ? (
              <motion.div
                key="user-menu"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
              >
                <Link to="/profile" className={`nav-item ${isActive('/profile')}`}>
                  {user.name.split(' ')[0]}
                </Link>
                <motion.button
                  className="btn btn-outline"
                  style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={logout}
                >
                  Logout
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="sign-in"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link to="/login" className="btn btn-primary" style={{ padding: '0.4rem 1.2rem', fontSize: '0.9rem' }}>
                  Sign In
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
