// Tile system types and definitions

export interface TileConnection {
  from: string; // A, B, C, D, E, F
  to: string;   // A, B, C, D, E, F
}

export interface MultiWayConnection {
  sides: string[]; // Array of sides like ['B', 'C', 'F']
}

export interface TileRequirement {
  type: 'empty' | '1 town' | '2 town' | '2 towns' | 'city' | 'B' | '2-city' | 'NYC';
}

export interface TileDefinition {
  id: string;
  color: 'yellow' | 'green' | 'brown' | 'gray';
  requires: TileRequirement;
  connects: TileConnection[];
  quantity: number;
  upgrades?: string[]; // IDs of tiles this can upgrade to
  stations?: StationDefinition[]; // Explicit station definitions
}

export interface StationDefinition {
  id: string;
  position: { x: number; y: number };
  type: 'city' | 'town';
  maxCorporations?: number; // How many corporations can place stations here
}

// All tiles from 1830 (yellow, green, brown, gray)
export const ALL_TILES: TileDefinition[] = [
  // B tiles - Special starting tiles with B-D connections through cities
  {
    id: 'B',
    color: 'yellow',
    requires: { type: 'B' },
    connects: [
      { from: 'B', to: 'D' }
    ],
    quantity: 2, // 2 B tiles per board
    upgrades: ['53'] 
  },
  
  // 2-City tiles - Special hexes with two cities, no track initially
  {
    id: '2C',
    color: 'yellow',
    requires: { type: '2-city' },
    connects: [], // No track initially
    quantity: 3, // 3 per board
    upgrades: ['59'] 
  },
  
  // NYC tiles - Special starting tiles with two cities and A-D track connections
  {
    id: 'NYC',
    color: 'yellow',
    requires: { type: 'NYC' },
    connects: [
      { from: 'A', to: 'D' }
    ],
    quantity: 1, // 1 NYC tile per board
    upgrades: ['62'] 
  },
  
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
    requires: { type: '2 town' },
    connects: [
      { from: 'A', to: 'D' },
      { from: 'C', to: 'F' }
    ],
    quantity: 1
  },
  {
    id: '56',
    color: 'yellow',
    requires: { type: '2 town' },
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
    requires: { type: '2 town' },
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
    requires: { type: 'B' },
    connects: [
      { from: 'B', to: 'C' },
      { from: 'C', to: 'F' }
    ],
    quantity: 2,
    upgrades: ['61']
  },
  {
    id: '54',
    color: 'green',
    requires: { type: 'NYC' },
    connects: [
      { from: 'A', to: 'F' },
      { from: 'B', to: 'C' }
    ],
    quantity: 1,
    upgrades: ['62']
  },
  {
    id: '59',
    color: 'green',
    requires: { type: '2-city' },
    connects: [
      { from: 'C', to: 'E' }
    ],
    quantity: 2,
    upgrades: ['64', '65', '66', '67', '68']
  },
  
  // Brown tiles
  {
    id: '39',
    color: 'brown',
    requires: { type: 'empty' },
    connects: [
      { from: 'C', to: 'D' },
      { from: 'C', to: 'E' },
      { from: 'D', to: 'E' }
    ],
    quantity: 1
  },
  {
    id: '40',
    color: 'brown',
    requires: { type: 'empty' },
    connects: [
      { from: 'B', to: 'D' },
      { from: 'B', to: 'F' },
      { from: 'D', to: 'F' }
    ],
    quantity: 1
  },
  {
    id: '41',
    color: 'brown',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'D' },
      { from: 'A', to: 'B' },
      { from: 'B', to: 'D' }
    ],
    quantity: 2
  },
  {
    id: '42',
    color: 'brown',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'D' },
      { from: 'A', to: 'F' },
      { from: 'D', to: 'F' }
    ],
    quantity: 2
  },
  {
    id: '43',
    color: 'brown',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'D' },
      { from: 'A', to: 'C' },
      { from: 'B', to: 'D' }
    ],
    quantity: 2
  },
  {
    id: '44',
    color: 'brown',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'D' },
      { from: 'C', to: 'F' },
      { from: 'A', to: 'F' },
      { from: 'C', to: 'D' }
    ],
    quantity: 1
  },
  {
    id: '45',
    color: 'brown',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'D' },
      { from: 'D', to: 'C' },
      { from: 'C', to: 'E' },
      { from: 'E', to: 'A' }
    ],
    quantity: 1
  },
  {
    id: '46',
    color: 'brown',
    requires: { type: 'empty' },
    connects: [
      { from: 'B', to: 'D' },
      { from: 'B', to: 'E' },
      { from: 'D', to: 'F' },
      { from: 'E', to: 'F' }
    ],
    quantity: 2
  },
  {
    id: '47',
    color: 'brown',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'D' },
      { from: 'A', to: 'C' },
      { from: 'C', to: 'F' },
      { from: 'D', to: 'F' }
    ],
    quantity: 1
  },
  {
    id: '61',
    color: 'brown',
    requires: { type: 'B' },
    connects: [
      { from: 'A', to: 'B' },
      { from: 'B', to: 'D' },
      { from: 'D', to: 'F' }
    ],
    quantity: 2
  },
  {
    id: '62',
    color: 'brown',
    requires: { type: 'NYC' },
    connects: [
      { from: 'A', to: 'B' },
      { from: 'C', to: 'D' }
    ],
    quantity: 1
  },
  {
    id: '63',
    color: 'brown',
    requires: { type: 'city' },
    connects: [
      { from: 'A', to: 'B' },
      { from: 'B', to: 'C' },
      { from: 'C', to: 'D' },
      { from: 'D', to: 'E' },
      { from: 'E', to: 'F' }
    ],
    quantity: 3
  },
  {
    id: '64',
    color: 'brown',
    requires: { type: '2-city' },
    connects: [
      { from: 'A', to: 'B' },
      { from: 'D', to: 'F' }
    ],
    quantity: 1
  },
  {
    id: '65',
    color: 'brown',
    requires: { type: '2-city' },
    connects: [
      { from: 'B', to: 'C' },
      { from: 'D', to: 'F' }
    ],
    quantity: 1
  },
  {
    id: '66',
    color: 'brown',
    requires: { type: '2-city' },
    connects: [
      { from: 'A', to: 'B' },
      { from: 'C', to: 'F' }
    ],
    quantity: 1
  },
  {
    id: '67',
    color: 'brown',
    requires: { type: '2-city' },
    connects: [
      { from: 'A', to: 'E' },
      { from: 'C', to: 'F' }
    ],
    quantity: 1
  },
  {
    id: '68',
    color: 'brown',
    requires: { type: '2-city' },
    connects: [
      { from: 'A', to: 'D' },
      { from: 'B', to: 'E' }
    ],
    quantity: 1
  },
  {
    id: '70',
    color: 'brown',
    requires: { type: 'empty' },
    connects: [
      { from: 'A', to: 'B' },
      { from: 'A', to: 'C' },
      { from: 'B', to: 'D' },
      { from: 'C', to: 'D' }
    ],
    quantity: 1
  }
];

// Helper function to check if a tile can be placed on a hex
export function canPlaceTile(tile: TileDefinition, hexFeature: 'city' | 'town' | 'two-towns' | 'B' | '2-city' | 'NYC' | undefined): boolean {
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
    case 'B':
      return hexFeature === 'B';
    case '2-city':
      return hexFeature === '2-city';
    case 'NYC':
      return hexFeature === 'NYC';
    default:
      return false;
  }
}

// Helper function to get tiles by color
export function getTilesByColor(color: 'yellow' | 'green'): TileDefinition[] {
  return ALL_TILES.filter(tile => tile.color === color);
}

// Helper function to get playable tiles (excluding special map tiles B, NYC, and 2C)
export function getPlayableTilesByColor(color: 'yellow' | 'green' | 'brown'): TileDefinition[] {
  return ALL_TILES.filter(tile => tile.color === color && tile.id !== 'B' && tile.id !== 'NYC' && tile.id !== '2C');
}

// Helper function to get upgrade options for a tile
export function getUpgradeOptions(tileId: string): TileDefinition[] {
  const tile = ALL_TILES.find(t => t.id === tileId);
  if (!tile || !tile.upgrades) return [];
  return ALL_TILES.filter(t => tile.upgrades!.includes(t.id));
}

// Backward compatibility
export const YELLOW_TILES = getTilesByColor('yellow');
