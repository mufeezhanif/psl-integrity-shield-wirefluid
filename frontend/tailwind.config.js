/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        psl: {
          green: '#00e676',
          gold: '#ffd60a',
          red: '#ff3860',
          dark: '#000000',
          card: '#0d0d0d',
          surface: '#111111',
          border: 'rgba(255,255,255,0.07)',
        },
      },
      keyframes: {
        'live-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(255,56,96,0.7)' },
          '100%': { boxShadow: '0 0 0 10px rgba(255,56,96,0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'live-ring': 'live-ring 1.4s ease-out infinite',
        float: 'float 3s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'fade-up': 'fade-up 0.4s ease both',
      },
    },
  },
  plugins: [],
};
