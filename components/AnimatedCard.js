// components/AnimatedCard.js
'use client';

import { useEffect, useRef, useState } from 'react';

export default function AnimatedCard({ 
  children, 
  className = '',
  hoverEffect = 'lift',
  delay = 0 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  const hoverEffects = {
    lift: 'card-hover',
    glow: 'glow-hover',
    bounce: 'bounce-hover',
    float: 'animate-float',
  };

  return (
    <div
      ref={cardRef}
      className={`
        scroll-reveal
        ${isVisible ? 'revealed' : ''}
        ${hoverEffects[hoverEffect]}
        bg-white dark:bg-gray-800
        rounded-2xl shadow-lg
        border border-gray-200 dark:border-gray-700
        overflow-hidden
        ${className}
      `}
    >
      {children}
    </div>
  );
}
