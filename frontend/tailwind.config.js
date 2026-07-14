/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080B11", // Sleek deep dark charcoal-black
        surface: "#0F131E",     // Subtle card dark surface
        "surface-container": "#151C2C",
        "surface-container-low": "#0C0F17",
        "surface-container-lowest": "#05060A",
        "surface-container-high": "#1E263B",
        "surface-container-highest": "#28334E",
        "primary-container": "#6366F1", // Indigo
        "on-surface-variant": "#94A3B8", // Sleek gray for descriptions
        "outline-variant": "#1E293B",     // Borders
        "primary-fixed-dim": "#818CF8",   // Indigo secondary
        primary: "#EEF2F6",
        secondary: "#38BDF8",
        alert: {
          DEFAULT: '#ea580c',
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#ea580c',
          600: '#c2410c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
