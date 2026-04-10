import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, Copy, Check, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/* ─────────────────────────────────────────────
   CopyCode Button
───────────────────────────────────────────── */
const CopyCode = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (_) { /* fallback */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy promo code"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px 3px 8px',
        borderRadius: '6px',
        border: copied
          ? '1px solid rgba(52,211,153,0.5)'
          : theme === 'dark'
            ? '1px dashed rgba(37,99,235,0.5)'
            : '1px dashed rgba(99,60,180,0.45)',
        background: copied
          ? 'rgba(52,211,153,0.12)'
          : theme === 'dark'
            ? 'rgba(37,99,235,0.10)'
            : 'rgba(99,60,180,0.08)',
        color: copied
          ? '#34d399'
          : theme === 'dark' ? '#c084fc' : '#7c3aed',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: 'monospace',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      <span>{code}</span>
      <span style={{
        fontSize: '9px',
        fontFamily: 'inherit',
        fontWeight: 800,
        letterSpacing: '0.05em',
        opacity: 0.7,
        textTransform: 'uppercase',
      }}>
        {copied ? 'Copied!' : 'Copy'}
      </span>
    </button>
  );
};

/* ─────────────────────────────────────────────
   Single promo item (rendered in the ticker)
───────────────────────────────────────────── */
const PromoItem = ({ promo, theme }) => {
  const discountMatch = promo.title.match(/(\d+%\s*OFF)/i);
  const discountText = discountMatch ? discountMatch[1] : null;
  const remainingTitle = discountText
    ? promo.title.replace(discountMatch[0], '').trim()
    : promo.title;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '18px',
      padding: '0 40px',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}>
      {/* Divider dot */}
      <span style={{
        width: 5, height: 5,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        flexShrink: 0,
        opacity: 0.6,
      }} />

      {/* PROMO badge */}
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 9px',
        borderRadius: '100px',
        fontSize: '9px',
        fontWeight: 800,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        border: theme === 'dark'
          ? '1px solid rgba(37,99,235,0.3)'
          : '1px solid rgba(99,60,180,0.25)',
        background: theme === 'dark'
          ? 'rgba(37,99,235,0.12)'
          : 'rgba(99,60,180,0.09)',
        color: theme === 'dark' ? '#c084fc' : '#7c3aed',
        flexShrink: 0,
      }}>
        <Sparkles size={9} style={{ animation: 'pulse 2s infinite' }} />
        Promo
      </span>

      {/* Discount % */}
      {discountText && (
        <span style={{
          fontSize: '15px',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 50%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          flexShrink: 0,
        }}>
          {discountText}
        </span>
      )}

      {/* Title */}
      <span style={{
        fontSize: '13px',
        fontWeight: 600,
        letterSpacing: '-0.01em',
        color: theme === 'dark' ? 'rgba(255,255,255,0.88)' : 'rgba(15,10,30,0.85)',
        flexShrink: 0,
      }}>
        {remainingTitle}
      </span>

      {/* Copy code */}
      {promo.code && <CopyCode code={promo.code} />}

      {/* Expiry */}
      {promo.expires_at && (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '11px',
          fontWeight: 500,
          padding: '2px 8px',
          borderRadius: '5px',
          background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
          border: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
          color: theme === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
          flexShrink: 0,
        }}>
          <Clock size={10} />
          Expires {new Date(promo.expires_at).toLocaleDateString()}
        </span>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main Banner — shows ALL active promotions
───────────────────────────────────────────── */
const PromotionBanner = () => {
  const [promos, setPromos] = useState([]);
  const [dismissed, setDismissed] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchPromos = () => {
      axios.get('http://localhost:5000/api/promotions/active')
        .then(res => {
          // API now returns an array of all active promotions
          if (Array.isArray(res.data)) {
            setPromos(res.data);
          } else if (res.data) {
            // Backward compatibility: single object
            setPromos([res.data]);
          } else {
            setPromos([]);
          }
        })
        .catch(() => setPromos([]));
    };
    fetchPromos();
    const interval = setInterval(fetchPromos, 10_000);
    return () => clearInterval(interval);
  }, []);

  if (promos.length === 0 || dismissed) return null;

  // Use the average ticker speed, or default 40s
  const avgSpeed = promos.reduce((sum, p) => sum + (p.ticker_speed || 40), 0) / promos.length;
  // Scale duration by number of promos so it doesn't fly by with many items
  const tickerDuration = Math.max(avgSpeed, promos.length * 12);

  const isDark = theme === 'dark';

  const bannerBg = isDark
    ? 'rgba(10, 8, 20, 0.72)'
    : 'rgba(255, 255, 255, 0.82)';

  const topLineGradient = 'linear-gradient(90deg, transparent 0%, #3b82f6 25%, #2563eb 50%, #3b82f6 75%, transparent 100%)';

  // Build the ticker content: all promos repeated 4x for seamless loop
  const tickerItems = [];
  for (let repeat = 0; repeat < 4; repeat++) {
    promos.forEach((promo, idx) => {
      tickerItems.push(
        <PromoItem
          key={`${repeat}-${promo.id || idx}`}
          promo={promo}
          theme={theme}
        />
      );
    });
  }

  return (
    <AnimatePresence>
      <motion.div
        key="promo-banner"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{
          position: 'relative',
          zIndex: 100,
          overflow: 'hidden',
          background: bannerBg,
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: isDark
            ? '1px solid rgba(37,99,235,0.15)'
            : '1px solid rgba(99,60,180,0.12)',
        }}
      >
        {/* ── Top gradient beam ── */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '1.5px',
          background: topLineGradient,
          opacity: isDark ? 0.7 : 0.55,
          zIndex: 2,
        }} />

        {/* ── Subtle glow orbs ── */}
        <div style={{
          position: 'absolute',
          left: '20%', top: '50%',
          transform: 'translateY(-50%)',
          width: 120, height: 30,
          background: 'rgba(59,130,246,0.15)',
          filter: 'blur(20px)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          right: '25%', top: '50%',
          transform: 'translateY(-50%)',
          width: 100, height: 25,
          background: 'rgba(37,99,235,0.15)',
          filter: 'blur(18px)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />

        {/* ── Ticker row ── */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          height: '42px',
          overflow: 'hidden',
        }}>
          {/* Left fade mask */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: 60,
            background: isDark
              ? 'linear-gradient(to right, rgba(10,8,20,0.85), transparent)'
              : 'linear-gradient(to right, rgba(255,255,255,0.9), transparent)',
            zIndex: 3,
            pointerEvents: 'none',
          }} />

          {/* Scrolling ticker with ALL promotions */}
          <motion.div
            key={`ticker-${promos.length}-${tickerDuration}`}
            animate={{ x: ['0%', '-50%'] }}
            transition={{ repeat: Infinity, ease: 'linear', duration: tickerDuration }}
            style={{
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              willChange: 'transform',
            }}
          >
            {tickerItems}
          </motion.div>

          {/* Right fade + dismiss */}
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 40,
            paddingRight: 12,
            background: isDark
              ? 'linear-gradient(to left, rgba(10,8,20,0.95) 60%, transparent)'
              : 'linear-gradient(to left, rgba(255,255,255,0.98) 60%, transparent)',
            zIndex: 4,
          }}>
            <button
              onClick={() => setDismissed(true)}
              title="Dismiss"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: isDark
                  ? '1px solid rgba(255,255,255,0.1)'
                  : '1px solid rgba(0,0,0,0.1)',
                background: 'transparent',
                color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
                e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
              }}
              aria-label="Dismiss promotion"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* ── Bottom gradient beam ── */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '1px',
          background: topLineGradient,
          opacity: isDark ? 0.2 : 0.15,
          zIndex: 2,
        }} />
      </motion.div>
    </AnimatePresence>
  );
};

export default PromotionBanner;
