import React from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

/**
 * Reveal — wraps any children in a scroll-triggered fade-up / fade-in.
 *
 * Props:
 *  delay     — ms offset before animation fires (0–600)
 *  direction — 'up' | 'down' | 'left' | 'right' | 'none'
 *  distance  — px to travel (default 28)
 *  duration  — animation duration in ms (default 550)
 *  className — forwarded class
 *  style     — forwarded style
 */
const directionMap = {
  up:    'translateY(28px)',
  down:  'translateY(-28px)',
  left:  'translateX(32px)',
  right: 'translateX(-32px)',
  none:  'none',
};

const Reveal = ({
  children,
  delay = 0,
  direction = 'up',
  distance,
  duration = 380,
  className = '',
  style = {},
  as: Tag = 'div',
  ...rest
}) => {
  const { ref, isVisible } = useScrollReveal({ delay });

  const initial = distance
    ? (direction.includes('Y') || direction === 'up' || direction === 'down')
      ? `translateY(${direction === 'up' ? distance : -distance}px)`
      : `translateX(${direction === 'right' ? -distance : distance}px)`
    : directionMap[direction] ?? 'translateY(18px)';

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'none' : initial,
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: 'opacity, transform',
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
