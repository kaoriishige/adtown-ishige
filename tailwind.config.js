// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  // ▼▼ この plugins の部分に追記します ▼▼
  plugins: [
    require('@tailwindcss/typography'),
  ],
  plugins: [
  require('@tailwindcss/aspect-ratio'),
],
};



