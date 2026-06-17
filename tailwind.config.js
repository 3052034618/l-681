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
        primary: {
          DEFAULT: '#0D4F4F',
          50: '#E6F0F0',
          100: '#C2D9D9',
          200: '#99BFBF',
          300: '#6FA6A6',
          400: '#4D8C8C',
          500: '#0D4F4F',
          600: '#0B4343',
          700: '#093737',
          800: '#062828',
          900: '#041818',
        },
        wheat: {
          DEFAULT: '#D4A843',
          50: '#FBF6E8',
          100: '#F5E9C2',
          200: '#EFDA99',
          300: '#E8CB70',
          400: '#DEBA53',
          500: '#D4A843',
          600: '#B88C33',
          700: '#8F6B25',
          800: '#664C18',
          900: '#3D2D0E',
        },
        bg: {
          DEFAULT: '#1A1A2E',
          card: '#16213E',
          light: '#1F2B4A',
          dark: '#0F0F1A',
        },
        border: {
          DEFAULT: '#2A3756',
          light: '#3A4A6E',
        },
        temp: {
          cool: '#3B82F6',
          normal: '#22C55E',
          warm: '#EAB308',
          hot: '#F97316',
          danger: '#EF4444',
        }
      },
      fontFamily: {
        display: ['"Noto Serif SC"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(212, 168, 67, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(212, 168, 67, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
};
