import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: 'rgb(var(--ink) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        teal: {
          DEFAULT: 'rgb(var(--coral) / <alpha-value>)',
          50: '#FFF1EF',
          100: '#FFE2DE',
          200: '#FFC6BF',
          300: '#FFA197',
          400: '#FA7568',
          500: 'rgb(var(--coral) / <alpha-value>)',
          600: '#D8473B',
          700: '#B63A30',
          800: '#8E2D27',
          900: '#6C2420',
        },
        coral: 'rgb(var(--coral) / <alpha-value>)',
        stone: 'rgb(var(--stone) / <alpha-value>)',
        warm: 'rgb(var(--paper) / <alpha-value>)',
        slatebody: 'rgb(var(--text-secondary) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        error: 'rgb(var(--error) / <alpha-value>)',
        info: 'rgb(var(--ink) / <alpha-value>)',
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.625rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        soft: '0 16px 40px rgba(0, 0, 0, 0.08)',
        card: '0 4px 16px rgba(0, 0, 0, 0.04)',
      },
      fontFamily: {
        sans: ['Inter Variable', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
