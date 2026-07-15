/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080614", // Deep dark purple-black
        surface: "#0f0a21",     // Deep violet card surface
        "surface-container": "#171033",
        "surface-container-low": "#0b0719",
        "surface-container-lowest": "#05030c",
        "surface-container-high": "#22174a",
        "surface-container-highest": "#2d1f61",
        "primary-container": "#8b5cf6", // Purple/violet primary
        "on-surface-variant": "#a78bfa", // Purple/slate for labels
        "outline-variant": "#22184a",     // Dark purple border
        "primary-fixed-dim": "#a78bfa",   // Secondary violet
        primary: "#EEF2F6",
        secondary: "#c084fc", // Lavender/Pink
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
