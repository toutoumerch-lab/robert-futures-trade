import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useBranding } from '../../context/BrandingContext';
import Card from '../common/Card';
import { Upload, Check, AlertCircle, Pipette, RotateCcw, Globe } from 'lucide-react';

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;
const API_BASE = 'http://localhost:5000';

const BrandingManager = () => {
  const {
    siteLogo, siteName, logoSize, siteNameColor, siteFavicon,
    refreshBranding, updateBranding, updateSiteNameColor, updateFavicon
  } = useBranding();

  // Local form state
  const [newName, setNewName] = useState(siteName);
  const [newSize, setNewSize] = useState(logoSize);
  const [newNameColor, setNewNameColor] = useState(siteNameColor || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFavicon, setSelectedFavicon] = useState(null);
  const [faviconPreviewUrl, setFaviconPreviewUrl] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hexInput, setHexInput] = useState((siteNameColor || '').replace('#', ''));
  const [isDirty, setIsDirty] = useState(false);

  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (isFirstLoad.current) {
      setNewName(siteName);
      isFirstLoad.current = false;
    }
  }, [siteName]);

  useEffect(() => { setNewSize(logoSize); }, [logoSize]);

  useEffect(() => {
    if (!isDirty) {
      setNewNameColor(siteNameColor || '');
      setHexInput((siteNameColor || '').replace('#', ''));
    }
  }, [siteNameColor, isDirty]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsDirty(true);
    }
  };

  const handleFaviconSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (1MB max)
    if (file.size > 1024 * 1024) {
      setStatus({ type: 'error', message: 'Favicon must be under 1MB.' });
      return;
    }

    setSelectedFavicon(file);
    setFaviconPreviewUrl(URL.createObjectURL(file));
    setIsDirty(true);
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setNewName(val);
    setIsDirty(true);
    updateBranding(null, val, null);
  };

  const handleSizeChange = (val) => {
    setNewSize(val);
    setIsDirty(true);
    updateBranding(null, null, val);
  };

  const handleColorPicker = (e) => {
    const val = e.target.value;
    setNewNameColor(val);
    setHexInput(val.replace('#', ''));
    setIsDirty(true);
    updateSiteNameColor(val);
  };

  const handleHexInput = (raw) => {
    const cleaned = raw.replace(/[^0-9A-Fa-f]/g, '').substring(0, 6);
    setHexInput(cleaned);
    if (cleaned.length === 6) {
      const hex = '#' + cleaned;
      setNewNameColor(hex);
      setIsDirty(true);
      updateSiteNameColor(hex);
    }
  };

  const resetColor = () => {
    setNewNameColor('');
    setHexInput('');
    setIsDirty(true);
    updateSiteNameColor('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setStatus({ type: 'error', message: 'Not authenticated. Please log in again.' });
        setIsSubmitting(false);
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (newNameColor && !HEX_REGEX.test(newNameColor)) {
        setStatus({ type: 'error', message: 'Invalid HEX color code. Use format like #FF5733.' });
        setIsSubmitting(false);
        return;
      }

      // Save text settings
      await axios.put(`${API_BASE}/api/settings`, {
        site_name: newName,
        site_logo_size: newSize,
        site_name_color: newNameColor || '',
      }, config);

      // Upload logo if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('logo', selectedFile);
        await axios.post(`${API_BASE}/api/settings/logo`, formData, {
          headers: { ...config.headers, 'Content-Type': 'multipart/form-data' }
        });
      }

      // Upload favicon if selected
      if (selectedFavicon) {
        const formData = new FormData();
        formData.append('favicon', selectedFavicon);
        const favRes = await axios.post(`${API_BASE}/api/settings/favicon`, formData, {
          headers: { ...config.headers, 'Content-Type': 'multipart/form-data' }
        });
        // Apply favicon immediately
        if (favRes.data.favicon_url) {
          updateFavicon(favRes.data.favicon_url);
        }
      }

      setStatus({ type: 'success', message: 'Branding updated successfully!' });
      setIsDirty(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setSelectedFavicon(null);
      setFaviconPreviewUrl(null);

      await refreshBranding();
    } catch (error) {
      console.error('[Branding] Save error:', error);
      setStatus({
        type: 'error',
        message: error.response?.data?.error || 'Failed to update branding.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayColor = (newNameColor && HEX_REGEX.test(newNameColor)) ? newNameColor : null;

  // Favicon preview source
  const faviconSrc = faviconPreviewUrl || (siteFavicon ? `${API_BASE}${siteFavicon}` : null);

  return (
    <div className="branding-manager">
      <Card style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 className="mb-6">Global Branding</h2>

        {status.message && (
          <div className={`status-pill ${status.type} mb-4`}>
            {status.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* ── Site Name ── */}
          <div className="form-group">
            <label className="mb-2 block font-medium">Site Name</label>
            <input
              type="text"
              className="form-input"
              value={newName}
              onChange={handleNameChange}
              placeholder="Enter site name"
            />
          </div>

          {/* ── Site Name Color ── */}
          <div className="form-group">
            <label className="mb-2 block font-medium" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Pipette size={15} />
              Site Name Color
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="color-swatch-wrapper">
                <div
                  className="color-swatch"
                  style={{
                    background: displayColor
                      ? displayColor
                      : 'linear-gradient(135deg, #10b981, #3b82f6, #a855f7, #ec4899, #f97316)',
                  }}
                />
                <input
                  type="color"
                  className="color-input-native"
                  value={displayColor || '#a855f7'}
                  onChange={handleColorPicker}
                />
              </div>

              <div className="color-hex-input-wrap">
                <span className="color-hex-hash">#</span>
                <input
                  type="text"
                  className="color-hex-input"
                  placeholder="FFFFFF"
                  maxLength={6}
                  value={hexInput}
                  onChange={(e) => handleHexInput(e.target.value)}
                />
              </div>

              {newNameColor && (
                <button type="button" className="color-reset-btn" onClick={resetColor} title="Reset to gradient (default)">
                  <RotateCcw size={14} />
                </button>
              )}
            </div>

            <div style={{
              marginTop: '0.75rem',
              padding: '0.75rem 1rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Preview:</span>
              <span style={{
                fontWeight: 800,
                fontSize: '1.15rem',
                letterSpacing: '-0.02em',
                ...(displayColor
                  ? { color: displayColor }
                  : {
                      background: 'linear-gradient(135deg, #10b981, #3b82f6, #a855f7, #ec4899, #f97316)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }
                ),
              }}>
                {newName || 'Site Name'}
              </span>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Pick a solid color or leave empty for the default gradient.
            </p>
          </div>

          {/* ── Logo Size ── */}
          <div className="form-group">
            <label className="mb-2 block font-medium">Logo Size (px)</label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                className="form-input"
                style={{ width: '100px' }}
                value={newSize}
                onChange={(e) => handleSizeChange(e.target.value)}
                min="16"
                max="200"
              />
              <input
                type="range"
                min="16"
                max="200"
                value={newSize}
                onChange={(e) => handleSizeChange(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
            <p className="mt-1" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Adjust the height of your logo in the navigation bar.
            </p>
          </div>

          {/* ── Website Logo ── */}
          <div className="form-group">
            <label className="mb-2 block font-medium">Website Logo</label>
            <div className="flex items-center gap-6">
              <div className="logo-preview-box glass flex items-center justify-center overflow-hidden"
                   style={{ width: '100px', height: '100px', borderRadius: 'var(--radius-md)' }}>
                {previewUrl || (siteLogo ? `${API_BASE}${siteLogo}` : null) ? (
                  <img src={previewUrl || `${API_BASE}${siteLogo}`} alt="Logo Preview" style={{ maxWidth: '90%' }} />
                ) : (
                  <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>No Logo</span>
                )}
              </div>
              <div className="flex-1">
                <label className="btn btn-outline cursor-pointer" style={{ gap: '0.5rem' }}>
                  <Upload size={18} />
                  Choose File
                  <input type="file" className="hidden" onChange={handleFileSelect} accept="image/*" />
                </label>
                <p className="mt-2" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  PNG, JPG or SVG. Max 2MB.
                </p>
              </div>
            </div>
          </div>

          {/* ── Favicon ── */}
          <div className="form-group">
            <label className="mb-2 block font-medium" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Globe size={15} />
              Favicon
            </label>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '-0.2rem 0 0.75rem 0' }}>
              The small icon shown in the browser tab. Recommended: 32×32 px.
            </p>

            <div className="flex items-center gap-6">
              {/* Favicon preview */}
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
                position: 'relative',
              }}>
                {faviconSrc ? (
                  <img
                    src={faviconSrc}
                    alt="Favicon Preview"
                    style={{ width: '32px', height: '32px', objectFit: 'contain', imageRendering: 'pixelated' }}
                  />
                ) : (
                  <Globe size={20} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} />
                )}
              </div>

              <div className="flex-1">
                <label className="btn btn-outline cursor-pointer" style={{ gap: '0.5rem' }}>
                  <Upload size={18} />
                  Choose Favicon
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFaviconSelect}
                    accept=".ico,.png,.svg,.jpg,.jpeg,image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml,image/jpeg"
                  />
                </label>
                <p className="mt-2" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  ICO, PNG, SVG or JPG. Max 1MB.
                </p>
              </div>
            </div>

            {/* Browser tab preview */}
            {faviconSrc && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.6rem 1rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
              }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Tab Preview:</span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px 8px 0 0',
                  padding: '0.4rem 0.75rem',
                  minWidth: '140px',
                }}>
                  <img
                    src={faviconSrc}
                    alt="Tab favicon"
                    style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                    {newName || 'Site Name'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary mt-4"
            disabled={isSubmitting || !isDirty}
            style={!isDirty ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </Card>
    </div>
  );
};

export default BrandingManager;
