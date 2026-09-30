/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f6ff',
          100: '#e9edff',
          200: '#d3dbff',
          300: '#aebcff',
          400: '#7f93ff',
          500: '#4d62ff',
          600: '#2b3eff',
          700: '#1d2bff',
          800: '#151ecc',
          900: '#1217a1',
          950: '#0a0d63',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
