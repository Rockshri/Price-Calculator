/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Exverge brand navy  — sampled from logo text
        navy: {
          50:  '#edf1f9',
          100: '#c8d4ec',
          200: '#a3b7e0',
          300: '#7e9ad3',
          400: '#597dc7',
          500: '#3460ba',
          600: '#2450a0',
          700: '#1d4080',
          800: '#163060',
          900: '#1a3a6e',   // ← exact logo colour
          950: '#0f2248',
        },
        // Exverge brand rust  — sampled from logo arrows
        rust: {
          50:  '#fef3ee',
          100: '#fddcca',
          200: '#fbc4a5',
          300: '#f8a07a',
          400: '#f4784a',
          500: '#d95a20',
          600: '#b84a18',   // ← exact logo colour
          700: '#9a3812',
          800: '#7c2a0e',
          900: '#5e1e09',
          950: '#3a1005',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
