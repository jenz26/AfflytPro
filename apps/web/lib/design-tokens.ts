/**
 * Afflyt Pro Design System
 * Centralized design tokens for consistency across the application
 */

export const designTokens = {
  // Border Radius
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },

  // Spacing
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '20px',
    lg: '32px',
    xl: '48px',
  },

  // Colors
  colors: {
    cyan: {
      50: '#E6FBFF',
      100: '#B3F5FF',
      200: '#80EFFF',
      300: '#4DE9FF',
      400: '#00E5E0', // Primary cyan
      500: '#00D4FF',
      600: '#00B8E0',
      700: '#009CC2',
    },
    dark: {
      50: '#1C1D26',  // Glass white background
      100: '#14151C', // Main background
      200: '#0F1015',
      300: '#0A0B0F',
    },
    glass: {
      white: 'rgba(255, 255, 255, 0.02)',
      border: 'rgba(0, 229, 224, 0.15)',
      hover: 'rgba(0, 229, 224, 0.05)',
    },
    profit: {
      400: '#10B981',
      500: '#059669',
    },
    loss: {
      400: '#EF4444',
      500: '#DC2626',
    },
    plasma: {
      400: '#D946EF',
      500: '#C026D3',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: 'var(--font-geist-sans)',
      mono: 'var(--font-geist-mono)',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // Effects
  effects: {
    blur: {
      sm: '4px',
      md: '10px',
      lg: '20px',
      xl: '40px',
    },
    shadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      glow: '0 0 20px rgba(0, 229, 224, 0.3)',
      glowStrong: '0 0 40px rgba(0, 229, 224, 0.5)',
    },
  },

  // Transitions
  transitions: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
} as const;

// Tailwind class helpers for consistency
export const cardStyles = {
  base: 'bg-afflyt-glass-white border border-afflyt-glass-border rounded-xl p-5 backdrop-blur-md',
  hover: 'hover:border-afflyt-cyan-500/30 hover:bg-afflyt-glass-hover transition-all duration-300',
  interactive: 'bg-afflyt-glass-white border border-afflyt-glass-border rounded-xl p-5 backdrop-blur-md hover:border-afflyt-cyan-500/30 hover:bg-afflyt-glass-hover transition-all duration-300 cursor-pointer',
} as const;

export const buttonStyles = {
  primary: 'bg-gradient-to-r from-afflyt-cyan-400 to-afflyt-cyan-600 text-afflyt-dark-100 font-semibold rounded-lg px-4 py-2 hover:shadow-glow transition-all duration-300',
  secondary: 'border border-afflyt-cyan-500/40 bg-transparent text-afflyt-cyan-400 font-semibold rounded-lg px-4 py-2 hover:bg-afflyt-cyan-500/10 transition-all duration-300',
  ghost: 'text-afflyt-cyan-400 font-semibold px-4 py-2 hover:bg-afflyt-cyan-500/10 rounded-lg transition-all duration-300',
} as const;

export const emptyStateStyles = {
  container: 'flex flex-col items-center justify-center py-16 px-8 text-center',
  icon: 'w-16 h-16 mb-4 text-gray-500',
  title: 'text-xl font-bold text-white mb-2',
  description: 'text-gray-400 mb-6 max-w-md',
} as const;
