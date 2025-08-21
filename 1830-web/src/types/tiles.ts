// Tile system types and definitions

export interface TileConnection {
  from: string; // A, B, C, D, E, F
  to: string;   // A, B, C, D, E, F
}

export interface MultiWayConnection {
  sides: string[]; // Array of sides like ['B', 'C', 'F']
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
  upgrades?: string[]; // IDs of tiles this can upgrade to
}

// All tiles from 1830 (yellow and green)
export const ALL_TILES: TileDefinition[] = [
  // Yellow tiles
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
    quantity: 4,
    upgrades: ['18', '26', '27', '28', '29']
  },
  {
    id: '8',
    color: 'yellow',
    requires: { type: 'empty' },
    connects: [
      { from: 'D', to: 'F' }
    ],
    quantity: 8,
    upgrades: ['16', '19', '23', '24', '25', '28', '29']
  },
  {
    id: '9',
    color: 'yellow',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'D' }
    ],
    quantity: 7,
    upgrades: ['18', '19', '20', '23', '24', '26', '27']
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
    quantity: 4,
    upgrades: ['14', '15']
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
  },
  
  // Green tiles
  {
    id: '14',
    color: 'green',
    requires: { type: 'city' },
    connects: [
      { from: 'A', to: 'C' },
      { from: 'C', to: 'D' },
      { from: 'D', to: 'F' }
    ],
    quantity: 3,
    upgrades: ['63']
  },
  {
    id: '15',
    color: 'green',
    requires: { type: 'city' },
    connects: [
      { from: 'A', to: 'B' },
      { from: 'B', to: 'C' },
      { from: 'C', to: 'D' }
    ],
    quantity: 2,
    upgrades: ['63']
  },
  {
    id: '16',
    color: 'green',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'C' },
      { from: 'B', to: 'D' }
    ],
    quantity: 1,
    upgrades: ['43', '70']
  },
  {
    id: '18',
    color: 'green',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'D' },
      { from: 'B', to: 'C' }
    ],
    quantity: 1,
    upgrades: ['43']
  },
  {
    id: '19',
    color: 'green',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'C' },
      { from: 'B', to: 'D' }
    ],
    quantity: 1,
    upgrades: ['45', '46']
  },
  {
    id: '20',
    color: 'green',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'D' },
      { from: 'C', to: 'F' }
    ],
    quantity: 1,
    upgrades: ['44', '47']
  },
  {
    id: '23',
    color: 'green',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'D' },
      { from: 'B', to: 'D' }
    ],
    quantity: 3,
    upgrades: ['41', '43', '45', '47']
  },
  {
    id: '24',
    color: 'green',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'D' },
      { from: 'D', to: 'F' }
    ],
    quantity: 3,
    upgrades: ['42', '43', '46', '47']
  },
  {
    id: '25',
    color: 'green',
    requires: { type: 'empty' },
    connects: [
      { from: 'B', to: 'D' },
      { from: 'D', to: 'F' }
    ],
    quantity: 1,
    upgrades: ['40', '45', '46']
  },
  {
    id: '26',
    color: 'green',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'D' },
      { from: 'C', to: 'D' }
    ],
    quantity: 1,
    upgrades: ['42', '44', '45']
  },
  {
    id: '27',
    color: 'green',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'D' },
      { from: 'D', to: 'E' }
    ],
    quantity: 1,
    upgrades: ['41', '44', '46']
  },
  {
    id: '28',
    color: 'green',
    requires: { type: 'empty' },
    connects: [
      { from: 'B', to: 'D' },
      { from: 'C', to: 'D' }
    ],
    quantity: 1,
    upgrades: ['39', '43', '46', '70']
  },
  {
    id: '29',
    color: 'green',
    requires: { type: 'empty' },
    connects: [
      { from: 'D', to: 'E' },
      { from: 'D', to: 'F' }
    ],
    quantity: 1,
    upgrades: ['39', '43', '45', '70']
  },
  {
    id: '53',
    color: 'green',
    requires: { type: 'city' },
    connects: [
      { from: 'B', to: 'C' },
      { from: 'C', to: 'F' }
    ],
    quantity: 2,
    upgrades: ['61']
  },
  
  // Brown tiles
  {
    id: '39',
    color: 'brown',
    requires: { type: 'empty' },
    connects: [
      { from: 'D', to: 'E' },
      { from: 'D', to: 'F' }
    ],
    quantity: 1,
    upgrades: ['70']
  },
  {
    id: '40',
    color: 'brown',
    requires: { type: 'empty' },
    connects: [
      { from: 'B', to: 'D' },
      { from: 'D', to: 'F' }
    ],
    quantity: 1,
    upgrades: ['70']
  },
  {
    id: '41',
    color: 'brown',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'D' },
      { from: 'D', to: 'E' }
    ],
    quantity: 1,
    upgrades: ['70']
  },
  {
    id: '42',
    color: 'brown',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'D' },
      { from: 'C', to: 'D' }
    ],
    quantity: 1,
    upgrades: ['70']
  },
  {
    id: '43',
    color: 'brown',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'D' },
      { from: 'B', to: 'C' }
    ],
    quantity: 1,
    upgrades: ['70']
  },
  {
    id: '44',
    color: 'brown',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'D' },
      { from: 'C', to: 'F' }
    ],
    quantity: 1,
    upgrades: ['70']
  },
  {
    id: '45',
    color: 'brown',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'C' },
      { from: 'B', to: 'D' }
    ],
    quantity: 1,
    upgrades: ['70']
  },
  {
    id: '46',
    color: 'brown',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'C' },
      { from: 'D', to: 'F' }
    ],
    quantity: 1,
    upgrades: ['70']
  },
  {
    id: '47',
    color: 'brown',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'D' },
      { from: 'D', to: 'F' }
    ],
    quantity: 1,
    upgrades: ['70']
  },
  {
    id: '61',
    color: 'brown',
    requires: { type: 'city' },
    connects: [
      { from: 'B', to: 'C' },
      { from: 'C', to: 'F' }
    ],
    quantity: 1,
    upgrades: ['70']
  },
  {
    id: '63',
    color: 'brown',
    requires: { type: 'city' },
    connects: [
      { from: 'A', to: 'C' },
      { from: 'C', to: 'D' },
      { from: 'D', to: 'F' }
    ],
    quantity: 1,
    upgrades: ['70']
  },
  {
    id: '70',
    color: 'gray',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'C' },
      { from: 'B', to: 'D' }
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

// Helper function to get tiles by color
export function getTilesByColor(color: 'yellow' | 'green'): TileDefinition[] {
  return ALL_TILES.filter(tile => tile.color === color);
}

// Helper function to get upgrade options for a tile
export function getUpgradeOptions(tileId: string): TileDefinition[] {
  const tile = ALL_TILES.find(t => t.id === tileId);
  if (!tile || !tile.upgrades) return [];
  return ALL_TILES.filter(t => tile.upgrades!.includes(t.id));
}

// Backward compatibility
export const YELLOW_TILES = getTilesByColor('yellow');
