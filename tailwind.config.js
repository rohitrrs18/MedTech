/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        premium: { black: '#0a0a0a', card: '#141414', border: '#262626' }
      }
    }
  },
  plugins: []
};