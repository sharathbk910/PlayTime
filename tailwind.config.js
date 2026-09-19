/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: '#fff8e1',
          100: '#ffecb3',
          200: '#ffe082',
          300: '#ffd54f',
          400: '#ffca28',
          500: '#ff9933',
          600: '#ff7722',
          700: '#e65100',
          800: '#bf360c',
          900: '#872300',
        },
        marigold: {
          light: '#FFE082',
          DEFAULT: '#FFB300',
          dark: '#FF8F00',
          glow: '#FFA000',
        },
        crimson: {
          light: '#EF5350',
          DEFAULT: '#D32F2F',
          dark: '#B71C1C',
          sacred: '#880E4F',
        },
        gold: {
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          divine: '#FFD700',
          temple: '#D4AF37',
        },
        cosmic: {
          950: '#06040B',
          900: '#0C0817',
          800: '#140D26',
          700: '#1F143D',
          600: '#2D1B59',
          500: '#43197E',
          400: '#62269E',
          300: '#8A3FC8',
          nebula: '#2E1065',
        }
      },
      fontFamily: {
        mythic: ['"Cinzel Decorative"', 'serif'],
        cinzel: ['"Cinzel"', 'serif'],
        sans: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      animation: {
        'diya-flicker': 'diyaFlicker 3s infinite alternate ease-in-out',
        'mandala-spin': 'spin 60s linear infinite',
        'mandala-reverse': 'spinReverse 75s linear infinite',
        'float': 'float 5s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2.5s infinite',
        'shimmer': 'shimmer 2.5s infinite',
      },
      keyframes: {
        diyaFlicker: {
          '0%, 100%': { opacity: '0.85', transform: 'scale(1)', filter: 'drop-shadow(0 0 10px rgba(255, 153, 51, 0.7))' },
          '50%': { opacity: '1', transform: 'scale(1.06)', filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.95))' },
        },
        spinReverse: {
          'from': { transform: 'rotate(360deg)' },
          'to': { transform: 'rotate(0deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(255, 153, 51, 0.4), inset 0 0 10px rgba(255, 215, 0, 0.3)' },
          '50%': { boxShadow: '0 0 35px rgba(255, 153, 51, 0.85), inset 0 0 20px rgba(255, 215, 0, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
