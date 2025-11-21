import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
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
  plugins: [],
};
export default config;
