import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#14213D',
        teal: '#0F9D9A',
        warm: '#F7F8FA',
        slatebody: '#475569',
        success: '#15803D',
        warning: '#B45309',
        error: '#B91C1C',
        ink: '#10213C',
        coral: '#F29E82',
      },
      borderRadius: {
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
      },
      boxShadow: {
        soft: '0 16px 40px rgba(20, 33, 61, 0.08)',
        card: '0 8px 30px rgba(20, 33, 61, 0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
