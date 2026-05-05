import { useEffect, useRef } from 'react';

/**
 * Pure rAF cursor — zero Framer Motion, zero React re-renders after mount.
 * Dot: instant (snaps to cursor each frame).
 * Blob: lerp factor 0.12 — smooth trail, never blocks the main thread.
 */
const CursorGlow = () => {
  const dotRef  = useRef(null);
  const blobRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (!wrapRef.current) return;
    wrapRef.current.style.display = 'block';

    const target = { x: -200, y: -200 };
    const blob   = { x: -200, y: -200 };
    let raf = null;

    const lerp = (a, b, t) => a + (b - a) * t;

    const tick = () => {
      blob.x = lerp(blob.x, target.x, 0.12);
      blob.y = lerp(blob.y, target.y, 0.12);

      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate(${target.x - 6}px, ${target.y - 6}px) translateZ(0)`;
      }
      if (blobRef.current) {
        blobRef.current.style.transform =
          `translate(${blob.x - 200}px, ${blob.y - 200}px) translateZ(0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      target.x = e.clientX;
      target.y = e.clientY;
    };

    const TARGETS = 'a,button,[role="button"],.card,.pf-card,.crs-grid-card,.nav-item,.cursor-hover';
    const onOver  = (e) => {
      if (!e.target.closest(TARGETS)) return;
      dotRef.current && (dotRef.current.dataset.hover = '1');
    };
    const onOut   = (e) => {
      if (!e.target.closest(TARGETS)) return;
      dotRef.current && (dotRef.current.dataset.hover = '');
    };

    raf = requestAnimationFrame(tick);
    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout',  onOut);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout',  onOut);
    };
  }, []);

  return (
    <div ref={wrapRef} style={{ display: 'none' }} aria-hidden>
      {/* Ambient glow blob */}
      <div ref={blobRef} className="cur-blob" />
      {/* Precise dot */}
      <div ref={dotRef} className="cur-dot" />
    </div>
  );
};

export default CursorGlow;
