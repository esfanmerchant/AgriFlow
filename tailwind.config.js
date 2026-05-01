/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50:  '#f0f7f1',
          100: '#dceee0',
          200: '#bbdcc3',
          300: '#8fc39d',
          400: '#52b788',
          500: '#2d6a4f',
          600: '#225a3f',
          700: '#1b4332',
          800: '#0f2a1f',
          900: '#081a13',
        },
        mint: {
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
        },
        gold: {
          100: '#faedcd',
          200: '#f4d9a3',
          300: '#e9c184',
          400: '#d4a373',
          500: '#b07d4d',
        },
        cream: '#f6f3ee',
        ink: '#06120c',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '10xl': ['10rem',  { lineHeight: '0.95' }],
        '12xl': ['14rem',  { lineHeight: '0.9'  }],
      },
      animation: {
        float:         'float 6s ease-in-out infinite',
        'float-slow':  'float 10s ease-in-out infinite',
        shimmer:       'shimmer 3s linear infinite',
        'gradient-shift': 'gradientShift 14s ease infinite',
        'spin-slow':   'spin 20s linear infinite',
        'pulse-glow':  'pulseGlow 2.6s ease-in-out infinite',
        marquee:       'marquee 35s linear infinite',
        'marquee-rev': 'marqueeRev 35s linear infinite',
        blob:          'blob 18s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-14px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradientShift: {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%':     { backgroundPosition: '100% 50%' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(45,212,191,0.4), 0 0 30px rgba(45,212,191,0.25)' },
          '50%':     { boxShadow: '0 0 0 10px rgba(45,212,191,0), 0 0 60px rgba(45,212,191,0.45)' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        marqueeRev: {
          '0%':   { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        blob: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%':     { transform: 'translate(30px,-40px) scale(1.1)' },
          '66%':     { transform: 'translate(-20px,30px) scale(0.95)' },
        },
      },
      boxShadow: {
        'glow-mint':  '0 0 60px rgba(45,212,191,0.45)',
        'glow-gold':  '0 0 60px rgba(212,163,115,0.45)',
        'glow-soft':  '0 0 80px rgba(45,212,191,0.18), 0 0 30px rgba(82,183,136,0.18)',
        inner:        'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
    },
  },
  plugins: [],
};
