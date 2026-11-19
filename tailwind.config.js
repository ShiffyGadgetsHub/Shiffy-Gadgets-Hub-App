/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eaf3ff',
          100: '#d2e6ff',
          200: '#a8cfff',
          300: '#72b0ff',
          400: '#3b8cff',
          500: '#0a6cff',
          600: '#0054e6',
          700: '#0041b4',
          800: '#033485',
          900: '#062a63',
        },
        accent: {
          50: '#fff0fb',
          100: '#ffe0f7',
          200: '#ffc0f0',
          300: '#ff8fe6',
          400: '#ff65ec',
          500: '#ec3fdc',
          600: '#d426bf',
          700: '#a81c97',
          800: '#7d1570',
          900: '#520e4a',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          soft: 'var(--surface-soft)',
          raised: 'var(--surface-raised)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
          faint: 'var(--ink-faint)',
        },
        line: 'var(--line)',
      },
      fontFamily: {
        sans: [
          '"Segoe UI"',
          'system-ui',
          '-apple-system',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(16 24 40 / 0.04), 0 1px 3px 0 rgb(16 24 40 / 0.06)',
        popover: '0 8px 24px -4px rgb(16 24 40 / 0.12), 0 2px 8px -2px rgb(16 24 40 / 0.08)',
      },
      borderRadius: {
        xl2: '1.1rem',
      },
    },
  },
  plugins: [],
};
