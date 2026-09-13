/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Single accent ramp. Used sparingly: active states, links, focus.
        brand: {
          50:  '#F0F1FE',
          100: '#E3E5FD',
          200: '#C9CDFB',
          300: '#A5ABF6',
          400: '#8189F0',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#2E2A80',
        },
      },
      boxShadow: {
        // Only two. Flat UI needs almost nothing.
        xs: '0 1px 2px 0 rgb(24 24 27 / 0.04)',
        overlay: '0 12px 32px -8px rgb(24 24 27 / 0.12), 0 2px 8px -2px rgb(24 24 27 / 0.06)',
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out both',
        'pop-in': 'pop-in 0.15s ease-out both',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.98)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
    },
  },
  plugins: [],
}
