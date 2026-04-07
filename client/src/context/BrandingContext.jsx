import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BrandingContext = createContext();

const API_BASE = 'http://localhost:5000';

// Default theme values
const THEME_DEFAULTS = {
  primaryColor: '#2563EB',
  secondaryColor: '#3B82F6',
  accentColor: '#10b981',
  layout: 'default',
  themeMode: 'dark',
};

// Dynamically update the browser tab favicon
const applyFavicon = (faviconUrl) => {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  if (faviconUrl) {
    link.href = `${API_BASE}${faviconUrl}`;
  } else {
    link.href = '/favicon.svg'; // default
  }
};

// Apply theme colors as CSS variables on :root
const applyThemeColors = (primary, secondary, accent) => {
  const root = document.documentElement;
  if (primary) {
    root.style.setProperty('--brand-primary', primary);
    root.style.setProperty('--accent-primary', primary);
    // Generate glow variants from primary
    root.style.setProperty('--glow-soft', `0 0 40px ${primary}1a`);
    root.style.setProperty('--glow-accent', `0 0 15px ${primary}40`);
  }
  if (secondary) {
    root.style.setProperty('--brand-secondary', secondary);
    root.style.setProperty('--accent-secondary', secondary);
    root.style.setProperty('--accent-blue', secondary);
  }
  if (accent) {
    root.style.setProperty('--accent-teal', accent);
  }
};

// Clear theme colors (reset to CSS defaults)
const clearThemeColors = () => {
  const root = document.documentElement;
  const props = [
    '--brand-primary', '--brand-secondary',
    '--accent-primary', '--accent-secondary', '--accent-blue', '--accent-teal',
    '--glow-soft', '--glow-accent',
  ];
  props.forEach(p => root.style.removeProperty(p));
};

// Apply layout mode as data attribute
const applyLayout = (layout) => {
  document.documentElement.setAttribute('data-layout', layout || 'default');
};

export const BrandingProvider = ({ children }) => {
  // — Identity
  const [siteLogo, setSiteLogo] = useState(null);
  const [siteName, setSiteName] = useState(() => localStorage.getItem('branding_site_name') || "Robert's Trades");
  const [logoSize, setLogoSize] = useState(() => localStorage.getItem('branding_logo_size') || '32');
  const [siteNameColor, setSiteNameColor] = useState(() => localStorage.getItem('branding_site_name_color') || '');
  const [siteFavicon, setSiteFavicon] = useState(() => localStorage.getItem('branding_site_favicon') || '');

  // — Theme Colors
  const [primaryColor, setPrimaryColor] = useState(() => localStorage.getItem('branding_primary') || THEME_DEFAULTS.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(() => localStorage.getItem('branding_secondary') || THEME_DEFAULTS.secondaryColor);
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('branding_accent') || THEME_DEFAULTS.accentColor);

  // — Layout & Mode
  const [layout, setLayout] = useState(() => localStorage.getItem('branding_layout') || THEME_DEFAULTS.layout);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('branding_theme_mode') || THEME_DEFAULTS.themeMode);

  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/settings`);
      const d = res.data;

      if (d.site_logo) setSiteLogo(d.site_logo);

      if (d.site_name) {
        setSiteName(d.site_name);
        localStorage.setItem('branding_site_name', d.site_name);
      }

      if (d.site_logo_size) {
        setLogoSize(d.site_logo_size);
        localStorage.setItem('branding_logo_size', d.site_logo_size);
      }

      const color = d.site_name_color || '';
      setSiteNameColor(color);
      if (color) {
        localStorage.setItem('branding_site_name_color', color);
      } else {
        localStorage.removeItem('branding_site_name_color');
      }

      // Favicon
      const favicon = d.site_favicon || '';
      setSiteFavicon(favicon);
      applyFavicon(favicon);
      if (favicon) {
        localStorage.setItem('branding_site_favicon', favicon);
      } else {
        localStorage.removeItem('branding_site_favicon');
      }

      // — Theme Colors
      const pc = d.theme_primary_color || THEME_DEFAULTS.primaryColor;
      const sc = d.theme_secondary_color || THEME_DEFAULTS.secondaryColor;
      const ac = d.theme_accent_color || THEME_DEFAULTS.accentColor;
      setPrimaryColor(pc);
      setSecondaryColor(sc);
      setAccentColor(ac);
      localStorage.setItem('branding_primary', pc);
      localStorage.setItem('branding_secondary', sc);
      localStorage.setItem('branding_accent', ac);
      applyThemeColors(pc, sc, ac);

      // — Layout
      const ly = d.theme_layout || THEME_DEFAULTS.layout;
      setLayout(ly);
      localStorage.setItem('branding_layout', ly);
      applyLayout(ly);

      // — Theme Mode (store as server default; ThemeContext handles user override)
      const tm = d.theme_mode || THEME_DEFAULTS.themeMode;
      setThemeMode(tm);
      localStorage.setItem('branding_theme_mode', tm);

    } catch (error) {
      console.error('Error fetching branding settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Apply cached values immediately before API loads
    const cachedFavicon = localStorage.getItem('branding_site_favicon');
    if (cachedFavicon) applyFavicon(cachedFavicon);

    // Apply cached colors
    const cp = localStorage.getItem('branding_primary');
    const cs = localStorage.getItem('branding_secondary');
    const ca = localStorage.getItem('branding_accent');
    if (cp || cs || ca) {
      applyThemeColors(cp, cs, ca);
    }

    // Apply cached layout
    const cl = localStorage.getItem('branding_layout');
    if (cl) applyLayout(cl);

    fetchSettings();
  }, []);

  // — Identity Updaters (existing)
  const updateBranding = (logoUrl, name, size) => {
    if (logoUrl) setSiteLogo(logoUrl);
    if (name) {
      setSiteName(name);
      localStorage.setItem('branding_site_name', name);
    }
    if (size) {
      setLogoSize(size);
      localStorage.setItem('branding_logo_size', size);
    }
  };

  const updateSiteNameColor = useCallback((color) => {
    const val = color || '';
    setSiteNameColor(val);
    if (val) {
      localStorage.setItem('branding_site_name_color', val);
    } else {
      localStorage.removeItem('branding_site_name_color');
    }
  }, []);

  const updateFavicon = useCallback((faviconUrl) => {
    setSiteFavicon(faviconUrl || '');
    applyFavicon(faviconUrl);
    if (faviconUrl) {
      localStorage.setItem('branding_site_favicon', faviconUrl);
    } else {
      localStorage.removeItem('branding_site_favicon');
    }
  }, []);

  // — Theme Color Updaters (live preview — apply instantly without persisting)
  const updateThemeColors = useCallback((primary, secondary, accent) => {
    if (primary !== undefined) setPrimaryColor(primary || THEME_DEFAULTS.primaryColor);
    if (secondary !== undefined) setSecondaryColor(secondary || THEME_DEFAULTS.secondaryColor);
    if (accent !== undefined) setAccentColor(accent || THEME_DEFAULTS.accentColor);
    applyThemeColors(
      primary !== undefined ? (primary || THEME_DEFAULTS.primaryColor) : undefined,
      secondary !== undefined ? (secondary || THEME_DEFAULTS.secondaryColor) : undefined,
      accent !== undefined ? (accent || THEME_DEFAULTS.accentColor) : undefined,
    );
  }, []);

  // — Layout Updater (live preview)
  const updateLayout = useCallback((newLayout) => {
    setLayout(newLayout || THEME_DEFAULTS.layout);
    applyLayout(newLayout || THEME_DEFAULTS.layout);
  }, []);

  // — Theme Mode Updater
  const updateThemeMode = useCallback((mode) => {
    setThemeMode(mode || THEME_DEFAULTS.themeMode);
  }, []);

  // Reset colors to defaults
  const resetThemeColors = useCallback(() => {
    setPrimaryColor(THEME_DEFAULTS.primaryColor);
    setSecondaryColor(THEME_DEFAULTS.secondaryColor);
    setAccentColor(THEME_DEFAULTS.accentColor);
    applyThemeColors(THEME_DEFAULTS.primaryColor, THEME_DEFAULTS.secondaryColor, THEME_DEFAULTS.accentColor);
  }, []);

  return (
    <BrandingContext.Provider value={{
      // Identity
      siteLogo, siteName, logoSize, siteNameColor, siteFavicon, loading,
      refreshBranding: fetchSettings,
      updateBranding,
      updateSiteNameColor,
      updateFavicon,
      // Theme
      primaryColor, secondaryColor, accentColor,
      layout, themeMode,
      updateThemeColors,
      updateLayout,
      updateThemeMode,
      resetThemeColors,
      THEME_DEFAULTS,
    }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
