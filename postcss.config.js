/** @type {import('postcss-load-config').Config} */
export default {
  plugins: {
    "@tailwindcss/postcss": {},   // ✅ New Tailwind PostCSS plugin
    autoprefixer: {},             // ✅ Add this once installed
  },
};
