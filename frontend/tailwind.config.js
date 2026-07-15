/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0B17", // Vantage Purple Main Background
        surface: "#17172A",     // Cards / Sidebar / Surface
        "surface-container": "#21213b",
        "surface-container-low": "#131322",
        "surface-container-lowest": "#090912",
        "surface-container-high": "#2c2c4d",
        "surface-container-highest": "#3b3b66",
        "primary-container": "#7C3AED", // Primary Color
        "on-surface-variant": "#a78bfa",
        "outline-variant": "#2d2d4f",     // Dark borders
        "primary-fixed-dim": "#a78bfa",
        primary: "#F5F3FF", // Primary Text Color
        secondary: "#06B6D4", // Accent / Highlight Color
        alert: {
          DEFAULT: '#ef4444',
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
