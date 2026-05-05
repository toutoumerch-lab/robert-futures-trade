import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * Zero re-renders after mount — hover state updates DOM directly via refs.
 */
const CursorGlow = () => {
  const [visible, setVisible] = useState(false);
  const dotRef  = useRef(null);
  const blobRef = useRef(null);

  const mx = useMotionValue(-200);
  const my = useMotionValue(-200);

  /* Dot  — snaps fast */
  const dx = useSpring(mx, { stiffness: 900, damping: 38 });
  const dy = useSpring(my, { stiffness: 900, damping: 38 });

  /* Blob — floats lazily */
  const bx = useSpring(mx, { stiffness: 55, damping: 18 });
  const by = useSpring(my, { stiffness: 55, damping: 18 });

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const TARGETS = 'a, button, [role="button"], .pf-card, .crs-grid-card, .card, .nav-item, .cursor-hover';

    /* Direct DOM updates — no setState, no re-render */
    const setHover = (on) => {
      if (!dotRef.current || !blobRef.current) return;
      if (on) {
        dotRef.current.style.scale  = '2.8';
        dotRef.current.style.background = 'transparent';
        dotRef.current.style.boxShadow  = '0 0 0 2px var(--accent-primary), 0 0 16px rgba(99,102,241,0.5)';
        blobRef.current.style.scale     = '1.5';
        blobRef.current.style.background = 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 68%)';
      } else {
        dotRef.current.style.scale  = '1';
        dotRef.current.style.background = 'var(--accent-primary)';
        dotRef.current.style.boxShadow  = '0 0 8px rgba(99,102,241,0.6)';
        blobRef.current.style.scale     = '1';
        blobRef.current.style.background = 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 68%)';
      }
    };

    const onMove  = (e) => { mx.set(e.clientX); my.set(e.clientY); if (!visible) setVisible(true); };
    const onOver  = (e) => { if (e.target.closest(TARGETS)) setHover(true);  };
    const onOut   = (e) => { if (e.target.closest(TARGETS)) setHover(false); };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout',  onOut);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout',  onOut);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      <motion.div
        ref={blobRef}
        style={{
          position: 'fixed', pointerEvents: 'none', zIndex: 9996,
          top: -220, left: -220, width: 440, height: 440,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 68%)',
          filter: 'blur(4px)',
          x: bx, y: by,
          transition: 'scale 0.3s, background 0.3s',
        }}
      />
      <motion.div
        ref={dotRef}
        style={{
          position: 'fixed', pointerEvents: 'none', zIndex: 9999,
          top: -6, left: -6, width: 12, height: 12,
          borderRadius: '50%',
          background: 'var(--accent-primary)',
          boxShadow: '0 0 8px rgba(99,102,241,0.6)',
          x: dx, y: dy,
          transition: 'scale 0.25s, background 0.2s, box-shadow 0.2s',
        }}
      />
    </>
  );
};

export default CursorGlow;
