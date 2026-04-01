import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BrandingContext = createContext();

const API_BASE = 'http://localhost:5000';

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

export const BrandingProvider = ({ children }) => {
  const [siteLogo, setSiteLogo] = useState(null);
  const [siteName, setSiteName] = useState(() => localStorage.getItem('branding_site_name') || "Robert's Trades");
  const [logoSize, setLogoSize] = useState(() => localStorage.getItem('branding_logo_size') || '32');
  const [siteNameColor, setSiteNameColor] = useState(() => localStorage.getItem('branding_site_name_color') || '');
  const [siteFavicon, setSiteFavicon] = useState(() => localStorage.getItem('branding_site_favicon') || '');
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/settings`);
      if (res.data.site_logo) setSiteLogo(res.data.site_logo);

      if (res.data.site_name) {
        setSiteName(res.data.site_name);
        localStorage.setItem('branding_site_name', res.data.site_name);
      }

      if (res.data.site_logo_size) {
        setLogoSize(res.data.site_logo_size);
        localStorage.setItem('branding_logo_size', res.data.site_logo_size);
      }

      const color = res.data.site_name_color || '';
      setSiteNameColor(color);
      if (color) {
        localStorage.setItem('branding_site_name_color', color);
      } else {
        localStorage.removeItem('branding_site_name_color');
      }

      // Favicon
      const favicon = res.data.site_favicon || '';
      setSiteFavicon(favicon);
      applyFavicon(favicon);
      if (favicon) {
        localStorage.setItem('branding_site_favicon', favicon);
      } else {
        localStorage.removeItem('branding_site_favicon');
      }
    } catch (error) {
      console.error('Error fetching branding settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Apply cached favicon immediately (before API loads)
    const cachedFavicon = localStorage.getItem('branding_site_favicon');
    if (cachedFavicon) applyFavicon(cachedFavicon);

    fetchSettings();
  }, []);

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

  return (
    <BrandingContext.Provider value={{
      siteLogo, siteName, logoSize, siteNameColor, siteFavicon, loading,
      refreshBranding: fetchSettings,
      updateBranding,
      updateSiteNameColor,
      updateFavicon,
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
