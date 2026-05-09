/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: '#0f172a',
        accent: '#6366f1',
        success: '#10b981',
        danger: '#f43f5e',
      },
    },
  },
  plugins: [],
}

