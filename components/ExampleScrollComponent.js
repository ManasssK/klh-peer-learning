// components/ExampleScrollComponent.js
'use client';

import { useScrollReveal, useFadeInDirection } from '@/hooks/useScrollReveal';

export default function ExampleScrollComponent() {
  // Basic reveal
  const { elementRef: ref1, isVisible: visible1 } = useScrollReveal({
    threshold: 0.2,
    delay: 100,
  });

  // Fade in from left
  const { elementRef: ref2, style: style2 } = useFadeInDirection('left', {
    threshold: 0.3,
  });

  // Fade in from right
  const { elementRef: ref3, style: style3 } = useFadeInDirection('right', {
    threshold: 0.3,
  });

  return (
    <div className="space-y-8 p-8">
      {/* Basic reveal */}
      <div
        ref={ref1}
        className={`
          scroll-reveal p-6 bg-white rounded-lg shadow-lg
          ${visible1 ? 'revealed' : ''}
        `}
      >
        <h2 className="text-2xl font-bold">Basic Scroll Reveal</h2>
        <p>This appears when scrolled into view</p>
      </div>

      {/* Slide from left */}
      <div
        ref={ref2}
        style={style2}
        className="p-6 bg-blue-100 rounded-lg"
      >
        <h2 className="text-2xl font-bold">Slide from Left</h2>
        <p>Smooth entrance from the left side</p>
      </div>

      {/* Slide from right */}
      <div
        ref={ref3}
        style={style3}
        className="p-6 bg-purple-100 rounded-lg"
      >
        <h2 className="text-2xl font-bold">Slide from Right</h2>
        <p>Smooth entrance from the right side</p>
      </div>
    </div>
  );
}
