import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * Wraps children in a 3D-tilt card with a cursor-following spotlight.
 * Usage: <TiltCard className="card"> ... </TiltCard>
 */
const TiltCard = ({ children, className = '', style = {}, intensity = 7 }) => {
  const ref      = useRef(null);
  const spotRef  = useRef(null);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(py, [0, 1], [intensity, -intensity]), { stiffness: 220, damping: 32 });
  const rotateY = useSpring(useTransform(px, [0, 1], [-intensity,  intensity]), { stiffness: 220, damping: 32 });
  const glowOp  = useMotionValue(0);

  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top)  / r.height;
    px.set(nx); py.set(ny);
    glowOp.set(1);
    if (spotRef.current) {
      spotRef.current.style.background =
        `radial-gradient(circle at ${nx * 100}% ${ny * 100}%, rgba(255,255,255,0.09) 0%, transparent 62%)`;
    }
  };

  const onLeave = () => {
    px.set(0.5); py.set(0.5);
    glowOp.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ ...style, rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000, position: 'relative' }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
      {/* Cursor spotlight */}
      <motion.div
        ref={spotRef}
        style={{
          position: 'absolute', inset: 0,
          borderRadius: 'inherit',
          pointerEvents: 'none',
          opacity: glowOp,
          transition: 'opacity 0.3s',
        }}
      />
    </motion.div>
  );
};

export default TiltCard;
