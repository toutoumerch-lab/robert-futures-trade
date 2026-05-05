import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CursorGlow = () => {
  const [visible,  setVisible]  = useState(false);
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);

  const mx = useMotionValue(-200);
  const my = useMotionValue(-200);

  /* Dot  — snaps fast */
  const dx = useSpring(mx, { stiffness: 900, damping: 38 });
  const dy = useSpring(my, { stiffness: 900, damping: 38 });

  /* Blob — floats lazily */
  const bx = useSpring(mx, { stiffness: 55, damping: 16 });
  const by = useSpring(my, { stiffness: 55, damping: 16 });

  useEffect(() => {
    /* Only on mouse/trackpad — not on touch screens */
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const SELECTORS = 'a, button, [role="button"], .pf-card, .crs-grid-card, .card, .nav-item, .cursor-hover';

    const onMove  = (e) => { mx.set(e.clientX); my.set(e.clientY); if (!visible) setVisible(true); };
    const onOver  = (e) => { if (e.target.closest(SELECTORS)) setHovering(true);  };
    const onOut   = (e) => { if (e.target.closest(SELECTORS)) setHovering(false); };
    const onDown  = ()  => setClicking(true);
    const onUp    = ()  => setClicking(false);

    window.addEventListener('mousemove',  onMove,  { passive: true });
    document.addEventListener('mouseover',  onOver);
    document.addEventListener('mouseout',   onOut);
    window.addEventListener('mousedown',  onDown);
    window.addEventListener('mouseup',    onUp);

    return () => {
      window.removeEventListener('mousemove',  onMove);
      document.removeEventListener('mouseover',  onOver);
      document.removeEventListener('mouseout',   onOut);
      window.removeEventListener('mousedown',  onDown);
      window.removeEventListener('mouseup',    onUp);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Large ambient glow blob */}
      <motion.div
        style={{
          position: 'fixed', pointerEvents: 'none', zIndex: 9996,
          top: -220, left: -220, width: 440, height: 440,
          borderRadius: '50%',
          background: hovering
            ? 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 68%)'
            : 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 68%)',
          filter: 'blur(4px)',
          x: bx, y: by,
        }}
        animate={{ scale: hovering ? 1.5 : clicking ? 0.75 : 1 }}
        transition={{ scale: { type: 'spring', stiffness: 180, damping: 22 } }}
      />

      {/* Small precise dot */}
      <motion.div
        style={{
          position: 'fixed', pointerEvents: 'none', zIndex: 9999,
          top: -6, left: -6, width: 12, height: 12,
          borderRadius: '50%',
          x: dx, y: dy,
        }}
        animate={{
          scale:      hovering ? 2.8  : clicking ? 0.55 : 1,
          background: hovering ? 'transparent' : 'var(--accent-primary)',
          boxShadow:  hovering
            ? '0 0 0 2px var(--accent-primary), 0 0 16px rgba(99,102,241,0.5)'
            : '0 0 8px rgba(99,102,241,0.6)',
          opacity: clicking ? 0.6 : 1,
        }}
        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      />
    </>
  );
};

export default CursorGlow;
