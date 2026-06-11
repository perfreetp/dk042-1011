/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        ocean: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#1e3a5f',
          800: '#0f2744',
          900: '#0a1929',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        sea: {
          400: '#10b981',
          500: '#059669',
        },
        coral: {
          400: '#fb7185',
          500: '#f43f5e',
        },
        lavender: {
          400: '#a78bfa',
          500: '#8b5cf6',
        },
        amber: {
          400: '#f59e0b',
          500: '#d97706',
        },
        parchment: '#fdf6e3',
        wood: '#8B4513',
      },
      fontFamily: {
        display: ['"ZCOOL KuaiLe"', 'cursive'],
        body: ['"Ma Shan Zheng"', 'serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'bounce-slow': 'bounce 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'damage': 'damage 0.4s ease-out',
        'sail': 'sail 4s ease-in-out infinite',
        'wave': 'wave 2s ease-in-out infinite',
        'float-up': 'float-up 1s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'breath': 'breath 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(251, 191, 36, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(251, 191, 36, 0.8)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        damage: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.2)', color: '#f43f5e' },
          '100%': { transform: 'translateY(-50px)', opacity: '0' },
        },
        sail: {
          '0%, 100%': { transform: 'translateX(0) rotate(0deg)' },
          '50%': { transform: 'translateX(10px) rotate(2deg)' },
        },
        wave: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-5px) rotate(3deg)' },
        },
        'float-up': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-60px)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        breath: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
      backgroundImage: {
        'parchment': "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\"%3E%3Crect fill=\"%23fdf6e3\" width=\"100\" height=\"100\"/%3E%3Cfilter id=\"n\"%3E%3CfeTurbulence baseFrequency=\"0.7\" numOctaves=\"3\"/ %3E%3CfeColorMatrix values=\"0 0 0 0 0.75 0 0 0 0 0.7 0 0 0 0 0.55 0 0 0 0.15 0\"/%3E%3C/filter%3E%3Crect width=\"100\" height=\"100\" filter=\"url(%23n)\" opacity=\"0.25\"/%3E%3C/svg%3E')",
        'wood': "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\"%3E%3Cdefs%3E%3Cpattern id=\"wood\" width=\"20\" height=\"20\" patternUnits=\"userSpaceOnUse\" patternTransform=\"rotate(45)\"%3E%3Crect fill=\"%238B4513\" width=\"100%25\" height=\"100%25\"/%3E%3Cline stroke=\"%23654321\" stroke-width=\"0.5\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"100%25\"/%3E%3Cline stroke=\"%23A0522D\" stroke-width=\"0.5\" x1=\"10\" y1=\"0\" x2=\"10\" y2=\"100%25\"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\"100%25\" height=\"100%25\" fill=\"url(%23wood)\"/%3E%3C/svg%3E')",
        'ocean-gradient': 'linear-gradient(180deg, #0ea5e9 0%, #1e3a5f 50%, #0f2744 100%)',
      },
    },
  },
  plugins: [],
};
