// Light theme using CSS custom properties
export const lightTheme = {
  // Layout colors
  layout: {
    background: 'bg-[var(--bg-primary)]',
    header: {
      background: 'bg-[var(--bg-secondary)]',
      border: 'border-[var(--border-color)]',
      title: 'text-[var(--text-primary)]',
      subtitle: 'text-[var(--text-secondary)]'
    }
  },

  // Card colors
  card: {
    background: 'bg-[var(--bg-card)]',
    backgroundAlt: 'bg-[var(--bg-card)]',
    backgroundHighlight: 'bg-[var(--bg-card)]',
    border: 'border-[var(--border-color)]',
    borderAlt: 'border-[var(--border-color)]',
    shadow: 'shadow'
  },

  // Text colors
  text: {
    primary: 'text-[var(--text-primary)]',
    secondary: 'text-[var(--text-secondary)]',
    tertiary: 'text-[var(--text-tertiary)]',
    accent: 'text-[var(--accent-blue)]',
    success: 'text-[var(--accent-green)]',
    warning: 'text-[var(--accent-yellow)]',
    danger: 'text-[var(--accent-red)]'
  },

  // Button colors
  button: {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-500 hover:bg-gray-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-orange-500 hover:bg-orange-600 text-white',
    disabled: 'bg-gray-300 text-gray-500 cursor-not-allowed'
  },

  // Player status colors
  player: {
    current: 'bg-blue-100 border-blue-300',
    inactive: 'bg-gray-50',
    name: 'text-gray-800',
    cash: 'text-green-600',
    locked: 'text-yellow-600'
  },

  // Private company colors
  private: {
    name: 'text-blue-800',
    cheapest: 'text-green-600',
    reduced: 'text-red-600',
    effect: 'text-gray-600'
  },

  // Auction colors
  auction: {
    currentPlayer: {
      background: 'bg-blue-50',
      border: 'border-blue-200',
      title: 'text-blue-700',
      text: 'text-blue-600'
    },
    companyCard: {
      background: 'bg-white',
      border: 'border-gray-300',
      title: 'text-gray-800',
      text: 'text-gray-600',
      cheapest: {
        background: 'bg-green-50',
        border: 'border-green-500',
        label: 'text-green-600'
      }
    },
    bidInput: {
      background: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-800'
    },
    progress: {
      background: 'bg-gray-50',
      title: 'text-gray-800',
      text: 'text-gray-600'
    }
  },

  // Notification colors
  notification: {
    bid: {
      background: 'bg-blue-50',
      border: 'border-blue-500',
      title: 'text-blue-800',
      text: 'text-blue-600'
    },
    purchase: {
      background: 'bg-green-50',
      border: 'border-green-500',
      title: 'text-green-800',
      text: 'text-green-600'
    },
    warning: {
      background: 'bg-red-50',
      border: 'border-red-500',
      title: 'text-red-800',
      text: 'text-red-600'
    },
    info: {
      background: 'bg-gray-50',
      border: 'border-gray-500',
      title: 'text-gray-800',
      text: 'text-gray-600'
    }
  },

  // Game board colors
  gameBoard: {
    map: {
      background: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700'
    },
    stockMarket: {
      background: 'bg-white'
    },
    toggleButton: {
      stockMarket: 'bg-[#9333ea] hover:bg-[#7c3aed]', // purple
      railwayMap: 'bg-[#16a34a] hover:bg-[#15803d]' // green
    }
  },

  // Auction summary colors
  auctionSummary: {
    title: 'text-green-700',
    playerCard: {
      background: 'bg-green-50',
      border: 'border-green-200',
      title: 'text-green-800'
    },
    companyCard: {
      background: 'bg-white',
      border: 'border-green-300',
      name: 'text-green-700',
      price: 'text-green-600'
    },
    empty: 'text-gray-500'
  },

  // Corporation colors
  corporation: {
    background: 'bg-white',
    border: 'border-gray-300',
    name: 'text-gray-800',
    price: 'text-gray-500'
  }
};

// Dark theme using CSS custom properties
export const darkTheme = {
  // Layout colors
  layout: {
    background: 'bg-[var(--bg-primary)]', // rich black
    header: {
      background: 'bg-[var(--bg-secondary)]', // slightly lighter black
      border: 'border-[var(--border-color)]', // dark gray border
      title: 'text-[var(--text-primary)]', // off-white
      subtitle: 'text-[var(--text-secondary)]' // light gray
    }
  },

  // Card colors
  card: {
    background: 'bg-[var(--bg-card)]', // slightly lighter black
    backgroundAlt: 'bg-[var(--bg-card-alt)]', // darker variant
    backgroundHighlight: 'bg-[var(--bg-card-highlight)]', // green tinted
    border: 'border-[var(--border-color)]', // dark gray
    borderAlt: 'border-[var(--border-color-alt)]', // lighter border
    shadow: 'shadow-lg shadow-black/50'
  },

  // Text colors
  text: {
    primary: 'text-[var(--text-primary)]', // off-white
    secondary: 'text-[var(--text-secondary)]', // light gray
    tertiary: 'text-[var(--text-tertiary)]', // medium gray
    accent: 'text-[var(--accent-blue)]', // bright blue
    success: 'text-[var(--accent-green)]', // bright green
    warning: 'text-[var(--accent-yellow)]', // bright yellow
    danger: 'text-[var(--accent-red)]' // bright red
  },

  // Button colors
  button: {
    primary: 'bg-[#004D61] hover:bg-[#006D81] text-[#F0F0F0]', // dark teal
    secondary: 'bg-[#3A3A3A] hover:bg-[#4A4A4A] text-[#F0F0F0]', // dark gray
    success: 'bg-[#3E5641] hover:bg-[#4E6641] text-[#F0F0F0]', // forest green
    danger: 'bg-[#822659] hover:bg-[#923669] text-[#F0F0F0]', // deep ruby
    warning: 'bg-orange-600 hover:bg-orange-700 text-[#FFFFFF]', // dark orange with pure white text
    disabled: 'bg-[#3A3A3A] text-[#606060] cursor-not-allowed'
  },

  // Player status colors
  player: {
    current: 'bg-[#004D61] border-[#006D81]', // dark teal
    inactive: 'bg-[#2A2A2A]', // card background
    name: 'text-[#F0F0F0]', // off-white
    cash: 'text-[#4ADE80]', // bright green
    locked: 'text-yellow-400' // bright yellow
  },

  // Private company colors
  private: {
    name: 'text-[#B8D4FF]', // very light blue for better readability
    cheapest: 'text-green-400', // bright green
    reduced: 'text-red-400', // bright red
    effect: 'text-[#B0B0B0]' // light gray
  },

  // Auction colors
  auction: {
    currentPlayer: {
      background: 'bg-[#004D61]', // dark teal
      border: 'border-[#006D81]', // lighter teal
      title: 'text-[#E0F0F0]', // very light teal
      text: 'text-[#B0E0E0]' // light teal
    },
    companyCard: {
      background: 'bg-[var(--bg-card-alt)]', // slightly different card background
      border: 'border-[var(--border-color-alt)]', // lighter border
      title: 'text-[#F0F0F0]', // off-white
      text: 'text-[#B0B0B0]', // light gray
      cheapest: {
        background: 'bg-[#3E5641]', // forest green
        border: 'border-[#4E6641]', // lighter green
        label: 'text-[#4ADE80]' // bright green
      }
    },
    bidInput: {
      background: 'bg-[#004D61]', // dark teal
      border: 'border-[#006D81]', // lighter teal
      text: 'text-[#E0F0F0]' // very light teal
    },
    progress: {
      background: 'bg-[#2A2A2A]', // card background
      title: 'text-[#F0F0F0]', // off-white
      text: 'text-[#B0B0B0]' // light gray
    }
  },

  // Notification colors
  notification: {
    bid: {
      background: 'bg-[#004D61]', // dark teal
      border: 'border-[#4A9EFF]', // bright blue
      title: 'text-[#E0F0F0]', // very light teal
      text: 'text-[#B0E0E0]' // light teal
    },
    purchase: {
      background: 'bg-[#3E5641]', // forest green
      border: 'border-[#4ADE80]', // bright green
      title: 'text-[#F0F0F0]', // very light green
      text: 'text-[#B0E0B0]' // light green
    },
    warning: {
      background: 'bg-[#822659]', // deep ruby
      border: 'border-[#F87171]', // bright red
      title: 'text-[#F0E0E0]', // very light red
      text: 'text-[#E0B0B0]' // light red
    },
    info: {
      background: 'bg-[#2A2A2A]', // card background
      border: 'border-[#B0B0B0]', // light gray
      title: 'text-[#F0F0F0]', // off-white
      text: 'text-[#B0B0B0]' // light gray
    }
  },

  // Game board colors
  gameBoard: {
    map: {
      background: 'bg-[#3E5641]', // forest green
      border: 'border-[#4E6641]', // lighter green
      text: 'text-[#4ADE80]' // bright green
    },
    stockMarket: {
      background: 'bg-[#2A2A2A]' // card background
    },
    toggleButton: {
      stockMarket: 'bg-[#9333ea] hover:bg-[#7c3aed]', // purple
      railwayMap: 'bg-[#16a34a] hover:bg-[#15803d]' // green
    }
  },

  // Auction summary colors
  auctionSummary: {
    title: 'text-[#4ADE80]', // bright green
    playerCard: {
      background: 'bg-[#3E5641]', // forest green
      border: 'border-[#4E6641]', // lighter green
      title: 'text-[#E0F0E0]' // very light green
    },
    companyCard: {
      background: 'bg-[#2A2A2A]', // card background
      border: 'border-[#4E6641]', // lighter green
      name: 'text-[#4ADE80]', // bright green
      price: 'text-[#B0E0B0]' // light green
    },
    empty: 'text-[#808080]' // medium gray
  },

  // Corporation colors
  corporation: {
    background: 'bg-[#2A2A2A]', // card background
    border: 'border-[#3A3A3A]', // dark gray
    name: 'text-[#F0F0F0]', // off-white
    price: 'text-[#B0B0B0]' // light gray
  }
};

export type Theme = 'light' | 'dark';
