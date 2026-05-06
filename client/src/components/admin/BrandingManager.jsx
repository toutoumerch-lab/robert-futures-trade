import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useBranding } from '../../context/BrandingContext';
import { useTheme } from '../../context/ThemeContext';
import Card from '../common/Card';
import {
  Upload, Check, AlertCircle, Pipette, RotateCcw, Globe,
  Palette, Layout, Sun, Moon, Monitor, Sparkles, Eye,
  Share2, Video, AtSign, MessageCircle, Link, ChevronDown, Mail
} from 'lucide-react';

import FacebookIcon from '../icons/FacebookIcon';

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;
const API_BASE = `${import.meta.env.VITE_API_URL}`;

// ── Theme Presets ──
const PRESETS = [
  {
    name: 'Blue Default',
    primary: '#2563EB',
    secondary: '#3B82F6',
    accent: '#10b981',
    icon: 'diamond',
  },
  {
    name: 'Dark Pro',
    primary: '#6366F1',
    secondary: '#818CF8',
    accent: '#F59E0B',
    icon: 'moon',
  },
  {
    name: 'Emerald',
    primary: '#059669',
    secondary: '#10B981',
    accent: '#3B82F6',
    icon: 'clover',
  },
  {
    name: 'Sunset',
    primary: '#DC2626',
    secondary: '#F97316',
    accent: '#FBBF24',
    icon: 'sunset',
  },
  {
    name: 'Royal Purple',
    primary: '#7C3AED',
    secondary: '#A78BFA',
    accent: '#EC4899',
    icon: 'crown',
  },
  {
    name: 'Minimal',
    primary: '#374151',
    secondary: '#6B7280',
    accent: '#2563EB',
    icon: 'bolt',
  },
];

// ── Reusable Color Picker Row ──
const ColorPickerField = ({ label, value, onChange, defaultVal }) => {
  const hex = (value || defaultVal || '#2563EB');
  const hexInput = hex.replace('#', '');

  const handleHex = (raw) => {
    const cleaned = raw.replace(/[^0-9A-Fa-f]/g, '').substring(0, 6);
    if (cleaned.length === 6) {
      onChange('#' + cleaned);
    }
  };

  return (
    <div className="branding-color-field">
      <label className="branding-color-label">{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div className="color-swatch-wrapper">
          <div className="color-swatch" style={{ background: hex }} />
          <input
            type="color"
            className="color-input-native"
            value={hex}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <div className="color-hex-input-wrap">
          <span className="color-hex-hash">#</span>
          <input
            type="text"
            className="color-hex-input"
            placeholder="FFFFFF"
            maxLength={6}
            defaultValue={hexInput}
            key={hex}
            onBlur={(e) => handleHex(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleHex(e.target.value); }}
          />
        </div>
        {value && value !== defaultVal && (
          <button
            type="button"
            className="color-reset-btn"
            onClick={() => onChange('')}
            title="Reset to default"
          >
            <RotateCcw size={13} />
          </button>
        )}
      </div>
    </div>
  );
};

// ── Live Preview Mini-Mockup ──
const LivePreview = ({ primary, secondary, accent, siteName, siteNameColor }) => {
  const pri = primary || '#2563EB';
  const sec = secondary || '#3B82F6';
  const acc = accent || '#10b981';

  return (
    <div className="branding-live-preview">
      <div className="branding-preview-label">
        <Eye size={13} />
        Live Preview
      </div>
      {/* Mini Navbar */}
      <div className="preview-navbar" style={{ borderBottom: `2px solid ${pri}22` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: `linear-gradient(135deg, ${acc}, ${pri})` }} />
          <span style={{
            fontWeight: 800, fontSize: '0.75rem', letterSpacing: '-0.02em',
            ...(siteNameColor
              ? { color: siteNameColor }
              : { background: `linear-gradient(135deg, ${acc}, ${pri})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }
            ),
          }}>
            {siteName || 'Site Name'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['Home', 'Courses', 'Blog'].map(l => (
            <span key={l} style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{l}</span>
          ))}
          <span style={{ fontSize: '0.55rem', background: pri, color: '#fff', padding: '2px 8px', borderRadius: '99px', fontWeight: 700 }}>Sign In</span>
        </div>
      </div>
      {/* Mini Content */}
      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.65rem', color: pri, background: `${pri}15`, border: `1px solid ${pri}30`, padding: '2px 8px', borderRadius: '99px', width: 'fit-content', fontWeight: 600 }}>Featured</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>Page Title</div>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Preview of how your branding colors look across the site.</div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
          <span style={{ fontSize: '0.55rem', background: `linear-gradient(135deg, ${acc}, ${pri}, ${sec})`, color: '#fff', padding: '4px 12px', borderRadius: '99px', fontWeight: 700 }}>Primary Button</span>
          <span style={{ fontSize: '0.55rem', border: `1px solid var(--border-color)`, color: 'var(--text-primary)', padding: '4px 12px', borderRadius: '99px', fontWeight: 600 }}>Outline</span>
        </div>
        {/* Mini Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
          {[pri, sec].map((c, i) => (
            <div key={i} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ width: '100%', height: '24px', borderRadius: '4px', background: `linear-gradient(135deg, ${c}20, ${c}40)` }} />
              <div style={{ height: 4, width: '60%', background: 'var(--text-primary)', borderRadius: 99, opacity: 0.15 }} />
              <div style={{ height: 3, width: '80%', background: 'var(--text-secondary)', borderRadius: 99, opacity: 0.1 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════
const BrandingManager = () => {
  const {
    siteLogo, siteName, logoSize, siteNameColor, siteFavicon,
    primaryColor, secondaryColor, accentColor, layout, themeMode,
    socialTwitter, socialYoutube, socialInstagram, socialDiscord, socialFacebook,
    contactEmail,
    refreshBranding, updateBranding, updateSiteNameColor, updateFavicon,
    updateThemeColors, updateLayout, updateThemeMode, resetThemeColors,
    THEME_DEFAULTS,
  } = useBranding();

  const { theme: currentTheme, setTheme: setCurrentTheme } = useTheme();

  // ── Section collapse state
  const [openSection, setOpenSection] = useState('identity');

  // ── Identity state
  const [newName, setNewName] = useState(siteName);
  const [newSize, setNewSize] = useState(logoSize);
  const [newNameColor, setNewNameColor] = useState(siteNameColor || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFavicon, setSelectedFavicon] = useState(null);
  const [faviconPreviewUrl, setFaviconPreviewUrl] = useState(null);
  const [hexInput, setHexInput] = useState((siteNameColor || '').replace('#', ''));

  // ── Theme state
  const [newPrimary, setNewPrimary] = useState(primaryColor);
  const [newSecondary, setNewSecondary] = useState(secondaryColor);
  const [newAccent, setNewAccent] = useState(accentColor);
  const [newLayout, setNewLayout] = useState(layout);
  const [newThemeMode, setNewThemeMode] = useState(themeMode);

  // ── Social state
  const [newTwitter, setNewTwitter]     = useState(socialTwitter || '');
  const [newYoutube, setNewYoutube]     = useState(socialYoutube || '');
  const [newInstagram, setNewInstagram] = useState(socialInstagram || '');
  const [newDiscord, setNewDiscord]     = useState(socialDiscord || '');
  const [newFacebook, setNewFacebook]   = useState(socialFacebook || '');

  // ── Contact state
  const [newContactEmail, setNewContactEmail] = useState(contactEmail || 'admin@roberttrades.com');

  // ── Tag Manager state
  const { gtmContainerId } = useBranding();
  const [newGtmId, setNewGtmId] = useState(gtmContainerId || '');

  // YouTube home page button URLs
  const { youtubeWatchUrl, youtubeSubscribeUrl } = useBranding();
  const [newYtWatch, setNewYtWatch]         = useState(youtubeWatchUrl || '');
  const [newYtSubscribe, setNewYtSubscribe] = useState(youtubeSubscribeUrl || '');

  // ── Form state
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (isFirstLoad.current) {
      setNewName(siteName);
      isFirstLoad.current = false;
    }
  }, [siteName]);

  useEffect(() => { setNewSize(logoSize); }, [logoSize]);
  useEffect(() => { setNewPrimary(primaryColor); }, [primaryColor]);
  useEffect(() => { setNewSecondary(secondaryColor); }, [secondaryColor]);
  useEffect(() => { setNewAccent(accentColor); }, [accentColor]);
  useEffect(() => { setNewLayout(layout); }, [layout]);
  useEffect(() => { setNewThemeMode(themeMode); }, [themeMode]);
  useEffect(() => { setNewTwitter(socialTwitter); },   [socialTwitter]);
  useEffect(() => { setNewYoutube(socialYoutube); },   [socialYoutube]);
  useEffect(() => { setNewInstagram(socialInstagram); }, [socialInstagram]);
  useEffect(() => { setNewDiscord(socialDiscord); },   [socialDiscord]);
  useEffect(() => { setNewFacebook(socialFacebook); }, [socialFacebook]);
  useEffect(() => { setNewYtWatch(youtubeWatchUrl); },     [youtubeWatchUrl]);
  useEffect(() => { setNewYtSubscribe(youtubeSubscribeUrl); }, [youtubeSubscribeUrl]);
  useEffect(() => { setNewContactEmail(contactEmail || 'admin@roberttrades.com'); }, [contactEmail]);
  useEffect(() => { setNewGtmId(gtmContainerId || ''); }, [gtmContainerId]);

  useEffect(() => {
    if (!isDirty) {
      setNewNameColor(siteNameColor || '');
      setHexInput((siteNameColor || '').replace('#', ''));
    }
  }, [siteNameColor, isDirty]);

  // ── Identity Handlers ──
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); setIsDirty(true); }
  };

  const handleFaviconSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { setStatus({ type: 'error', message: 'Favicon must be under 1MB.' }); return; }
    setSelectedFavicon(file); setFaviconPreviewUrl(URL.createObjectURL(file)); setIsDirty(true);
  };

  const handleNameChange = (e) => { setNewName(e.target.value); setIsDirty(true); updateBranding(null, e.target.value, null); };
  const handleSizeChange = (val) => { setNewSize(val); setIsDirty(true); updateBranding(null, null, val); };

  const handleColorPicker = (e) => {
    const val = e.target.value;
    setNewNameColor(val); setHexInput(val.replace('#', '')); setIsDirty(true);
    updateSiteNameColor(val);
  };

  const handleHexInput = (raw) => {
    const cleaned = raw.replace(/[^0-9A-Fa-f]/g, '').substring(0, 6);
    setHexInput(cleaned);
    if (cleaned.length === 6) {
      const hex = '#' + cleaned;
      setNewNameColor(hex); setIsDirty(true); updateSiteNameColor(hex);
    }
  };

  const resetColor = () => { setNewNameColor(''); setHexInput(''); setIsDirty(true); updateSiteNameColor(''); };

  // ── Theme Color Handlers ──
  const handlePrimaryChange = (v) => { setNewPrimary(v || THEME_DEFAULTS.primaryColor); setIsDirty(true); updateThemeColors(v || THEME_DEFAULTS.primaryColor, undefined, undefined); };
  const handleSecondaryChange = (v) => { setNewSecondary(v || THEME_DEFAULTS.secondaryColor); setIsDirty(true); updateThemeColors(undefined, v || THEME_DEFAULTS.secondaryColor, undefined); };
  const handleAccentChange = (v) => { setNewAccent(v || THEME_DEFAULTS.accentColor); setIsDirty(true); updateThemeColors(undefined, undefined, v || THEME_DEFAULTS.accentColor); };

  const applyPreset = (preset) => {
    setNewPrimary(preset.primary);
    setNewSecondary(preset.secondary);
    setNewAccent(preset.accent);
    setIsDirty(true);
    updateThemeColors(preset.primary, preset.secondary, preset.accent);
  };

  const handleResetColors = () => {
    setNewPrimary(THEME_DEFAULTS.primaryColor);
    setNewSecondary(THEME_DEFAULTS.secondaryColor);
    setNewAccent(THEME_DEFAULTS.accentColor);
    setIsDirty(true);
    resetThemeColors();
  };

  // ── Layout & Mode ──
  const handleLayoutChange = (v) => { setNewLayout(v); setIsDirty(true); updateLayout(v); };
  const handleModeChange = (v) => {
    setNewThemeMode(v);
    setIsDirty(true);
    updateThemeMode(v);

    // Actually apply the theme visually via ThemeContext
    if (v === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setCurrentTheme(prefersDark ? 'dark' : 'light');
    } else {
      setCurrentTheme(v);
    }
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const token = localStorage.getItem('token');
      if (!token) { setStatus({ type: 'error', message: 'Not authenticated. Please log in again.' }); setIsSubmitting(false); return; }

      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (newNameColor && !HEX_REGEX.test(newNameColor)) {
        setStatus({ type: 'error', message: 'Invalid HEX color code. Use format like #FF5733.' }); setIsSubmitting(false); return;
      }

      // Save all settings
      await axios.put(`${API_BASE}/api/settings`, {
        site_name: newName,
        site_logo_size: newSize,
        site_name_color: newNameColor || '',
        theme_primary_color: newPrimary || '',
        theme_secondary_color: newSecondary || '',
        theme_accent_color: newAccent || '',
        theme_layout: newLayout,
        theme_mode: newThemeMode,
        social_twitter:   newTwitter   || '',
        social_youtube:   newYoutube   || '',
        social_instagram: newInstagram || '',
        social_discord:   newDiscord   || '',
        social_facebook:  newFacebook  || '',
        youtube_watch_url:     newYtWatch     || '',
        youtube_subscribe_url: newYtSubscribe || '',
        contact_email:    newContactEmail || '',
        gtm_container_id: newGtmId || '',
      }, config);

      // Upload logo
      if (selectedFile) {
        const formData = new FormData();
        formData.append('logo', selectedFile);
        await axios.post(`${API_BASE}/api/settings/logo`, formData, {
          headers: { ...config.headers, 'Content-Type': 'multipart/form-data' }
        });
      }

      // Upload favicon
      if (selectedFavicon) {
        const formData = new FormData();
        formData.append('favicon', selectedFavicon);
        const favRes = await axios.post(`${API_BASE}/api/settings/favicon`, formData, {
          headers: { ...config.headers, 'Content-Type': 'multipart/form-data' }
        });
        if (favRes.data.favicon_url) updateFavicon(favRes.data.favicon_url);
      }

      setStatus({ type: 'success', message: 'Branding updated successfully!' });
      setIsDirty(false);
      setSelectedFile(null); setPreviewUrl(null);
      setSelectedFavicon(null); setFaviconPreviewUrl(null);

      await refreshBranding();
    } catch (error) {
      console.error('[Branding] Save error:', error);
      setStatus({ type: 'error', message: error.response?.data?.error || 'Failed to update branding.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayColor = (newNameColor && HEX_REGEX.test(newNameColor)) ? newNameColor : null;
  const faviconSrc = faviconPreviewUrl || (siteFavicon ? `${API_BASE}${siteFavicon}` : null);

  // Section toggle helper
  const toggleSection = (s) => setOpenSection(prev => prev === s ? null : s);

  return (
    <div className="branding-manager">
      {status.message && (
        <div className={`status-pill ${status.type} mb-4`}>
          {status.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ═══════════════════════════════════════════════════════
            SECTION 1: IDENTITY
        ═══════════════════════════════════════════════════════ */}
        <div className="branding-section">
          <button type="button" className="branding-section-header" onClick={() => toggleSection('identity')}>
            <div className="branding-section-title">
              <div className="branding-section-icon" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
                <Globe size={18} />
              </div>
              <div>
                <h3>Site Identity</h3>
                <p>Name, logo, favicon</p>
              </div>
            </div>
            <div className={`branding-section-chevron ${openSection === 'identity' ? 'open' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </button>

          {openSection === 'identity' && (
            <div className="branding-section-body">
              {/* Site Name */}
              <div className="form-group">
                <label className="mb-2 block font-medium">Site Name</label>
                <input type="text" className="form-input" value={newName} onChange={handleNameChange} placeholder="Enter site name" />
              </div>

              {/* Site Name Color */}
              <div className="form-group">
                <label className="mb-2 block font-medium" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Pipette size={15} /> Site Name Color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="color-swatch-wrapper">
                    <div className="color-swatch" style={{
                      background: displayColor ? displayColor : 'linear-gradient(135deg, #10b981, #3b82f6, #2563eb, #3b82f6, #f97316)',
                    }} />
                    <input type="color" className="color-input-native" value={displayColor || '#2563eb'} onChange={handleColorPicker} />
                  </div>
                  <div className="color-hex-input-wrap">
                    <span className="color-hex-hash">#</span>
                    <input type="text" className="color-hex-input" placeholder="FFFFFF" maxLength={6} value={hexInput} onChange={(e) => handleHexInput(e.target.value)} />
                  </div>
                  {newNameColor && (
                    <button type="button" className="color-reset-btn" onClick={resetColor} title="Reset to gradient (default)">
                      <RotateCcw size={14} />
                    </button>
                  )}
                </div>
                {/* Preview */}
                <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Preview:</span>
                  <span style={{
                    fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em',
                    ...(displayColor ? { color: displayColor } : { background: 'linear-gradient(135deg, #10b981, #3b82f6, #2563eb, #3b82f6, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }),
                  }}>
                    {newName || 'Site Name'}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  Pick a solid color or leave empty for the default gradient.
                </p>
              </div>

              {/* Logo Size */}
              <div className="form-group">
                <label className="mb-2 block font-medium">Logo Size (px)</label>
                <div className="flex items-center gap-4">
                  <input type="number" className="form-input" style={{ width: '100px' }} value={newSize} onChange={(e) => handleSizeChange(e.target.value)} min="16" max="200" />
                  <input type="range" min="16" max="200" value={newSize} onChange={(e) => handleSizeChange(e.target.value)} style={{ flex: 1 }} />
                </div>
                <p className="mt-1" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Adjust the height of your logo in the navigation bar.</p>
              </div>

              {/* Logo Upload */}
              <div className="form-group">
                <label className="mb-2 block font-medium">Website Logo</label>
                <div className="flex items-center gap-6">
                  <div className="logo-preview-box glass flex items-center justify-center overflow-hidden" style={{ width: '100px', height: '100px', borderRadius: 'var(--radius-md)' }}>
                    {previewUrl || (siteLogo ? `${API_BASE}${siteLogo}` : null) ? (
                      <img src={previewUrl || `${API_BASE}${siteLogo}`} alt="Logo Preview" style={{ maxWidth: '90%' }} />
                    ) : (
                      <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>No Logo</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="btn btn-outline cursor-pointer" style={{ gap: '0.5rem' }}>
                      <Upload size={18} /> Choose File
                      <input type="file" className="hidden" onChange={handleFileSelect} accept="image/*" />
                    </label>
                    <p className="mt-2" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PNG, JPG or SVG. Max 2MB.</p>
                  </div>
                </div>
              </div>

              {/* Favicon */}
              <div className="form-group">
                <label className="mb-2 block font-medium" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Globe size={15} /> Favicon
                </label>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '-0.2rem 0 0.75rem 0' }}>
                  The small icon shown in the browser tab. Recommended: 32×32 px.
                </p>
                <div className="flex items-center gap-6">
                  <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {faviconSrc ? (<img src={faviconSrc} alt="Favicon" style={{ width: '32px', height: '32px', objectFit: 'contain', imageRendering: 'pixelated' }} />) : (<Globe size={20} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} />)}
                  </div>
                  <div className="flex-1">
                    <label className="btn btn-outline cursor-pointer" style={{ gap: '0.5rem' }}>
                      <Upload size={18} /> Choose Favicon
                      <input type="file" className="hidden" onChange={handleFaviconSelect} accept=".ico,.png,.svg,.jpg,.jpeg,image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml,image/jpeg" />
                    </label>
                    <p className="mt-2" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ICO, PNG, SVG or JPG. Max 1MB.</p>
                  </div>
                </div>
                {faviconSrc && (
                  <div style={{ marginTop: '0.75rem', padding: '0.6rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Tab Preview:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px 8px 0 0', padding: '0.4rem 0.75rem', minWidth: '140px' }}>
                      <img src={faviconSrc} alt="Tab favicon" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{newName || 'Site Name'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 2: THEME COLORS
        ═══════════════════════════════════════════════════════ */}
        <div className="branding-section">
          <button type="button" className="branding-section-header" onClick={() => toggleSection('colors')}>
            <div className="branding-section-title">
              <div className="branding-section-icon" style={{ background: `linear-gradient(135deg, ${newPrimary}, ${newAccent})` }}>
                <Palette size={18} />
              </div>
              <div>
                <h3>Theme Colors</h3>
                <p>Brand palette, presets</p>
              </div>
            </div>
            <div className="branding-section-swatch-row">
              <div style={{ width: 16, height: 16, borderRadius: 4, background: newPrimary, border: '2px solid var(--border-color)' }} />
              <div style={{ width: 16, height: 16, borderRadius: 4, background: newSecondary, border: '2px solid var(--border-color)' }} />
              <div style={{ width: 16, height: 16, borderRadius: 4, background: newAccent, border: '2px solid var(--border-color)' }} />
            </div>
            <div className={`branding-section-chevron ${openSection === 'colors' ? 'open' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </button>

          {openSection === 'colors' && (
            <div className="branding-section-body">
              {/* Color Pickers */}
              <div className="branding-colors-grid">
                <ColorPickerField label="Primary Color" value={newPrimary} onChange={handlePrimaryChange} defaultVal={THEME_DEFAULTS.primaryColor} />
                <ColorPickerField label="Secondary Color" value={newSecondary} onChange={handleSecondaryChange} defaultVal={THEME_DEFAULTS.secondaryColor} />
                <ColorPickerField label="Accent Color" value={newAccent} onChange={handleAccentChange} defaultVal={THEME_DEFAULTS.accentColor} />
              </div>

              {/* Presets */}
              <div style={{ marginTop: '1.5rem' }}>
                <label className="mb-2 block font-medium" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={15} /> Quick Presets
                </label>
                <div className="branding-presets-grid">
                  {PRESETS.map((p) => {
                    const isActive = p.primary === newPrimary && p.secondary === newSecondary && p.accent === newAccent;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        className={`branding-preset-btn ${isActive ? 'active' : ''}`}
                        onClick={() => applyPreset(p)}
                      >
                        <div className="branding-preset-colors">
                          <div style={{ background: p.primary }} />
                          <div style={{ background: p.secondary }} />
                          <div style={{ background: p.accent }} />
                        </div>
                        <span className="branding-preset-name">{p.icon} {p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reset */}
              <button type="button" className="branding-reset-link" onClick={handleResetColors}>
                <RotateCcw size={13} /> Reset to Defaults
              </button>

              {/* Live Preview */}
              <LivePreview
                primary={newPrimary}
                secondary={newSecondary}
                accent={newAccent}
                siteName={newName}
                siteNameColor={displayColor}
              />
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 3: LAYOUT & DISPLAY
        ═══════════════════════════════════════════════════════ */}
        <div className="branding-section">
          <button type="button" className="branding-section-header" onClick={() => toggleSection('layout')}>
            <div className="branding-section-title">
              <div className="branding-section-icon" style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}>
                <Layout size={18} />
              </div>
              <div>
                <h3>Layout & Display</h3>
                <p>Layout style, default theme</p>
              </div>
            </div>
            <div className={`branding-section-chevron ${openSection === 'layout' ? 'open' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </button>

          {openSection === 'layout' && (
            <div className="branding-section-body">
              {/* Layout Style */}
              <div className="form-group">
                <label className="mb-2 block font-medium" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Layout size={15} /> Layout Style
                </label>
                <div className="branding-layout-grid">
                  {[
                    { id: 'default', label: 'Default',  desc: 'Standard spacing & radii', icon: 'layout' },
                    { id: 'compact', label: 'Compact',  desc: 'Tighter, efficient layout', icon: 'compact' },
                  ].map(l => (
                    <button
                      key={l.id}
                      type="button"
                      className={`branding-layout-card ${newLayout === l.id ? 'active' : ''}`}
                      onClick={() => handleLayoutChange(l.id)}
                    >
                      <span className="branding-layout-icon">{l.icon}</span>
                      <span className="branding-layout-label">{l.label}</span>
                      <span className="branding-layout-desc">{l.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Theme Mode */}
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="mb-2 block font-medium" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {currentTheme === 'dark' ? <Moon size={15} /> : <Sun size={15} />} Default Theme Mode
                </label>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Sets the default for first-time visitors. Users can override via the navbar toggle.
                </p>
                <div className="branding-mode-tabs">
                  {[
                    { id: 'light', label: 'Light', icon: <Sun size={16} /> },
                    { id: 'dark', label: 'Dark', icon: <Moon size={16} /> },
                    { id: 'system', label: 'System', icon: <Monitor size={16} /> },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      className={`branding-mode-btn ${newThemeMode === m.id ? 'active' : ''}`}
                      onClick={() => handleModeChange(m.id)}
                    >
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 4: SOCIAL MEDIA LINKS
        ═══════════════════════════════════════════════════════ */}
        <div className="branding-section">
          <button type="button" className="branding-section-header" onClick={() => toggleSection('social')}>
            <div className="branding-section-title">
              <div className="branding-section-icon" style={{ background: 'linear-gradient(135deg, #1d9bf0, #e1306c)' }}>
                <Share2 size={18} />
              </div>
              <div>
                <h3>Social Media Links</h3>
                <p>Twitter/X, YouTube, Instagram, Discord</p>
              </div>
            </div>
            <div className={`branding-section-chevron ${openSection === 'social' ? 'open' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </button>

          {openSection === 'social' && (
            <div className="branding-section-body">
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                These links appear on the <strong style={{ color: 'var(--text-primary)' }}>Contact Us</strong> page under &quot;Follow Us&quot;. Leave a field empty to hide that platform.
              </p>

              {[
                { key: 'twitter',   label: 'Twitter / X',  icon: <Share2 size={16} />,        color: '#1d9bf0', placeholder: 'https://twitter.com/yourhandle',     val: newTwitter,   set: (v) => { setNewTwitter(v);   setIsDirty(true); } },
                { key: 'youtube',   label: 'YouTube',       icon: <Video size={16} />,         color: '#ff0000', placeholder: 'https://youtube.com/@yourchannel',  val: newYoutube,   set: (v) => { setNewYoutube(v);   setIsDirty(true); } },
                { key: 'instagram', label: 'Instagram',     icon: <AtSign size={16} />,        color: '#e1306c', placeholder: 'https://instagram.com/yourhandle',   val: newInstagram, set: (v) => { setNewInstagram(v); setIsDirty(true); } },
                { key: 'discord',   label: 'Discord',       icon: <MessageCircle size={16} />, color: '#5865f2', placeholder: 'https://discord.gg/yourserver',      val: newDiscord,   set: (v) => { setNewDiscord(v);   setIsDirty(true); } },
                { key: 'facebook',  label: 'Facebook',      icon: <FacebookIcon size={16} />,   color: '#1877f2', placeholder: 'https://facebook.com/yourpage',      val: newFacebook,  set: (v) => { setNewFacebook(v);  setIsDirty(true); } },
              ].map(({ key, label, icon, color, placeholder, val, set }) => (
                <div className="form-group" key={key} style={{ marginBottom: '1rem' }}>
                  <label className="mb-2 block font-medium" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ color }}>{icon}</span> {label}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}><Link size={14} /></span>
                    <input
                      type="url"
                      className="form-input"
                      placeholder={placeholder}
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    {val && (
                      <button
                        type="button"
                        className="color-reset-btn"
                        onClick={() => set('')}
                        title={`Clear ${label} link`}
                      >
                        <RotateCcw size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Home Page YouTube Links Section ── */}
        <div className="branding-section">
          <button
            type="button"
            className={`branding-section-header ${openSection === 'youtube_links' ? 'active' : ''}`}
            onClick={() => setOpenSection(openSection === 'youtube_links' ? null : 'youtube_links')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ color: '#ff0000', display: 'flex' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"/></svg>
              </span>
              Home Page — YouTube Buttons
            </span>
            <ChevronDown size={16} style={{ transform: openSection === 'youtube_links' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {openSection === 'youtube_links' && (
            <div className="branding-section-body">
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                Control the URLs behind the <strong style={{ color: '#ff4444' }}>Watch Live Now</strong> and <strong style={{ color: 'var(--text-primary)' }}>Subscribe Free</strong> buttons on the Home page YouTube section.
              </p>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="mb-2 block font-medium" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ color: '#ff0000', display: 'flex' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"/></svg>
                  </span>
                  "Watch Live Now" Button URL
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}><Link size={14} /></span>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://youtube.com/live/..."
                    value={newYtWatch}
                    onChange={e => { setNewYtWatch(e.target.value); setIsDirty(true); }}
                    style={{ flex: 1 }}
                  />
                  {newYtWatch && (
                    <a href={newYtWatch} target="_blank" rel="noopener noreferrer"
                      style={{ flexShrink: 0, color: '#ff4444', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}
                    >Test ↗</a>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="mb-2 block font-medium" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'flex' }}><Link size={14} /></span>
                  "Subscribe Free" Button URL
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}><Link size={14} /></span>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://youtube.com/@channel?sub_confirmation=1"
                    value={newYtSubscribe}
                    onChange={e => { setNewYtSubscribe(e.target.value); setIsDirty(true); }}
                    style={{ flex: 1 }}
                  />
                  {newYtSubscribe && (
                    <a href={newYtSubscribe} target="_blank" rel="noopener noreferrer"
                      style={{ flexShrink: 0, color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}
                    >Test ↗</a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════
            SECTION: CONTACT INFO
        ═══════════════════════════════════════════════════════ */}
        <div className="branding-section">
          <button type="button" className="branding-section-header" onClick={() => toggleSection('contact')}>
            <div className="branding-section-title">
              <div className="branding-section-icon" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
                <Mail size={18} />
              </div>
              <div>
                <h3>Contact Info</h3>
                <p>Email shown on the Contact page</p>
              </div>
            </div>
            <div className={`branding-section-chevron ${openSection === 'contact' ? 'open' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </button>

          {openSection === 'contact' && (
            <div className="branding-section-body">
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                This email appears on the <strong style={{ color: 'var(--text-primary)' }}>Contact Us</strong> page — in the card, the mailto link, and anywhere else the contact email is referenced.
              </p>
              <div className="form-group">
                <label className="mb-2 block font-medium" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Mail size={15} style={{ color: '#60a5fa' }} /> Contact Email
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="admin@roberttrades.com"
                    value={newContactEmail}
                    onChange={e => { setNewContactEmail(e.target.value); setIsDirty(true); }}
                    style={{ flex: 1 }}
                  />
                  {newContactEmail && (
                    <button
                      type="button"
                      className="color-reset-btn"
                      onClick={() => { setNewContactEmail(''); setIsDirty(true); }}
                      title="Clear email"
                    >
                      <RotateCcw size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Google Tag Manager Section ── */}
        <div className="branding-section">
          <button type="button" className="branding-section-header" onClick={() => toggleSection('analytics')}>
            <div className="branding-section-title">
              <div className="branding-section-icon" style={{ background: 'linear-gradient(135deg, #4285f4, #34a853)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 17h3v3"/><path d="M17 14h3"/></svg>
              </div>
              <div>
                <h3>Google Tag Manager</h3>
                <p>Container ID (GTM-XXXXXXX)</p>
              </div>
            </div>
            <div className={`branding-section-chevron ${openSection === 'analytics' ? 'open' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </button>

          {openSection === 'analytics' && (
            <div className="branding-section-body">
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                Connect Google Tag Manager to manage all your tracking pixels (GA4, Facebook, TikTok, etc.) from one dashboard — no code changes needed.{' '}
                <a
                  href="https://tagmanager.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#4285f4', fontWeight: 600, textDecoration: 'underline' }}
                >
                  Click here to get started
                </a>
                . You will be given a Container ID in the format <code style={{ background: 'var(--bg-tertiary)', padding: '1px 6px', borderRadius: 4, fontSize: '0.8rem' }}>GTM-XXXXXXX</code> — copy and paste it below.
              </p>
              <div className="form-group">
                <label className="mb-2 block font-medium" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4285f4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 17h3v3"/><path d="M17 14h3"/></svg>
                  Container ID
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="GTM-XXXXXXX"
                    value={newGtmId}
                    onChange={e => { setNewGtmId(e.target.value.trim()); setIsDirty(true); }}
                    style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '0.05em' }}
                  />
                  {newGtmId && (
                    <button type="button" className="color-reset-btn" onClick={() => { setNewGtmId(''); setIsDirty(true); }} title="Disable Tag Manager">
                      <RotateCcw size={13} />
                    </button>
                  )}
                </div>
                {newGtmId && (
                  <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={12} /> GTM active — container: <strong>{newGtmId}</strong>
                  </p>
                )}
                {!newGtmId && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    Tag Manager disabled — no tracking scripts will load.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Save Button ── */}
        <button
          type="submit"
          className="btn btn-primary branding-save-btn"
          disabled={isSubmitting || !isDirty}
          style={!isDirty ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          {isSubmitting ? 'Saving...' : 'Save All Changes'}
        </button>
      </form>
    </div>
  );
};

export default BrandingManager;
