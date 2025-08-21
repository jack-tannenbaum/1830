import type { TrackTile, HexCoordinate, GameMapGraph, TrackConnection } from '../types/mapGraph';
import { hexToString, getNeighbors } from './hexCoordinates';

// === Track Tile Definitions ===

// Basic track tile definitions using hexagonal coordinates
export const TRACK_TILES: Record<string, TrackTile> = {
  // Yellow tiles (Phase 1) - Limited connectivity, single edges
  'yellow-straight': {
    id: 'yellow-straight',
    type: 'straight',
    color: 'yellow',
    exits: [
      { q: -1, r: 1, s: 0 },  // West
      { q: 1, r: -1, s: 0 }   // East
    ],
    cost: 0,
    isPlaced: false
  },
  'yellow-curve': {
    id: 'yellow-curve',
    type: 'curve',
    color: 'yellow',
    exits: [
      { q: 0, r: -1, s: 1 },  // North
      { q: 1, r: -1, s: 0 }   // East
    ],
    cost: 0,
    isPlaced: false
  },
  'yellow-cross': {
    id: 'yellow-cross',
    type: 'cross',
    color: 'yellow',
    exits: [
      { q: 0, r: -1, s: 1 },  // North
      { q: 1, r: -1, s: 0 },  // East
      { q: 0, r: 1, s: -1 },  // South
      { q: -1, r: 1, s: 0 }   // West
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
      { q: 0, r: -1, s: 1 },  // North
      { q: 0, r: 1, s: -1 }   // South
    ],
    cost: 10,
    isPlaced: false
  },
  'green-curve': {
    id: 'green-curve',
    type: 'curve',
    color: 'green',
    exits: [
      { q: 0, r: -1, s: 1 },  // North
      { q: 1, r: -1, s: 0 }   // East
    ],
    cost: 10,
    isPlaced: false
  },
  'green-cross': {
    id: 'green-cross',
    type: 'cross',
    color: 'green',
    exits: [
      { q: 0, r: -1, s: 1 },  // North
      { q: 1, r: -1, s: 0 },  // East
      { q: 0, r: 1, s: -1 },  // South
      { q: -1, r: 1, s: 0 }   // West
    ],
    cost: 10,
    isPlaced: false
  },
  'green-diagonal': {
    id: 'green-diagonal',
    type: 'curve',
    color: 'green',
    exits: [
      { q: -1, r: 0, s: 1 },  // Northwest
      { q: 1, r: 0, s: -1 }   // Southeast
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
      { q: 0, r: -1, s: 1 },  // North
      { q: 0, r: 1, s: -1 }   // South
    ],
    cost: 20,
    isPlaced: false
  },
  'brown-curve': {
    id: 'brown-curve',
    type: 'curve',
    color: 'brown',
    exits: [
      { q: 0, r: -1, s: 1 },  // North
      { q: 1, r: -1, s: 0 }   // East
    ],
    cost: 20,
    isPlaced: false
  },
  'brown-cross': {
    id: 'brown-cross',
    type: 'cross',
    color: 'brown',
    exits: [
      { q: 0, r: -1, s: 1 },  // North
      { q: 1, r: -1, s: 0 },  // East
      { q: 0, r: 1, s: -1 },  // South
      { q: -1, r: 1, s: 0 }   // West
    ],
    cost: 20,
    isPlaced: false
  },
  'brown-diagonal': {
    id: 'brown-diagonal',
    type: 'curve',
    color: 'brown',
    exits: [
      { q: -1, r: 0, s: 1 },  // Northwest
      { q: 1, r: 0, s: -1 }   // Southeast
    ],
    cost: 25,
    isPlaced: false
  },
  
  // Gray tiles (Phase 4+) - Maximum connectivity
  'gray-straight': {
    id: 'gray-straight',
    type: 'straight',
    color: 'gray',
    exits: [
      { q: 0, r: -1, s: 1 },  // North
      { q: 0, r: 1, s: -1 }   // South
    ],
    cost: 30,
    isPlaced: false
  },
  'gray-curve': {
    id: 'gray-curve',
    type: 'curve',
    color: 'gray',
    exits: [
      { q: 0, r: -1, s: 1 },  // North
      { q: 1, r: -1, s: 0 }   // East
    ],
    cost: 30,
    isPlaced: false
  },
  'gray-cross': {
    id: 'gray-cross',
    type: 'cross',
    color: 'gray',
    exits: [
      { q: 0, r: -1, s: 1 },  // North
      { q: 1, r: -1, s: 0 },  // East
      { q: 0, r: 1, s: -1 },  // South
      { q: -1, r: 1, s: 0 }   // West
    ],
    cost: 30,
    isPlaced: false
  },
  'gray-diagonal': {
    id: 'gray-diagonal',
    type: 'curve',
    color: 'gray',
    exits: [
      { q: -1, r: 0, s: 1 },  // Northwest
      { q: 1, r: 0, s: -1 }   // Southeast
    ],
    cost: 35,
    isPlaced: false
  }
};

// === Track Tile Functions ===

export function getAvailableTilesForPhase(phase: number): string[] {
  switch (phase) {
    case 1:
      return ['yellow-straight', 'yellow-curve', 'yellow-cross'];
    case 2:
      return ['yellow-straight', 'yellow-curve', 'yellow-cross', 'green-straight', 'green-curve', 'green-cross', 'green-diagonal'];
    case 3:
      return ['yellow-straight', 'yellow-curve', 'yellow-cross', 'green-straight', 'green-curve', 'green-cross', 'green-diagonal', 'brown-straight', 'brown-curve', 'brown-cross', 'brown-diagonal'];
    case 4:
    case 5:
    case 6:
    case 7:
      return Object.keys(TRACK_TILES);
    default:
      return ['yellow-straight', 'yellow-curve', 'yellow-cross'];
  }
}

export function canPlaceTrackTile(
  graph: GameMapGraph,
  coordinate: HexCoordinate,
  tileType: string
): { canPlace: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check if tile type is valid
  if (!TRACK_TILES[tileType]) {
    errors.push(`Invalid tile type: ${tileType}`);
    return { canPlace: false, errors };
  }
  
  // Check if coordinate is already occupied
  const coordStr = hexToString(coordinate);
  if (graph.trackTiles[coordStr]) {
    errors.push(`Track tile already exists at ${coordStr}`);
    return { canPlace: false, errors };
  }
  
  // Check if coordinate is adjacent to existing track or revenue center
  const neighbors = getNeighbors(coordinate);
  const hasAdjacentTrack = neighbors.some(neighbor => {
    const neighborStr = hexToString(neighbor);
    return graph.trackTiles[neighborStr] || 
           Object.values(graph.revenueCenters).some(rc => 
             rc.coordinate.q === neighbor.q && 
             rc.coordinate.r === neighbor.r && 
             rc.coordinate.s === neighbor.s
           );
  });
  
  if (!hasAdjacentTrack) {
    errors.push(`No adjacent track or revenue center at ${coordStr}`);
    return { canPlace: false, errors };
  }
  
  return { canPlace: true, errors };
}

export function placeTrackTile(
  graph: GameMapGraph,
  coordinate: HexCoordinate,
  tileType: string
): GameMapGraph {
  const validation = canPlaceTrackTile(graph, coordinate, tileType);
  if (!validation.canPlace) {
    throw new Error(`Cannot place track tile: ${validation.errors.join(', ')}`);
  }
  
  const tile = { ...TRACK_TILES[tileType], isPlaced: true };
  const coordStr = hexToString(coordinate);
  
  // Create new connections based on the placed tile
  const newConnections: TrackConnection[] = [];
  
  // For now, create simple connections between adjacent revenue centers
  // This is a simplified version - in a full implementation, you'd need more complex logic
  const revenueCenters = Object.values(graph.revenueCenters);
  
  // Find revenue centers that this tile might connect
  for (let i = 0; i < revenueCenters.length; i++) {
    for (let j = i + 1; j < revenueCenters.length; j++) {
      const center1 = revenueCenters[i];
      const center2 = revenueCenters[j];
      
      // Check if this tile creates a path between these centers
      const path = findPathBetweenCenters(graph, center1, center2, coordinate, tile);
      if (path.length > 0) {
        newConnections.push({
          from: center1.id,
          to: center2.id,
          hexesTraversed: path,
          trackTiles: [tile.id],
          isActive: true
        });
      }
    }
  }
  
  return {
    ...graph,
    trackTiles: {
      ...graph.trackTiles,
      [coordStr]: tile
    },
    connections: [...graph.connections, ...newConnections]
  };
}

// Helper function to find path between revenue centers
function findPathBetweenCenters(
  graph: GameMapGraph,
  center1: any,
  center2: any,
  tileCoord: HexCoordinate,
  tile: TrackTile
): HexCoordinate[] {
  // Simplified path finding - in reality, this would be more complex
  // For now, just check if the tile connects the centers directly
  const center1Neighbors = getNeighbors(center1.coordinate);
  const center2Neighbors = getNeighbors(center2.coordinate);
  
  // Check if the tile is between the centers
  const isBetweenCenters = center1Neighbors.some(n1 => 
    n1.q === tileCoord.q && n1.r === tileCoord.r && n1.s === tileCoord.s
  ) && center2Neighbors.some(n2 => 
    n2.q === tileCoord.q && n2.r === tileCoord.r && n2.s === tileCoord.s
  );
  
  if (isBetweenCenters) {
    return [center1.coordinate, tileCoord, center2.coordinate];
  }
  
  return [];
}

export function validateTrackPath(
  graph: GameMapGraph,
  path: HexCoordinate[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (let i = 0; i < path.length; i++) {
    const hexCoord = path[i];
    const coordStr = hexToString(hexCoord);
    
    // Check if there's a track tile at this coordinate
    const trackTile = graph.trackTiles[coordStr];
    if (!trackTile) {
      errors.push(`No track tile at ${coordStr}`);
      continue;
    }
    
    // Check if this tile connects to the next tile in the path
    if (i < path.length - 1) {
      const nextCoord = path[i + 1];
      const direction = {
        q: nextCoord.q - hexCoord.q,
        r: nextCoord.r - hexCoord.r,
        s: nextCoord.s - hexCoord.s
      };
      
      // Check if this direction is one of the tile's exits
      const hasExit = trackTile.exits.some(exit => 
        exit.q === direction.q && 
        exit.r === direction.r && 
        exit.s === direction.s
      );
      
      if (!hasExit) {
        errors.push(`Track tile at ${coordStr} does not connect to ${hexToString(nextCoord)}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
