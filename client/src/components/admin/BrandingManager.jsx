import React, { useState } from 'react';
import axios from 'axios';
import { useBranding } from '../../context/BrandingContext';
import Card from '../common/Card';
import { Upload, Check, AlertCircle } from 'lucide-react';

const BrandingManager = () => {
  const { siteLogo, siteName, logoSize, refreshBranding, updateBranding } = useBranding();
  const [newName, setNewName] = useState(siteName);
  const [newSize, setNewSize] = useState(logoSize);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // 1. Update Site Name or Logo Size if changed
      if (newName !== siteName || newSize !== logoSize) {
        await axios.put('http://localhost:5000/api/settings', { 
          site_name: newName,
          site_logo_size: newSize 
        }, config);
      }

      // 2. Upload Logo if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('logo', selectedFile);
        await axios.post('http://localhost:5000/api/settings/logo', formData, {
          headers: { 
            ...config.headers,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      setStatus({ type: 'success', message: 'Branding updated successfully!' });
      refreshBranding();
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Error updating branding:', error);
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to update branding.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="form-group">
            <label className="mb-2 block font-medium">Site Name</label>
            <input
              type="text"
              className="form-input"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                updateBranding(null, e.target.value, null);
              }}
              placeholder="Enter site name"
            />
          </div>

          <div className="form-group">
            <label className="mb-2 block font-medium">Logo Size (px)</label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                className="form-input"
                style={{ width: '100px' }}
                value={newSize}
                onChange={(e) => {
                  setNewSize(e.target.value);
                  updateBranding(null, null, e.target.value);
                }}
                min="16"
                max="200"
              />
              <input 
                type="range" 
                min="16" 
                max="200" 
                value={newSize} 
                onChange={(e) => {
                  setNewSize(e.target.value);
                  updateBranding(null, null, e.target.value);
                }}
                style={{ flex: 1 }}
              />
            </div>
            <p className="mt-1" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Adjust the height of your logo in the navigation bar.
            </p>
          </div>

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
            disabled={isSubmitting || (newName === siteName && newSize === logoSize && !selectedFile)}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </Card>
    </div>
  );
};

export default BrandingManager;
