import { STOCK_MARKET_COLOR_GRID } from '../types/constants';

export interface StockMarket {
  tokenPositions: Map<string, { x: number; y: number }>;
}

export interface Colors {
  text: {
    primary: string;
    tertiary: string;
  };
}

/**
 * Get market price text color based on stock market square color
 * @param corporationId - The ID of the corporation
 * @param stockMarket - The stock market state with token positions
 * @param colors - The theme colors object
 * @returns CSS class string for the appropriate color
 */
export const getMarketPriceColor = (
  corporationId: string, 
  stockMarket: StockMarket, 
  colors: Colors
): string => {
  const position = stockMarket.tokenPositions.get(corporationId);
  if (!position) return colors.text.tertiary; // Default color if no position

  const { x, y } = position;
  
  // Check bounds
  if (y < 0 || y >= STOCK_MARKET_COLOR_GRID.length || 
      x < 0 || x >= STOCK_MARKET_COLOR_GRID[y].length || 
      !STOCK_MARKET_COLOR_GRID[y][x]) {
    return colors.text.tertiary; // Default color for invalid positions
  }

  const squareColor = STOCK_MARKET_COLOR_GRID[y][x];

  // Return appropriate text color based on square color
  // Use CSS variables that match the stock market colors
  switch (squareColor) {
    case 'red':
      return colors.text.primary; // Use primary color (same as par value) instead of red for red squares
    case 'white':
      return 'text-[var(--stock-gray)]'; // Gray text for white/gray squares
    case 'yellow':
      return 'text-[var(--stock-yellow)]'; // Yellow text for yellow squares
    case 'orange':
      return 'text-[var(--stock-orange)]'; // Orange text for orange squares
    case 'brown':
      return 'text-[var(--stock-brown)]'; // Brown text for brown squares
    default:
      return colors.text.primary; // Default fallback - use primary color (same as par value)
  }
};
