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
            lineHeight: '1.75',
            // Paragraphs
            p: {
              marginTop: '1.25em',
              marginBottom: '1.25em',
            },
            // Links
            a: {
              color: '#1AFFF3',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              '&:hover': {
                color: '#00E5E0',
              },
            },
            strong: {
              color: '#ffffff',
              fontWeight: '600',
            },
            // Headings with proper spacing
            h1: {
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '2.25em',
              marginTop: '0',
              marginBottom: '0.8em',
              lineHeight: '1.1',
            },
            h2: {
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '1.5em',
              marginTop: '2em',
              marginBottom: '1em',
              lineHeight: '1.3',
              paddingBottom: '0.3em',
              borderBottom: '1px solid rgba(0, 229, 224, 0.2)',
            },
            h3: {
              color: '#ffffff',
              fontWeight: '600',
              fontSize: '1.25em',
              marginTop: '1.6em',
              marginBottom: '0.6em',
              lineHeight: '1.4',
            },
            h4: {
              color: '#ffffff',
              fontWeight: '600',
              marginTop: '1.5em',
              marginBottom: '0.5em',
            },
            // Code
            code: {
              color: '#1AFFF3',
              backgroundColor: 'rgba(0, 229, 224, 0.1)',
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              fontWeight: '400',
              fontSize: '0.875em',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            // Code blocks
            pre: {
              backgroundColor: '#1A1B23',
              border: '1px solid rgba(0, 229, 224, 0.2)',
              borderRadius: '0.5rem',
              padding: '1em 1.5em',
              marginTop: '1.5em',
              marginBottom: '1.5em',
              overflowX: 'auto',
              code: {
                backgroundColor: 'transparent',
                padding: '0',
                color: '#d1d5db',
                fontSize: '0.875em',
              },
            },
            // Tables
            table: {
              width: '100%',
              marginTop: '2em',
              marginBottom: '2em',
              fontSize: '0.875em',
            },
            thead: {
              borderBottomWidth: '2px',
              borderBottomColor: 'rgba(0, 229, 224, 0.3)',
            },
            'thead th': {
              color: '#ffffff',
              fontWeight: '600',
              padding: '0.75em 1em',
              textAlign: 'left',
            },
            'tbody tr': {
              borderBottomWidth: '1px',
              borderBottomColor: 'rgba(156, 163, 175, 0.2)',
            },
            'tbody td': {
              color: '#9ca3af',
              padding: '0.75em 1em',
            },
            // Blockquotes
            blockquote: {
              borderLeftWidth: '4px',
              borderLeftColor: '#1AFFF3',
              paddingLeft: '1em',
              fontStyle: 'italic',
              color: '#9ca3af',
              marginTop: '1.5em',
              marginBottom: '1.5em',
            },
            // Horizontal rule
            hr: {
              borderColor: 'rgba(156, 163, 175, 0.3)',
              marginTop: '3em',
              marginBottom: '3em',
            },
            // Lists
            ul: {
              marginTop: '1.25em',
              marginBottom: '1.25em',
              paddingLeft: '1.5em',
            },
            ol: {
              marginTop: '1.25em',
              marginBottom: '1.25em',
              paddingLeft: '1.5em',
            },
            li: {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            'ul > li': {
              paddingLeft: '0.375em',
              '&::marker': {
                color: '#1AFFF3',
              },
            },
            'ol > li': {
              paddingLeft: '0.375em',
              '&::marker': {
                color: '#1AFFF3',
                fontWeight: '500',
              },
            },
            // Nested lists
            'ul ul, ul ol, ol ul, ol ol': {
              marginTop: '0.75em',
              marginBottom: '0.75em',
            },
            // Images
            img: {
              marginTop: '2em',
              marginBottom: '2em',
              borderRadius: '0.5rem',
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
