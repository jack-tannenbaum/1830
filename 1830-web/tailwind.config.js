/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Explicit color classes we know we use
    'bg-purple-500', 'hover:bg-purple-600',
    'bg-orange-500', 'hover:bg-orange-600',
    'bg-indigo-500', 'hover:bg-indigo-600',
    'bg-blue-500', 'hover:bg-blue-600',
    'bg-green-500', 'hover:bg-green-600', 'bg-green-600', 'hover:bg-green-700',
    'bg-red-500', 'hover:bg-red-600',
    'bg-gray-500', 'hover:bg-gray-600',
    'bg-gray-300',
    'text-white', 'text-black', 'text-gray-500', 'text-gray-600', 'text-gray-700', 'text-gray-800',
    'border-gray-200', 'border-gray-300',
    'hover:border-green-500', 'hover:text-green-600',
    'focus:ring-green-500', 'focus:border-green-500',
    // Safelist patterns for any additional colors
    {
      pattern: /bg-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)/
    },
    {
      pattern: /hover:bg-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)/
    }
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
        },
      },
      gridTemplateColumns: {
        'hex': 'repeat(auto-fit, minmax(60px, 1fr))',
        'stock': 'repeat(11, minmax(40px, 1fr))',
      }
    },
  },
  plugins: [],
}
