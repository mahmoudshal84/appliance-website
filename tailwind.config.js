/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'nav': '1160px', // Custom breakpoint for navigation
      },
    },
  },
  plugins: [],
}
