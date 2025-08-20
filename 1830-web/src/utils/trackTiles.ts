import type { TrackTile, TrackTileType, TrackTileColor, GridCoordinate, GameMapGraph, TrackConnection } from '../types/mapGraph';

// === Track Tile Definitions ===

// Basic track tile definitions
export const TRACK_TILES: Record<string, TrackTile> = {
  // Yellow tiles (Phase 1) - Limited connectivity, single edges
  'yellow-straight': {
    id: 'yellow-straight',
    type: 'straight',
    color: 'yellow',
    exits: [
      { x: -1, y: 0 }, // West
      { x: 1, y: 0 }   // East
    ],
    cost: 0,
    isPlaced: false
  },
  'yellow-curve': {
    id: 'yellow-curve',
    type: 'curve',
    color: 'yellow',
    exits: [
      { x: 0, y: -1 }, // North
      { x: 1, y: 0 }   // East
    ],
    cost: 0,
    isPlaced: false
  },
  'yellow-cross': {
    id: 'yellow-cross',
    type: 'cross',
    color: 'yellow',
    exits: [
      { x: 0, y: -1 }, // North
      { x: 1, y: 0 },  // East
      { x: 0, y: 1 },  // South
      { x: -1, y: 0 }  // West
    ],
    cost: 0,
    isPlaced: false
  },
  
  // Green tiles (Phase 2) - More connectivity, multiple edges
  'green-straight': {
    id: 'green-straight',
    type: 'straight',
    color: 'green',
    exits: [
      { x: 0, y: -1 }, // North
      { x: 0, y: 1 }   // South
    ],
    cost: 10,
    isPlaced: false
  },
  'green-curve': {
    id: 'green-curve',
    type: 'curve',
    color: 'green',
    exits: [
      { x: 0, y: -1 }, // North
      { x: 1, y: 0 }   // East
    ],
    cost: 10,
    isPlaced: false
  },
  'green-cross': {
    id: 'green-cross',
    type: 'cross',
    color: 'green',
    exits: [
      { x: 0, y: -1 }, // North
      { x: 1, y: 0 },  // East
      { x: 0, y: 1 },  // South
      { x: -1, y: 0 }  // West
    ],
    cost: 10,
    isPlaced: false
  },
  'green-diagonal': {
    id: 'green-diagonal',
    type: 'curve',
    color: 'green',
    exits: [
      { x: -1, y: -1 }, // Northwest
      { x: 1, y: 1 }    // Southeast
    ],
    cost: 15,
    isPlaced: false
  },
  
  // Brown tiles (Phase 3) - Advanced connectivity
  'brown-straight': {
    id: 'brown-straight',
    type: 'straight',
    color: 'brown',
    exits: [
      { x: 0, y: -1 }, // North
      { x: 0, y: 1 }   // South
    ],
    cost: 20,
    isPlaced: false
  },
  'brown-curve': {
    id: 'brown-curve',
    type: 'curve',
    color: 'brown',
    exits: [
      { x: 0, y: -1 }, // North
      { x: 1, y: 0 }   // East
    ],
    cost: 20,
    isPlaced: false
  },
  'brown-cross': {
    id: 'brown-cross',
    type: 'cross',
    color: 'brown',
    exits: [
      { x: 0, y: -1 }, // North
      { x: 1, y: 0 },  // East
      { x: 0, y: 1 },  // South
      { x: -1, y: 0 }  // West
    ],
    cost: 20,
    isPlaced: false
  },
  'brown-diagonal': {
    id: 'brown-diagonal',
    type: 'curve',
    color: 'brown',
    exits: [
      { x: -1, y: -1 }, // Northwest
      { x: 1, y: 1 }    // Southeast
    ],
    cost: 25,
    isPlaced: false
  },
  'brown-complex': {
    id: 'brown-complex',
    type: 'cross',
    color: 'brown',
    exits: [
      { x: 0, y: -1 },  // North
      { x: 1, y: 0 },   // East
      { x: 0, y: 1 },   // South
      { x: -1, y: 0 },  // West
      { x: -1, y: -1 }, // Northwest
      { x: 1, y: 1 }    // Southeast
    ],
    cost: 30,
    isPlaced: false
  }
};

// === Track Tile Utilities ===

export function coordinateToString(coord: GridCoordinate): string {
  return `${coord.x},${coord.y}`;
}

export function stringToCoordinate(str: string): GridCoordinate {
  const [x, y] = str.split(',').map(Number);
  return { x, y };
}

export function getAdjacentCoordinates(coord: GridCoordinate): GridCoordinate[] {
  return [
    { x: coord.x, y: coord.y - 1 }, // North
    { x: coord.x, y: coord.y + 1 }, // South
    { x: coord.x + 1, y: coord.y }, // East
    { x: coord.x - 1, y: coord.y }, // West
  ];
}

export function canPlaceTrackTile(
  graph: GameMapGraph,
  coord: GridCoordinate,
  tileId: string
): { canPlace: boolean; reason?: string } {
  const coordStr = coordinateToString(coord);
  
  // Check if tile already exists
  if (graph.trackTiles[coordStr]) {
    return { canPlace: false, reason: 'Tile already exists at this location' };
  }
  
  // Check if coordinate is within grid bounds
  if (coord.x < 0 || coord.x >= graph.gridSize.width || 
      coord.y < 0 || coord.y >= graph.gridSize.height) {
    return { canPlace: false, reason: 'Coordinate outside grid bounds' };
  }
  
  // Track tiles CAN be placed on revenue centers (cities/towns)
  // This allows cities to have track infrastructure and connect to other locations
  
  return { canPlace: true };
}

// Find revenue centers that can be connected by placing a track tile
export function findConnectableRevenueCenters(
  graph: GameMapGraph,
  coord: GridCoordinate,
  tileId: string
): { from: string; to: string }[] {
  const tile = TRACK_TILES[tileId];
  if (!tile) return [];
  
  const connections: { from: string; to: string }[] = [];
  
  // Debug: Log what we're trying to connect
  console.log(`Placing ${tileId} at (${coord.x},${coord.y}) with exits:`, tile.exits);
  
  // For each pair of exits, create a connection between revenue centers in those directions
  for (let i = 0; i < tile.exits.length; i++) {
    for (let j = i + 1; j < tile.exits.length; j++) {
      const exit1 = tile.exits[i];
      const exit2 = tile.exits[j];
      
      // Find revenue centers in both directions
      const center1Coord = { x: coord.x + exit1.x, y: coord.y + exit1.y };
      const center2Coord = { x: coord.x + exit2.x, y: coord.y + exit2.y };
      
      const center1 = Object.values(graph.revenueCenters).find(
        (rc) => rc.coordinate.x === center1Coord.x && rc.coordinate.y === center1Coord.y
      );
      
      const center2 = Object.values(graph.revenueCenters).find(
        (rc) => rc.coordinate.x === center2Coord.x && rc.coordinate.y === center2Coord.y
      );
      
      // If we found revenue centers in both directions, create a connection
      if (center1 && center2) {
        console.log(`Creating connection: ${center1.id} <-> ${center2.id}`);
        
        // Check if connection already exists
        const existingConnection = graph.connections.find(
          conn => conn.isActive && 
          ((conn.from === center1.id && conn.to === center2.id) ||
           (conn.from === center2.id && conn.to === center1.id))
        );
        
        if (!existingConnection) {
          connections.push({
            from: center1.id,
            to: center2.id
          });
        }
      } else {
        console.log(`No revenue centers found at (${center1Coord.x},${center1Coord.y}) or (${center2Coord.x},${center2Coord.y})`);
      }
    }
  }
  
  console.log(`Found ${connections.length} connections for this tile`);
  return connections;
}

export function placeTrackTile(
  graph: GameMapGraph,
  coord: GridCoordinate,
  tileId: string
): GameMapGraph {
  const tile = TRACK_TILES[tileId];
  if (!tile) {
    throw new Error(`Unknown tile ID: ${tileId}`);
  }
  
  const placementCheck = canPlaceTrackTile(graph, coord, tileId);
  if (!placementCheck.canPlace) {
    throw new Error(placementCheck.reason);
  }
  
  const coordStr = coordinateToString(coord);
  const newTile: TrackTile = {
    ...tile,
    id: `${tileId}-${coordStr}`, // Make ID unique
    isPlaced: true
  };
  
  // Find new connections this tile creates
  const newConnections = findConnectableRevenueCenters(graph, coord, tileId);
  
  // Create track connections for each new connection
  const trackConnections: TrackConnection[] = newConnections.map(conn => ({
    from: conn.from,
    to: conn.to,
    hexesTraversed: [coord],
    trackTiles: [newTile.id],
    isActive: true
  }));
  
  return {
    ...graph,
    trackTiles: {
      ...graph.trackTiles,
      [coordStr]: newTile
    },
    connections: [
      ...graph.connections,
      ...trackConnections
    ]
  };
}

export function getAvailableTilesForPhase(phase: number): string[] {
  switch (phase) {
    case 1:
      // Phase 1: Basic connectivity - straight lines and simple curves
      return ['yellow-straight', 'yellow-curve', 'yellow-cross'];
    case 2:
      // Phase 2: More connectivity - diagonal connections become available
      return [
        'yellow-straight', 'yellow-curve', 'yellow-cross',
        'green-straight', 'green-curve', 'green-cross', 'green-diagonal'
      ];
    case 3:
      // Phase 3: Advanced connectivity - complex multi-directional connections
      return [
        'yellow-straight', 'yellow-curve', 'yellow-cross',
        'green-straight', 'green-curve', 'green-cross', 'green-diagonal',
        'brown-straight', 'brown-curve', 'brown-cross', 'brown-diagonal', 'brown-complex'
      ];
    default:
      return ['yellow-straight', 'yellow-curve', 'yellow-cross'];
  }
}

export function calculateTrackCost(tileId: string): number {
  const tile = TRACK_TILES[tileId];
  return tile ? tile.cost : 0;
}

// Check if a route can be run along existing track connections
export function canRunRouteAlongTracks(
  graph: GameMapGraph,
  path: string[]
): { canRun: boolean; reason?: string } {
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    
    // Check if there's an active track connection between these revenue centers
    const hasConnection = graph.connections.some(
      conn => conn.isActive && 
      ((conn.from === from && conn.to === to) || (conn.from === to && conn.to === from))
    );
    
    if (!hasConnection) {
      return { 
        canRun: false, 
        reason: `No track connection between ${from} and ${to}` 
      };
    }
  }
  
  return { canRun: true };
}

// Validate that track tiles create a continuous path between revenue centers
export function validateTrackPath(
  graph: GameMapGraph,
  path: string[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    
    // Find the connection between these revenue centers
    const connection = graph.connections.find(
      conn => conn.isActive && 
      ((conn.from === from && conn.to === to) || (conn.from === to && conn.to === from))
    );
    
    if (!connection) {
      errors.push(`No track connection between ${from} and ${to}`);
      continue;
    }
    
    // Check that the track tiles in the connection actually connect these centers
    for (const hexCoord of connection.hexesTraversed) {
      const trackTile = graph.trackTiles[coordinateToString(hexCoord)];
      if (!trackTile) {
        errors.push(`No track tile at ${coordinateToString(hexCoord)}`);
        continue;
      }
      
      // Verify the track tile has exits that connect the revenue centers
      const fromCenter = graph.revenueCenters[from];
      const toCenter = graph.revenueCenters[to];
      
      if (fromCenter && toCenter) {
        const fromDirection = {
          x: fromCenter.coordinate.x - hexCoord.x,
          y: fromCenter.coordinate.y - hexCoord.y
        };
        const toDirection = {
          x: toCenter.coordinate.x - hexCoord.x,
          y: toCenter.coordinate.y - hexCoord.y
        };
        
        const hasFromExit = trackTile.exits.some(
          exit => exit.x === fromDirection.x && exit.y === fromDirection.y
        );
        const hasToExit = trackTile.exits.some(
          exit => exit.x === toDirection.x && exit.y === toDirection.y
        );
        
        if (!hasFromExit || !hasToExit) {
          errors.push(`Track tile at ${coordinateToString(hexCoord)} does not connect ${from} to ${to}`);
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
