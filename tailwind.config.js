/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          50: '#EEF2FF',
          600: '#4F46E5',
          700: '#4338CA',
        },
        gray: {
          50: '#F9FAFB',
          200: '#E5E7EB',
          400: '#9CA3AF',
          500: '#6B7280',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
