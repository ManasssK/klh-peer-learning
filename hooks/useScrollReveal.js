// hooks/useScrollReveal.js
'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for scroll-triggered animations
 * @param {Object} options - Configuration options
 * @returns {Object} - Ref and state for the animated element
 */
export function useScrollReveal(options = {}) {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = true,
    delay = 0,
  } = options;

  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => {
              setIsVisible(true);
              setHasRevealed(true);
            }, delay);
          } else {
            setIsVisible(true);
            setHasRevealed(true);
          }

          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, rootMargin, triggerOnce, delay]);

  return { elementRef, isVisible, hasRevealed };
}

/**
 * Hook for animating multiple elements in sequence
 */
export function useStaggerReveal(count, options = {}) {
  const { baseDelay = 100, ...restOptions } = options;
  const refs = useRef([]);
  const [visibleItems, setVisibleItems] = useState([]);

  useEffect(() => {
    const observers = refs.current.map((element, index) => {
      if (!element) return null;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setVisibleItems(prev => [...new Set([...prev, index])]);
            }, index * baseDelay);
            observer.unobserve(element);
          }
        },
        { threshold: restOptions.threshold || 0.1 }
      );

      observer.observe(element);
      return observer;
    });

    return () => {
      observers.forEach((observer, index) => {
        if (observer && refs.current[index]) {
          observer.unobserve(refs.current[index]);
        }
      });
    };
  }, [count, baseDelay, restOptions.threshold]);

  const setRef = (index) => (element) => {
    refs.current[index] = element;
  };

  return { setRef, visibleItems };
}

/**
 * Hook for parallax scroll effect
 */
export function useParallax(speed = 0.5) {
  const elementRef = useRef(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        const scrolled = window.pageYOffset;
        const rate = scrolled * speed;
        setOffset(rate);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return { elementRef, offset };
}

/**
 * Hook for fade in on scroll with direction
 */
export function useFadeInDirection(direction = 'up', options = {}) {
  const { elementRef, isVisible } = useScrollReveal(options);

  const getTransform = () => {
    if (isVisible) return 'translate(0, 0)';

    switch (direction) {
      case 'up':
        return 'translate(0, 30px)';
      case 'down':
        return 'translate(0, -30px)';
      case 'left':
        return 'translate(-30px, 0)';
      case 'right':
        return 'translate(30px, 0)';
      default:
        return 'translate(0, 0)';
    }
  };

  const style = {
    opacity: isVisible ? 1 : 0,
    transform: getTransform(),
    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  return { elementRef, style, isVisible };
}

/**
 * Hook for scale in animation on scroll
 */
export function useScaleIn(options = {}) {
  const { elementRef, isVisible } = useScrollReveal(options);

  const style = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'scale(1)' : 'scale(0.9)',
    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  return { elementRef, style, isVisible };
}

/**
 * Hook for counting animation
 */
export function useCountUp(end, duration = 2000, options = {}) {
  const { elementRef, isVisible } = useScrollReveal(options);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    let startTime;
    let animationFrame;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / duration;

      if (progress < 1) {
        setCount(Math.floor(end * progress));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isVisible, end, duration]);

  return { elementRef, count, isVisible };
}
