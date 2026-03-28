/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // We'll manage this with the .light-mode logic
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#3b82f6',
          purple: '#a855f7',
          pink: '#ec4899',
          teal: '#10b981',
          orange: '#f97316',
        }
      },
      backgroundImage: {
        'brand-gradient': "linear-gradient(135deg, #3b82f6 0%, #a855f7 50%, #ec4899 100%)",
        'brand-mesh': "radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.15) 0, transparent 50%), radial-gradient(at 50% 0%, rgba(168, 85, 247, 0.15) 0, transparent 50%), radial-gradient(at 100% 0%, rgba(236, 72, 153, 0.15) 0, transparent 50%)",
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite alternate',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { 'background-size': '200% 200%', 'background-position': 'left center' },
          '50%': { 'background-size': '200% 200%', 'background-position': 'right center' },
        }
      }
    },
  },
  plugins: [],
}
