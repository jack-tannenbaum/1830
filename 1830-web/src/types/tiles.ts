// Tile system types and definitions

export interface TileConnection {
  from: string; // A, B, C, D, E, F
  to: string;   // A, B, C, D, E, F
}

export interface TileRequirement {
  type: 'empty' | '1 town' | '2 town' | '2 towns' | 'city';
}

export interface TileDefinition {
  id: string;
  color: 'yellow' | 'green' | 'brown' | 'gray';
  requires: TileRequirement;
  connects: TileConnection[];
  quantity: number;
}

// Yellow tiles from 1830
export const YELLOW_TILES: TileDefinition[] = [
  {
    id: '1',
    color: 'yellow',
    requires: { type: '2 town' },
    connects: [
      { from: 'A', to: 'C' },
      { from: 'D', to: 'F' }
    ],
    quantity: 1
  },
  {
    id: '2',
    color: 'yellow',
    requires: { type: '2 town' },
    connects: [
      { from: 'A', to: 'D' },
      { from: 'B', to: 'C' }
    ],
    quantity: 1
  },
  {
    id: '3',
    color: 'yellow',
    requires: { type: '1 town' },
    connects: [
      { from: 'D', to: 'E' }
    ],
    quantity: 2
  },
  {
    id: '4',
    color: 'yellow',
    requires: { type: '1 town' },
    connects: [
      { from: 'A', to: 'D' }
    ],
    quantity: 2
  },
  {
    id: '7',
    color: 'yellow',
    requires: { type: 'empty' },
    connects: [
      { from: 'D', to: 'E' }
    ],
    quantity: 4
  },
  {
    id: '8',
    color: 'yellow',
    requires: { type: 'empty' },
    connects: [
      { from: 'D', to: 'F' }
    ],
    quantity: 8
  },
  {
    id: '9',
    color: 'yellow',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'D' }
    ],
    quantity: 7
  },
  {
    id: '55',
    color: 'yellow',
    requires: { type: '2 towns' },
    connects: [
      { from: 'A', to: 'D' },
      { from: 'C', to: 'F' }
    ],
    quantity: 1
  },
  {
    id: '56',
    color: 'yellow',
    requires: { type: '2 towns' },
    connects: [
      { from: 'A', to: 'C' },
      { from: 'B', to: 'D' }
    ],
    quantity: 1
  },
  {
    id: '57',
    color: 'yellow',
    requires: { type: 'city' },
    connects: [
      { from: 'A', to: 'D' }
    ],
    quantity: 4
  },
  {
    id: '58',
    color: 'yellow',
    requires: { type: '1 town' },
    connects: [
      { from: 'D', to: 'F' }
    ],
    quantity: 2
  },
  {
    id: '69',
    color: 'yellow',
    requires: { type: '2 towns' },
    connects: [
      { from: 'A', to: 'D' },
      { from: 'B', to: 'F' }
    ],
    quantity: 1
  }
];

// Helper function to check if a tile can be placed on a hex
export function canPlaceTile(tile: TileDefinition, hexFeature: 'city' | 'town' | 'two-towns' | undefined): boolean {
  switch (tile.requires.type) {
    case 'empty':
      return hexFeature === undefined;
    case '1 town':
      return hexFeature === 'town';
    case '2 town':
    case '2 towns':
      return hexFeature === 'two-towns';
    case 'city':
      return hexFeature === 'city';
    default:
      return false;
  }
}
