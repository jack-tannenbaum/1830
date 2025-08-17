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
        // Deep jewel tone colors
        'jewel': {
          'black': '#1A1A1A',
          'white': '#F0F0F0',
          'teal': '#004D61',
          'ruby': '#822659',
          'forest': '#3E5641',
          'gray': '#2A2A2A',
          'border': '#3A3A3A',
          'text': '#B0B0B0',
          'text-dark': '#808080',
        }
      },
      gridTemplateColumns: {
        'hex': 'repeat(auto-fit, minmax(60px, 1fr))',
        'stock': 'repeat(11, minmax(40px, 1fr))',
      }
    },
  },
  plugins: [],
}
