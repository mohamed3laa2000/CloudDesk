/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable dark mode with class strategy
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary accent color - teal for professional, modern corporate feel
        primary: {
          25: '#F0FDFA',
          50: '#CCFBF1',
          100: '#99F6E4',
          200: '#5EEAD4',
          300: '#2DD4BF',
          400: '#14B8A6',
          500: '#0D9488',
          600: '#0F766E', // Primary accent
          700: '#115E59', // Primary accent hover
          800: '#134E4A',
          900: '#042F2E',
        },
        // Keep indigo for backwards compatibility, map to teal
        indigo: {
          25: '#F0FDFA',
          50: '#CCFBF1',
          100: '#99F6E4',
          200: '#5EEAD4',
          300: '#2DD4BF',
          400: '#14B8A6',
          500: '#0D9488',
          600: '#0F766E', // Map to primary
          700: '#115E59', // Map to primary hover
          800: '#134E4A',
          900: '#042F2E',
        },
        // Neutral grays for backgrounds, surfaces, borders, text
        gray: {
          50: '#F9FAFB',   // Page background
          100: '#F3F4F6',
          200: '#E5E7EB',  // Default border
          300: '#D1D5DB',  // Hover border
          400: '#9CA3AF',  // Muted text, placeholders
          500: '#6B7280',  // Secondary text
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',  // Primary text
        },
        // Semantic colors
        emerald: {
          50: '#ECFDF5',
          200: '#A7F3D0',
          500: '#10B981',  // Success
          600: '#059669',
          700: '#047857',
        },
        amber: {
          50: '#FFFBEB',
          200: '#FDE68A',
          500: '#F59E0B',  // Warning
          600: '#D97706',
          700: '#B45309',
        },
        red: {
          50: '#FEF2F2',
          200: '#FECACA',
          500: '#EF4444',  // Error
          600: '#DC2626',  // Destructive actions
          700: '#B91C1C',
        },
        blue: {
          50: '#EFF6FF',
          200: '#BFDBFE',
          500: '#3B82F6',  // Info
          600: '#2563EB',
          700: '#1D4ED8',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        // Typography scale from design system
        'xs': ['12px', { lineHeight: '1.4', fontWeight: '400' }],      // Badges, tiny labels
        'sm': ['13px', { lineHeight: '1.5', fontWeight: '400' }],      // Small text, metadata
        'base': ['14px', { lineHeight: '1.5', fontWeight: '400' }],    // Body text, inputs
        'lg': ['16px', { lineHeight: '1.4', fontWeight: '600' }],      // H3
        'xl': ['18px', { lineHeight: '1.3', fontWeight: '600' }],      // H2
        '2xl': ['24px', { lineHeight: '1.2', fontWeight: '600' }],     // H1
        '3xl': ['32px', { lineHeight: '1.2', fontWeight: '600' }],     // Large headings
        '4xl': ['36px', { lineHeight: '1.1', fontWeight: '600' }],     // Hero text
        '5xl': ['48px', { lineHeight: '1.1', fontWeight: '600' }],     // Landing hero
      },
      spacing: {
        // 4px base unit spacing scale
        '0.5': '2px',
        '1': '4px',    // xs
        '2': '8px',    // sm
        '3': '12px',   // md
        '4': '16px',   // base
        '5': '20px',
        '6': '24px',   // lg
        '8': '32px',   // xl
        '10': '40px',
        '12': '48px',  // 2xl
        '16': '64px',  // 3xl
        '20': '80px',
        '24': '96px',
      },
      borderRadius: {
        'sm': '6px',   // Small radius - badges, tags
        'md': '8px',   // Medium radius - buttons, inputs, cards
        'lg': '12px',  // Large radius - modals, large cards
        'xl': '16px',  // Extra large - hero cards
        'full': '9999px', // Pills, avatars
      },
      boxShadow: {
        // Shadow levels from design system
        'sm': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',     // Raised
        'md': '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05)',    // Elevated
        'lg': '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',   // Floating
      },
      maxWidth: {
        'content': '1280px',  // Max content width
        'text': '720px',      // Max text width
        'form': '560px',      // Max form width
      },
    },
  },
  plugins: [],
}
