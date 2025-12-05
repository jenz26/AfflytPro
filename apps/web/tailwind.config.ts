import type { Config } from "tailwindcss";
import typography from '@tailwindcss/typography';

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#9ca3af',
            a: {
              color: '#1AFFF3',
              '&:hover': {
                color: '#00E5E0',
              },
            },
            strong: {
              color: '#ffffff',
            },
            h1: {
              color: '#ffffff',
            },
            h2: {
              color: '#ffffff',
            },
            h3: {
              color: '#ffffff',
            },
            h4: {
              color: '#ffffff',
            },
            code: {
              color: '#1AFFF3',
              backgroundColor: 'rgba(0, 229, 224, 0.1)',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: '#1A1B23',
              border: '1px solid rgba(0, 229, 224, 0.2)',
              code: {
                backgroundColor: 'transparent',
                padding: '0',
                color: '#9ca3af',
              },
            },
            table: {
              width: '100%',
            },
            thead: {
              borderBottomColor: 'rgba(0, 229, 224, 0.3)',
            },
            'thead th': {
              color: '#ffffff',
              fontWeight: '600',
            },
            'tbody tr': {
              borderBottomColor: 'rgba(156, 163, 175, 0.2)',
            },
            'tbody td': {
              color: '#9ca3af',
            },
            blockquote: {
              borderLeftColor: '#1AFFF3',
              color: '#9ca3af',
            },
            hr: {
              borderColor: 'rgba(156, 163, 175, 0.2)',
            },
            ul: {
              li: {
                '&::marker': {
                  color: '#1AFFF3',
                },
              },
            },
            ol: {
              li: {
                '&::marker': {
                  color: '#1AFFF3',
                },
              },
            },
          },
        },
      },
      colors: {
        // Primary - Electric Cyan (Data Intelligence)
        'afflyt-cyan': {
          50: '#E6FFFE',
          100: '#B3FFFC',
          200: '#80FFF9',
          300: '#4DFFF6',
          400: '#1AFFF3',
          500: '#00E5E0', // Primary
          600: '#00B8B3',
          700: '#008A86',
          800: '#005D5A',
          900: '#002F2D',
        },
        // Accent - Plasma Purple (Premium/Pro Features)
        'afflyt-plasma': {
          400: '#B794F4',
          500: '#9F7AEA', // Accent
          600: '#805AD5',
        },
        // Warning - Profit Green
        'afflyt-profit': {
          400: '#48BB78',
          500: '#38A169',
          600: '#2F855A',
        },
        // Dark Mode Backgrounds
        'afflyt-dark': {
          50: '#1A1B23',  // Card background
          100: '#13141B', // Base background
          200: '#0C0D13', // Deep background
          300: '#23242E', // Hover state
          400: '#2D2E3A', // Active state
        },
        // Glass Effect
        'afflyt-glass': {
          white: 'rgba(255, 255, 255, 0.05)',
          cyan: 'rgba(0, 229, 224, 0.1)',
          border: 'rgba(0, 229, 224, 0.2)',
        }
      },
    },
  },
  plugins: [typography],
};
export default config;
