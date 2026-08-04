/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Primary: Logo Crimson Rose (#E63956) ───────────────────────
        primary: {
          DEFAULT: '#E63956',
          dark:    '#C0263E',
          light:   '#F47285',
          50:      '#FFF0F3',
          100:     '#FFE1E6',
          200:     '#FFC7D1',
          500:     '#E63956',
          600:     '#C0263E',
          700:     '#9E1A2E',
        },
        // ── Secondary: Logo Deep Teal (#0F766E) ───────────────────────────────
        secondary: {
          DEFAULT: '#0F766E',
          dark:    '#115E59',
          light:   '#14B8A6',
          50:      '#F0FDFA',
          100:     '#CCFBF1',
          200:     '#99F6E4',
          500:     '#0F766E',
          600:     '#115E59',
          700:     '#134E4A',
        },
        accent: '#0F766E',
        // ── Gold / Amber: Logo Sacred Fire & Turban Gold (#D97706) ─────────────
        gold: {
          DEFAULT: '#D97706',
          dark:    '#B45309',
          light:   '#F59E0B',
          50:      '#FFFBEB',
          100:     '#FEF3C7',
        },
        // ── Light Mode Backgrounds ──────────────────────────────
        bg: {
          dark:  '#F8FAFC',      // Very light Slate base background
          card:  '#FFFFFF',      // Solid white card background
          glass: 'rgba(255, 255, 255, 0.92)',
        },
        // ── Dark Slate Text for Light Mode ─────────────────────
        text: {
          primary:   '#0F172A',  // Slate 900
          secondary: '#475569',  // Slate 600
          muted:     '#64748B',  // Slate 500
        },
        success: '#10B981',
        warning: '#F59E0B',
        error:   '#E63956',
        border:  'rgba(15, 23, 42, 0.08)',
      },

      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },

      backgroundImage: {
        'gradient-primary':
          'linear-gradient(135deg, #E63956 0%, #C0263E 100%)',
        'gradient-secondary':
          'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
        'gradient-gold':
          'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
        'gradient-logo':
          'linear-gradient(135deg, #E63956 0%, #0F766E 100%)',
        'gradient-dark':
          'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        'gradient-card':
          'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        'gradient-hero':
          'linear-gradient(160deg, #FFF0F3 0%, #F0FDFA 50%, #F8FAFC 100%)',
        'gradient-mesh':
          'radial-gradient(ellipse at top left, rgba(230,57,86,0.08) 0%, transparent 65%), radial-gradient(ellipse at bottom right, rgba(15,118,110,0.08) 0%, transparent 65%)',
      },

      boxShadow: {
        'glow-primary':   '0 0 24px rgba(230, 57, 86, 0.20)',
        'glow-secondary': '0 0 24px rgba(15, 118, 110, 0.20)',
        'glow-gold':      '0 0 20px rgba(217, 119, 6, 0.20)',
        'card':           '0 4px 20px rgba(0, 0, 0, 0.05)',
        'card-hover':     '0 12px 30px rgba(230, 57, 86, 0.15)',
      },

      animation: {
        'fade-in':       'fadeIn 0.3s ease-in-out',
        'slide-up':      'slideUp 0.4s ease-out',
        'slide-in-right':'slideInRight 0.3s ease-out',
        'scale-in':      'scaleIn 0.2s ease-out',
        'pulse-slow':    'pulse 3s infinite',
        'shimmer':       'shimmer 2s linear infinite',
        'float':         'float 3s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
      },

      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
