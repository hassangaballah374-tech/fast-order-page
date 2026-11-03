/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        avocado: {
          DEFAULT: '#6B8E23',
          light: '#E2EEDB',
          cream: '#FDF6EC',
        },
      },
    },
  },
  plugins: [],
}
