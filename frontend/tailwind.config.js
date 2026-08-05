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
          50: '#FAF5EF',
          100: '#F5EBE0',
          200: '#E6D5C3',
          300: '#D5BDA7',
          400: '#C4A484',
          500: '#B08968',
          600: '#9C6644',
          700: '#7F4F24',
          800: '#582F0E',
          900: '#3A1E08',
        },
        dark: {
          bg: '#0F172A',
          card: '#1E293B',
          border: '#334155',
          hover: '#334155',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
