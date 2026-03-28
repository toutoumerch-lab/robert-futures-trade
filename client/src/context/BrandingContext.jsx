import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BrandingContext = createContext();

export const BrandingProvider = ({ children }) => {
  const [siteLogo, setSiteLogo] = useState(null);
  const [siteName, setSiteName] = useState('Robert\'s Trades');
  const [logoSize, setLogoSize] = useState('32');
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/settings');
      if (res.data.site_logo) {
        setSiteLogo(res.data.site_logo);
      }
      if (res.data.site_name) {
        setSiteName(res.data.site_name);
      }
      if (res.data.site_logo_size) {
        setLogoSize(res.data.site_logo_size);
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
    if (name) setSiteName(name);
    if (size) setLogoSize(size);
  };

  return (
    <BrandingContext.Provider value={{ siteLogo, siteName, logoSize, loading, refreshBranding: fetchSettings, updateBranding }}>
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
