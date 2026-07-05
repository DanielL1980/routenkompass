/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        anthrazit: '#1f2937',
        stahlblau: '#1e40af',
      },
    },
  },
  plugins: [],
};
