/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    // Explicit breakpoints so nothing is ambiguous
    screens: {
      sm:  '640px',   // large phone / small tablet
      md:  '768px',   // tablet
      lg:  '1024px',  // desktop (sidebar becomes visible)
      xl:  '1280px',  // large desktop
      '2xl': '1536px',
    },
    extend: {
      colors: {
        brand: {
          50:  '#ffeeee',
          100: '#ffe0e0',
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