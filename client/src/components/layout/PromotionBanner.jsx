import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PromotionBanner = () => {
  const [promo, setPromo] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchPromo = () => {
      axios.get('http://localhost:5000/api/promotions/active')
        .then(res => setPromo(res.data))
        .catch(() => setPromo(null));
    };

    fetchPromo();
    // Poll every 60 seconds so the banner auto-updates when admin changes the active promo
    const interval = setInterval(fetchPromo, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!promo || dismissed) return null;

  const isExpiringSoon = promo.expires_at
    ? (new Date(promo.expires_at) - Date.now()) < 24 * 60 * 60 * 1000
    : false;

  const PromoContent = () => (
    <div className="promo-item">
      <span className="promo-tag">🎉 Promo</span>
      <span className="promo-title">{promo.title}</span>
      {promo.code && <CopyCode code={promo.code} />}
      {promo.expires_at && (
        <span className="promo-expiry">
          Expires {new Date(promo.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      )}
    </div>
  );

  return (
    <div className={`promo-banner ${isExpiringSoon ? 'promo-urgent' : ''}`} role="banner" aria-label="Promotion">
      <div className="promo-ticker">
        <div className="promo-ticker-track">
          {/* Duplicate content for seamless scrolling */}
          <PromoContent />
          <PromoContent />
          <PromoContent />
          <PromoContent />
        </div>
      </div>
      <button
        className="promo-dismiss"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss promotion"
      >
        ✕
      </button>
    </div>
  );
};

const CopyCode = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: just show copied state
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button className={`promo-code ${copied ? 'copied' : ''}`} onClick={handleCopy} title="Copy code">
      <span className="promo-code-text">{code}</span>
      <span className="promo-code-action">{copied ? '✓ Copied!' : 'Copy'}</span>
    </button>
  );
};

export default PromotionBanner;
