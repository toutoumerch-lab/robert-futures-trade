import { useEffect, useRef, useState } from 'react';

/**
 * useScrollReveal — lightweight IntersectionObserver hook.
 * Usage: const { ref, isVisible } = useScrollReveal({ delay: 100 });
 */
export const useScrollReveal = ({ threshold = 0.12, delay = 0 } = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, delay]);

  return { ref, isVisible };
};

/**
 * useParallax — subtle parallax offset on scroll.
 * Usage: const offset = useParallax(0.15);
 * Apply: style={{ transform: `translateY(${offset}px)` }}
 */
export const useParallax = (speed = 0.1) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handle = () => setOffset(window.scrollY * speed);
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, [speed]);

  return offset;
};
