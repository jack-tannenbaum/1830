import type { HexCoordinate } from '../types/mapGraph';

// === Hexagonal Coordinate Utilities ===

// Convert cube coordinates to string for use as keys
export function hexToString(hex: HexCoordinate): string {
  return `${hex.q},${hex.r},${hex.s}`;
}

// Convert string back to cube coordinates
export function stringToHex(str: string): HexCoordinate {
  const [q, r, s] = str.split(',').map(Number);
  return { q, r, s };
}

// Validate that cube coordinates sum to 0
export function isValidHex(hex: HexCoordinate): boolean {
  return Math.round(hex.q + hex.r + hex.s) === 0;
}

// Get the six neighboring hexes
export function getNeighbors(hex: HexCoordinate): HexCoordinate[] {
  const directions = [
    { q: 1, r: -1, s: 0 },   // right
    { q: 1, r: 0, s: -1 },   // down-right
    { q: 0, r: 1, s: -1 },   // down-left
    { q: -1, r: 1, s: 0 },   // left
    { q: -1, r: 0, s: 1 },   // up-left
    { q: 0, r: -1, s: 1 }    // up-right
  ];
  
  return directions.map(dir => ({
    q: hex.q + dir.q,
    r: hex.r + dir.r,
    s: hex.s + dir.s
  }));
}

// Calculate distance between two hexes
export function hexDistance(a: HexCoordinate, b: HexCoordinate): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2;
}

// Convert offset coordinates (like the old x,y system) to cube coordinates
export function offsetToCube(x: number, y: number): HexCoordinate {
  const q = x;
  const r = y - (x - (x & 1)) / 2;
  const s = -q - r;
  return { q, r, s };
}

// Convert cube coordinates to offset coordinates (for display purposes)
export function cubeToOffset(hex: HexCoordinate): { x: number, y: number } {
  const x = hex.q;
  const y = hex.r + (hex.q - (hex.q & 1)) / 2;
  return { x, y };
}

// Convert axial coordinates (q,r) to cube coordinates
export function axialToCube(q: number, r: number): HexCoordinate {
  return { q, r, s: -q - r };
}

// Convert cube coordinates to axial coordinates
export function cubeToAxial(hex: HexCoordinate): { q: number, r: number } {
  return { q: hex.q, r: hex.r };
}

// Round cube coordinates to nearest valid hex
export function roundHex(hex: HexCoordinate): HexCoordinate {
  let q = Math.round(hex.q);
  let r = Math.round(hex.r);
  let s = Math.round(hex.s);
  
  const qDiff = Math.abs(q - hex.q);
  const rDiff = Math.abs(r - hex.r);
  const sDiff = Math.abs(s - hex.s);
  
  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  } else {
    s = -q - r;
  }
  
  return { q, r, s };
}

// Linear interpolation between two hexes
export function hexLerp(a: HexCoordinate, b: HexCoordinate, t: number): HexCoordinate {
  return {
    q: a.q + (b.q - a.q) * t,
    r: a.r + (b.r - a.r) * t,
    s: a.s + (b.s - a.s) * t
  };
}

// Get all hexes in a line between two points
export function hexLine(a: HexCoordinate, b: HexCoordinate): HexCoordinate[] {
  const distance = hexDistance(a, b);
  const hexes: HexCoordinate[] = [];
  
  for (let i = 0; i <= distance; i++) {
    hexes.push(roundHex(hexLerp(a, b, i / distance)));
  }
  
  return hexes;
}

// Get all hexes within a certain radius
export function hexesInRadius(center: HexCoordinate, radius: number): HexCoordinate[] {
  const hexes: HexCoordinate[] = [];
  
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    
    for (let r = r1; r <= r2; r++) {
      const s = -q - r;
      hexes.push({ q, r, s });
    }
  }
  
  return hexes;
}
