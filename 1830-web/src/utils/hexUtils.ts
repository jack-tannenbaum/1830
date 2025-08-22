/**
 * Get position for a hex side (A-F) - center of the side, not the corner
 * @param side - The side letter (A, B, C, D, E, F)
 * @param size - The size of the hex
 * @param centerX - The center X coordinate (optional, defaults to size/2)
 * @param centerY - The center Y coordinate (optional, defaults to size/2)
 * @param radius - The radius to use (optional, defaults to size/2)
 */
export const getSidePosition = (
  side: string, 
  size: number, 
  centerX?: number, 
  centerY?: number, 
  radius?: number
) => {
  const sideIndex = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5 }[side] || 0;
  
  const cx = centerX ?? size / 2;
  const cy = centerY ?? size / 2;
  const r = radius ?? size / 2;
  
  // Calculate the midpoint of each hex side
  // Get the two corner points for this side
  const corner1Angle = (sideIndex * Math.PI) / 3 + Math.PI / 6;
  const corner2Angle = ((sideIndex + 1) * Math.PI) / 3 + Math.PI / 6;
  
  const corner1 = {
    x: cx + r * Math.cos(corner1Angle),
    y: cy + r * Math.sin(corner1Angle)
  };
  const corner2 = {
    x: cx + r * Math.cos(corner2Angle),
    y: cy + r * Math.sin(corner2Angle)
  };
  
  // Return the midpoint between the two corners
  return {
    x: (corner1.x + corner2.x) / 2,
    y: (corner1.y + corner2.y) / 2
  };
};
