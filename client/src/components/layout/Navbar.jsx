import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LineChart, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useBranding } from '../../context/BrandingContext';

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { siteLogo, siteName, logoSize } = useBranding();

  const isActive = (path) => location.pathname.startsWith(path) && path !== '/' ? 'active' : location.pathname === '/' && path === '/' ? 'active' : '';

  return (
    <nav className="navbar glass">
      <div className="container nav-content">
        <Link to="/" className="nav-brand flex items-center gap-3">
          {siteLogo ? (
            <img 
              src={`http://localhost:5000${siteLogo}`} 
              alt={siteName} 
              style={{ height: `${logoSize}px`, width: 'auto', objectFit: 'contain' }} 
            />
          ) : (
            <div className="brand-dot" style={{ width: '10px', height: '10px', background: 'var(--gradient-lotus)', borderRadius: '50%' }}></div>
          )}
          <span className="text-gradient" style={{ fontWeight: '800', fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
            {siteName}
          </span>
        </Link>
        <div className="nav-links">
          <Link to="/courses" className={`nav-item ${isActive('/courses')}`}>Courses</Link>
          <Link to="/prop-firms" className={`nav-item ${isActive('/prop-firms')}`}>Prop Firms</Link>
          <Link to="/blog" className={`nav-item ${isActive('/blog')}`}>Blog</Link>

          {user?.role === 'admin' && (
            <Link to="/admin" className={`nav-item ${isActive('/admin')}`} style={{ color: 'var(--accent-purple)' }}>
              Admin
            </Link>
          )}

          <button 
            className="theme-toggle hover:-translate-y-1 transition-transform" 
            style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: theme === 'dark' ? '#fbbf24' : '#475569',
              boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
              cursor: 'pointer'
            }} 
            onClick={toggleTheme} 
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          <div className="nav-divider"></div>

          {user ? (
            <>
              <Link to="/dashboard" className={`nav-item ${isActive('/dashboard')}`}>{user.name.split(' ')[0]}</Link>
              <button
                className="btn btn-outline"
                style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
