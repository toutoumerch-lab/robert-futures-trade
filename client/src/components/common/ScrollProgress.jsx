import { motion, useScroll, useSpring } from 'framer-motion';

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: '3px',
        scaleX,
        transformOrigin: '0%',
        background: 'linear-gradient(90deg, #6366f1, #818cf8, #10b981)',
        zIndex: 9995,
        pointerEvents: 'none',
        boxShadow: '0 0 12px rgba(99,102,241,0.6)',
      }}
    />
  );
};

export default ScrollProgress;
