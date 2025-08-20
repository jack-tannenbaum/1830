import type { GameMapGraph, RevenueCenter, RouteValidation, TrackConnection, GridCoordinate } from '../types/mapGraph';

// === Utility Functions ===

export function coordinateToString(coord: GridCoordinate): string {
  return `${coord.x},${coord.y}`;
}

export function stringToCoordinate(str: string): GridCoordinate {
  const [x, y] = str.split(',').map(Number);
  return { x, y };
}

export function getRevenueCenterById(
  graph: GameMapGraph, 
  id: string
): RevenueCenter | null {
  return graph.revenueCenters[id] || null;
}

// === Route Finding ===

// Find all possible routes from a starting point
export function findRoutes(
  graph: GameMapGraph,
  startId: string,
  maxLength: number
): RouteValidation[] {
  const start = getRevenueCenterById(graph, startId);
  if (!start) {
    return [{
      isValid: false,
      errors: [`Starting point ${startId} not found`],
      warnings: [],
      revenue: 0,
      path: [],
      trainLength: 0,
      hexesTraversed: []
    }];
  }

  const routes: RouteValidation[] = [];
  const visited = new Set<string>();
  
  function dfs(currentId: string, path: string[], currentRevenue: number, depth: number) {
    if (depth > maxLength) return;
    
    const current = getRevenueCenterById(graph, currentId);
    if (!current) return;
    
    // Add current node to path and revenue
    const newPath = [...path, currentId];
    const newRevenue = currentRevenue + current.revenue;
    
    // If we have a valid route (at least 2 revenue centers)
    if (newPath.length >= 2) {
      routes.push({
        isValid: true,
        errors: [],
        warnings: [],
        revenue: newRevenue,
        path: newPath,
        trainLength: newPath.length,
        hexesTraversed: []
      });
    }
    
    // Find connected revenue centers
    const connections = graph.connections.filter(
      conn => conn.isActive && 
      (conn.from === currentId || conn.to === currentId)
    );
    
    for (const connection of connections) {
      const nextId = connection.from === currentId ? connection.to : connection.from;
      
      // Avoid cycles (don't revisit nodes)
      if (!visited.has(nextId)) {
        visited.add(nextId);
        dfs(nextId, newPath, newRevenue, depth + 1);
        visited.delete(nextId);
      }
    }
  }
  
  visited.add(startId);
  dfs(startId, [], 0, 0);
  
  return routes;
}

// === Test Layout Creation ===

export function createTestLayout(): GameMapGraph {
  // Create a 3x3 grid for testing
  const revenueCenters: Record<string, RevenueCenter> = {
    't10': {
      id: 't10',
      name: 'Town 10',
      coordinate: { x: 0, y: 0 },
      revenue: 10,
      type: 'town',
      stationTokens: []
    },
    't15': {
      id: 't15', 
      name: 'Town 15',
      coordinate: { x: 1, y: 0 },
      revenue: 15,
      type: 'town',
      stationTokens: []
    },
    't20': {
      id: 't20',
      name: 'Town 20', 
      coordinate: { x: 2, y: 0 },
      revenue: 20,
      type: 'town',
      stationTokens: []
    },
    'c50': {
      id: 'c50',
      name: 'City 50',
      coordinate: { x: 0, y: 1 },
      revenue: 50,
      type: 'city',
      stationTokens: []
    }
  };

  // Create initial track connections
  const connections: TrackConnection[] = [
    {
      from: 't10',
      to: 't15',
      hexesTraversed: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
      trackTiles: ['yellow-straight-0,0', 'yellow-straight-1,0'],
      isActive: true
    },
    {
      from: 't15', 
      to: 't20',
      hexesTraversed: [{ x: 1, y: 0 }, { x: 2, y: 0 }],
      trackTiles: ['yellow-straight-1,0', 'yellow-straight-2,0'],
      isActive: true
    },
    {
      from: 't10',
      to: 'c50',
      hexesTraversed: [{ x: 0, y: 0 }, { x: 0, y: 1 }],
      trackTiles: ['yellow-straight-0,0', 'yellow-straight-0,1'],
      isActive: true
    }
  ];

  // Create initial track tiles
  const trackTiles: Record<string, any> = {
    '0,0': {
      id: 'yellow-straight-0,0',
      type: 'straight',
      color: 'yellow',
      exits: [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }],
      cost: 0,
      isPlaced: true
    },
    '1,0': {
      id: 'yellow-straight-1,0',
      type: 'straight', 
      color: 'yellow',
      exits: [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }],
      cost: 0,
      isPlaced: true
    },
    '2,0': {
      id: 'yellow-straight-2,0',
      type: 'straight',
      color: 'yellow', 
      exits: [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }],
      cost: 0,
      isPlaced: true
    },
    '0,1': {
      id: 'yellow-straight-0,1',
      type: 'straight',
      color: 'yellow',
      exits: [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }],
      cost: 0,
      isPlaced: true
    }
  };

  return {
    gridSize: { width: 3, height: 3 },
    revenueCenters,
    trackTiles,
    connections
  };
}
