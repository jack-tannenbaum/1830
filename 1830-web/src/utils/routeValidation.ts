import type { GameMapGraph, RouteValidation } from '../types/mapGraph';
import { hexToString } from './hexCoordinates';

// === Route Validation Functions ===

export function validateTrainLength(path: string[], trainType: string): { isValid: boolean; error?: string } {
  const pathLength = path.length;
  
  switch (trainType) {
    case '2-train':
      if (pathLength !== 2) {
        return { isValid: false, error: `2-train must visit exactly 2 revenue centers, got ${pathLength}` };
      }
      break;
    case '3-train':
    case '4-train':
    case '5-train':
    case '6-train':
      const maxLength = parseInt(trainType.split('-')[0]);
      if (pathLength > maxLength) {
        return { isValid: false, error: `${trainType} can visit at most ${maxLength} revenue centers, got ${pathLength}` };
      }
      break;
    case 'diesel':
      if (pathLength > 999) {
        return { isValid: false, error: 'Diesel can visit at most 999 revenue centers' };
      }
      break;
    default:
      return { isValid: false, error: `Unknown train type: ${trainType}` };
  }
  
  return { isValid: true };
}

export function validateTrackConnectivity(
  graph: GameMapGraph, 
  path: string[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    
    // Check if there's an active track connection between these revenue centers
    const hasConnection = graph.connections.some(
      conn => conn.isActive && 
      ((conn.from === from && conn.to === to) || (conn.from === to && conn.to === from))
    );
    
    if (!hasConnection) {
      errors.push(`No track connection between ${from} and ${to}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateNoBacktracking(
  graph: GameMapGraph, 
  path: string[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for duplicate revenue centers
  const visitedCenters = new Set<string>();
  for (const center of path) {
    if (visitedCenters.has(center)) {
      errors.push(`Revenue center ${center} visited twice in the same route`);
    }
    visitedCenters.add(center);
  }
  
  // Check for duplicate track segments
  const usedTrackSegments = new Set<string>();
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    
    // Find the track connection between these centers
    const connection = graph.connections.find(
      conn => conn.isActive && 
      ((conn.from === from && conn.to === to) || (conn.from === to && conn.to === from))
    );
    
    if (connection) {
      // Create a unique identifier for this track segment
      const segmentId = connection.hexesTraversed.map(coord => hexToString(coord)).sort().join('|');
      
      if (usedTrackSegments.has(segmentId)) {
        errors.push(`Track segment between ${from} and ${to} used twice in the same route`);
      }
      usedTrackSegments.add(segmentId);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateStationAccess(
  graph: GameMapGraph, 
  corporationId: string, 
  path: string[]
): { isValid: boolean; error?: string } {
  
  const hasStationAccess = path.some(centerId => {
    const center = graph.revenueCenters[centerId];
    return center && center.stationTokens.includes(corporationId);
  });
  
  if (!hasStationAccess) {
    return { 
      isValid: false, 
      error: `Route must pass through at least one revenue center where ${corporationId} has a station token` 
    };
  }
  
  return { isValid: true };
}

export function validateUniqueTrackUsage(
  graph: GameMapGraph, 
  path: string[], 
  existingRoutes: string[][]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Get track segments used by this route
  const currentRouteSegments = new Set<string>();
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    
    const connection = graph.connections.find(
      conn => conn.isActive && 
      ((conn.from === from && conn.to === to) || (conn.from === to && conn.to === from))
    );
    
    if (connection) {
      const segmentId = connection.hexesTraversed.map(coord => hexToString(coord)).sort().join('|');
      currentRouteSegments.add(segmentId);
    }
  }
  
  // Check against existing routes
  for (const existingRoute of existingRoutes) {
    for (let i = 0; i < existingRoute.length - 1; i++) {
      const from = existingRoute[i];
      const to = existingRoute[i + 1];
      
      const connection = graph.connections.find(
        conn => conn.isActive && 
        ((conn.from === from && conn.to === to) || (conn.from === to && conn.to === from))
      );
      
      if (connection) {
        const segmentId = connection.hexesTraversed.map(coord => hexToString(coord)).sort().join('|');
        
        if (currentRouteSegments.has(segmentId)) {
          errors.push(`Track segment between ${from} and ${to} already used by another train`);
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function calculateRouteRevenue(graph: GameMapGraph, path: string[]): number {
  let totalRevenue = 0;
  
  for (const centerId of path) {
    const center = graph.revenueCenters[centerId];
    if (center) {
      totalRevenue += center.revenue;
    }
  }
  
  return totalRevenue;
}

// === Main Route Validation Function ===

// Train types for validation
export const TRAIN_TYPES = ['2-train', '3-train', '4-train', '5-train', '6-train', 'diesel'] as const;

export function validateRoute(
  graph: GameMapGraph,
  path: string[],
  trainType: string,
  corporationId: string,
  existingRoutes: string[][] = []
): RouteValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. Validate train length
  const lengthValidation = validateTrainLength(path, trainType);
  if (!lengthValidation.isValid) {
    errors.push(lengthValidation.error!);
  }
  
  // 2. Validate track connectivity
  const connectivityValidation = validateTrackConnectivity(graph, path);
  if (!connectivityValidation.isValid) {
    errors.push(...connectivityValidation.errors);
  }
  
  // 3. Validate no backtracking
  const backtrackingValidation = validateNoBacktracking(graph, path);
  if (!backtrackingValidation.isValid) {
    errors.push(...backtrackingValidation.errors);
  }
  
  // 4. Validate station access
  const stationValidation = validateStationAccess(graph, corporationId, path);
  if (!stationValidation.isValid) {
    errors.push(stationValidation.error!);
  }
  
  // 5. Validate unique track usage
  const trackUsageValidation = validateUniqueTrackUsage(graph, path, existingRoutes);
  if (!trackUsageValidation.isValid) {
    errors.push(...trackUsageValidation.errors);
  }
  
  // Calculate revenue
  const revenue = calculateRouteRevenue(graph, path);
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    revenue,
    path,
    trainLength: path.length,
    hexesTraversed: [] // TODO: Calculate actual hexes traversed
  };
}
