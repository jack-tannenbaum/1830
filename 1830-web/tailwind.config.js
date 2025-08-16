/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'game-green': '#2d5016',
        'game-brown': '#8b4513',
        'game-blue': '#1e40af',
        'game-red': '#dc2626',
        'game-yellow': '#facc15',
        'hex-border': '#4a5568',
      },
      gridTemplateColumns: {
        'hex': 'repeat(auto-fit, minmax(60px, 1fr))',
        'stock': 'repeat(11, minmax(40px, 1fr))',
      }
    },
  },
  plugins: [],
}
