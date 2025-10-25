// components/ThemeToggle.js
'use client';

import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center h-8 w-16 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      style={{
        backgroundColor: isDark ? '#1f2937' : '#e5e7eb'
      }}
      aria-label="Toggle theme"
    >
      {/* Toggle Circle */}
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
          isDark ? 'translate-x-9' : 'translate-x-1'
        }`}
      >
        {/* Icon inside circle */}
        <span className="flex items-center justify-center h-full w-full text-xs">
          {isDark ? '🌙' : '☀️'}
        </span>
      </span>

      {/* Background Icons */}
      <span
        className={`absolute left-2 text-xs transition-opacity duration-300 ${
          isDark ? 'opacity-0' : 'opacity-100'
        }`}
      >
        ☀️
      </span>
      <span
        className={`absolute right-2 text-xs transition-opacity duration-300 ${
          isDark ? 'opacity-100' : 'opacity-0'
        }`}
      >
        🌙
      </span>
    </button>
  );
}
