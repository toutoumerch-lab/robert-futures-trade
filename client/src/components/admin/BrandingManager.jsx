import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useBranding } from '../../context/BrandingContext';
import Card from '../common/Card';
import { Upload, Check, AlertCircle, Pipette, RotateCcw } from 'lucide-react';

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

const BrandingManager = () => {
  const {
    siteLogo, siteName, logoSize, siteNameColor,
    refreshBranding, updateBranding, updateSiteNameColor
  } = useBranding();

  // Local form state
  const [newName, setNewName] = useState(siteName);
  const [newSize, setNewSize] = useState(logoSize);
  const [newNameColor, setNewNameColor] = useState(siteNameColor || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hexInput, setHexInput] = useState((siteNameColor || '').replace('#', ''));

  // Track whether user has made changes (bug fix: don't compare against context which we update for live preview)
  const [isDirty, setIsDirty] = useState(false);

  // Sync from context ONLY on initial load (not during editing)
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

  const handleNameChange = (e) => {
    const val = e.target.value;
    setNewName(val);
    setIsDirty(true);
    // Live preview in navbar
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
    // Live preview in navbar
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

      // Validate color if set
      if (newNameColor && !HEX_REGEX.test(newNameColor)) {
        setStatus({ type: 'error', message: 'Invalid HEX color code. Use format like #FF5733.' });
        setIsSubmitting(false);
        return;
      }

      // Save to backend
      const payload = {
        site_name: newName,
        site_logo_size: newSize,
        site_name_color: newNameColor || '',
      };

      console.log('[Branding] Saving to backend:', payload);

      const saveRes = await axios.put('http://localhost:5000/api/settings', payload, config);
      console.log('[Branding] Save response:', saveRes.data);

      // Upload logo if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('logo', selectedFile);
        await axios.post('http://localhost:5000/api/settings/logo', formData, {
          headers: { ...config.headers, 'Content-Type': 'multipart/form-data' }
        });
      }

      setStatus({ type: 'success', message: 'Branding updated successfully!' });
      setIsDirty(false);
      setSelectedFile(null);
      setPreviewUrl(null);

      // Re-fetch from database to sync everything
      await refreshBranding();

      console.log('[Branding] Saved and refreshed successfully');
    } catch (error) {
      console.error('[Branding] Save error:', error);
      setStatus({
        type: 'error',
        message: error.response?.data?.error || 'Failed to update branding. Check your connection.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview color for the name
  const displayColor = (newNameColor && HEX_REGEX.test(newNameColor)) ? newNameColor : null;

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
              {/* Color swatch + native picker */}
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

              {/* HEX input */}
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

              {/* Reset */}
              {newNameColor && (
                <button
                  type="button"
                  className="color-reset-btn"
                  onClick={resetColor}
                  title="Reset to gradient (default)"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>

            {/* Live preview of the name */}
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
                {previewUrl || (siteLogo ? `http://localhost:5000${siteLogo}` : null) ? (
                  <img src={previewUrl || `http://localhost:5000${siteLogo}`} alt="Logo Preview" style={{ maxWidth: '90%' }} />
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
