// lib/animations.js

/**
 * Animation utility functions for consistent animations across the app
 */

// Easing functions
export const easings = {
  easeInOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeOut: 'cubic-bezier(0.33, 1, 0.68, 1)',
  easeIn: 'cubic-bezier(0.32, 0, 0.67, 0)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
};

// Animation durations (in ms)
export const durations = {
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 800,
};

// Stagger delay calculator
export function getStaggerDelay(index, baseDelay = 50) {
  return index * baseDelay;
}

// Intersection Observer options
export const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px',
};

// Animation variants for different elements
export const variants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  slideUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
  },
  slideDown: {
    initial: { opacity: 0, y: -30 },
    animate: { opacity: 1, y: 0 },
  },
  slideLeft: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
  },
  slideRight: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
  },
  scaleOut: {
    initial: { opacity: 1, scale: 1 },
    animate: { opacity: 0, scale: 0.9 },
  },
};

// Apply animation to element
export function animateElement(element, variant = 'fadeIn', duration = durations.normal) {
  if (!element) return;

  const animation = variants[variant];
  if (!animation) return;

  // Apply initial state
  Object.assign(element.style, {
    opacity: animation.initial.opacity,
    transform: getTransform(animation.initial),
    transition: `all ${duration}ms ${easings.easeInOut}`,
  });

  // Trigger animation on next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      Object.assign(element.style, {
        opacity: animation.animate.opacity,
        transform: getTransform(animation.animate),
      });
    });
  });
}

// Helper to build transform string
function getTransform(state) {
  const transforms = [];
  if (state.x !== undefined) transforms.push(`translateX(${state.x}px)`);
  if (state.y !== undefined) transforms.push(`translateY(${state.y}px)`);
  if (state.scale !== undefined) transforms.push(`scale(${state.scale})`);
  return transforms.join(' ') || 'none';
}

// Animate elements in sequence
export function animateSequence(elements, variant = 'fadeIn', staggerDelay = 100) {
  elements.forEach((element, index) => {
    setTimeout(() => {
      animateElement(element, variant);
    }, index * staggerDelay);
  });
}

// Create ripple effect
export function createRipple(event, element) {
  const ripple = document.createElement('span');
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    top: ${y}px;
    left: ${x}px;
    pointer-events: none;
    transform: scale(0);
    animation: ripple-effect 0.6s ease-out;
  `;

  element.appendChild(ripple);

  setTimeout(() => {
    ripple.remove();
  }, 600);
}

// Smooth scroll to element
export function smoothScrollTo(elementId, offset = 0) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
  
  window.scrollTo({
    top: targetPosition,
    behavior: 'smooth',
  });
}

// Check if element is in viewport
export function isInViewport(element, offset = 0) {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= -offset &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Preload images for smooth transitions
export function preloadImages(urls) {
  return Promise.all(
    urls.map(url => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = reject;
        img.src = url;
      });
    })
  );
}

// Add CSS keyframe animation dynamically
export function addKeyframeAnimation(name, keyframes) {
  const styleSheet = document.styleSheets[0];
  const keyframeString = `@keyframes ${name} { ${keyframes} }`;
  
  try {
    styleSheet.insertRule(keyframeString, styleSheet.cssRules.length);
  } catch (e) {
    console.warn('Failed to add keyframe animation:', e);
  }
}

// Page transition effect
export function pageTransition(callback, duration = durations.normal) {
  document.body.style.opacity = '0';
  document.body.style.transition = `opacity ${duration}ms ${easings.easeOut}`;
  
  setTimeout(() => {
    if (callback) callback();
    document.body.style.opacity = '1';
  }, duration);
}

// Parallax scroll effect
export function parallaxScroll(element, speed = 0.5) {
  if (!element) return;
  
  const handleScroll = () => {
    const scrolled = window.pageYOffset;
    const rate = scrolled * speed;
    element.style.transform = `translateY(${rate}px)`;
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  return () => window.removeEventListener('scroll', handleScroll);
}

// Reveal on scroll with callback
export function revealOnScroll(elements, callback) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          if (callback) callback(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    observerOptions
  );

  elements.forEach(element => {
    if (element) observer.observe(element);
  });

  return observer;
}
