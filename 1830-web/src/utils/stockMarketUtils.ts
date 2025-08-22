import { Point } from '../types/game';

/**
 * Find the position of a share price on the stock market grid
 * Maps share prices to their row in the red column (column 6)
 */
export const findSharePricePosition = (sharePrice: number): Point | null => {
  // Map share prices to their row in the red column (column 6)
  // Looking at STOCK_MARKET_GRID column 6: ["100", "90", "100", "82", "100", "67", "67", "67", null, null, null]
  const sharePriceToRow: Record<number, number> = {
    100: 0, // Row 0, Column 6
    90: 1,  // Row 1, Column 6  
    82: 2,
    76: 3,
    71: 4,  // Row 4, Column 6
    67: 5   // Row 5, Column 6
  };
  
  const row = sharePriceToRow[sharePrice];
  if (row !== undefined) {
    return { x: 6, y: row }; // Column 6 is the red column
  }
  
  return null;
};
