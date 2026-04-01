import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BrandingContext = createContext();

export const BrandingProvider = ({ children }) => {
  const [siteLogo, setSiteLogo] = useState(null);
  const [siteName, setSiteName] = useState(() => localStorage.getItem('branding_site_name') || "Robert's Trades");
  const [logoSize, setLogoSize] = useState(() => localStorage.getItem('branding_logo_size') || '32');
  const [siteNameColor, setSiteNameColor] = useState(() => localStorage.getItem('branding_site_name_color') || '');
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/settings');
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
    } catch (error) {
      console.error('Error fetching branding settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  return (
    <BrandingContext.Provider value={{
      siteLogo, siteName, logoSize, siteNameColor, loading,
      refreshBranding: fetchSettings,
      updateBranding,
      updateSiteNameColor,
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
