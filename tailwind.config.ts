/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#F47A42',
          orange: {
            50: '#FFF4ED',
            500: '#F47A42',
            600: '#E8621E',
          }
        }
      },
      fontFamily: {
        'new-spirit': ['New Spirit', 'serif'],
        'poppins': ['Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
