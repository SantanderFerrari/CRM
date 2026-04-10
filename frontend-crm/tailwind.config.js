/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          500: '#f16363',
          600: '#e54646',
          700: '#ca3838',
          800: '#a33030',
          900: '#812e2e',
        },
      },
    },
  },
  plugins: [],
};