/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Sage green theme
        forest: { 950: '#0d1a0f', 900: '#132016', 800: '#1c2e1f', 700: '#284d2c' },
        sage:   { 300: '#c8e6c9', 400: '#b5d6b7', 500: '#8fbb91', 600: '#6faa72', 700: '#4e8f51' },
        stone:  { 400: '#c9b99a', 500: '#b0a080' },
      },
      fontFamily: {
        display: ['Orbitron', 'monospace'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
