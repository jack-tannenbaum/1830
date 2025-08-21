import type { GameMapGraph, RevenueCenter, TrackConnection, GridCoordinate, RouteValidation } from '../types/mapGraph';
import { placeTrackTile, canPlaceTrackTile, getAvailableTilesForPhase, validateTrackPath, coordinateToString } from './trackTiles';
import { validateRoute, TRAIN_TYPES } from './routeValidation';

// === Enhanced Test Functions ===

export function createTestGraph(): GameMapGraph {
  return {
    revenueCenters: {
      't10': { id: 't10', name: 'Town 10', coordinate: { x: 0, y: 0 }, type: 'town', revenue: 10, stationTokens: [] },
      't15': { id: 't15', name: 'Town 15', coordinate: { x: 2, y: 0 }, type: 'town', revenue: 15, stationTokens: [] },
      't20': { id: 't20', name: 'Town 20', coordinate: { x: 0, y: 2 }, type: 'town', revenue: 20, stationTokens: [] },
      't25': { id: 't25', name: 'Town 25', coordinate: { x: 2, y: 2 }, type: 'town', revenue: 25, stationTokens: [] },
      'c50': { id: 'c50', name: 'City 50', coordinate: { x: 1, y: 1 }, type: 'city', revenue: 50, stationTokens: [] }
    },
    connections: [],
    trackTiles: {},
    gridSize: { width: 3, height: 3 }
  };
}

export function addConnection(graph: GameMapGraph, from: string, to: string): GameMapGraph {
  const connection: TrackConnection = {
    from,
    to,
    hexesTraversed: [
      graph.revenueCenters[from].coordinate,
      graph.revenueCenters[to].coordinate
    ],
    trackTiles: [],
    isActive: true
  };
  
  return {
    ...graph,
    connections: [...graph.connections, connection]
  };
}

export function findRoutes(graph: GameMapGraph, startId: string, maxLength: number): RouteValidation[] {
  const routes: RouteValidation[] = [];
  const visited = new Set<string>();
  
  function dfs(currentId: string, path: string[], currentRevenue: number) {
    if (path.length > maxLength) return;
    
    const current = graph.revenueCenters[currentId];
    if (!current) return;
    
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
      (conn: TrackConnection) => conn.isActive && 
      (conn.from === currentId || conn.to === currentId)
    );
    
    for (const connection of connections) {
      const nextId = connection.from === currentId ? connection.to : connection.from;
      
      if (!visited.has(nextId)) {
        visited.add(nextId);
        dfs(nextId, newPath, newRevenue);
        visited.delete(nextId);
      }
    }
  }
  
  visited.add(startId);
  dfs(startId, [], 0);
  
  return routes;
}



// === Station Token Management ===

export function placeStationToken(
  graph: GameMapGraph,
  corporationId: string,
  revenueCenterId: string
): GameMapGraph {
  const revenueCenter = graph.revenueCenters[revenueCenterId];
  if (!revenueCenter) {
    throw new Error(`Revenue center ${revenueCenterId} not found`);
  }
  
  if (revenueCenter.stationTokens.includes(corporationId)) {
    throw new Error(`Corporation ${corporationId} already has a station at ${revenueCenterId}`);
  }
  
  return {
    ...graph,
    revenueCenters: {
      ...graph.revenueCenters,
      [revenueCenterId]: {
        ...revenueCenter,
        stationTokens: [...revenueCenter.stationTokens, corporationId]
      }
    }
  };
}

export function removeStationToken(
  graph: GameMapGraph,
  corporationId: string,
  revenueCenterId: string
): GameMapGraph {
  const revenueCenter = graph.revenueCenters[revenueCenterId];
  if (!revenueCenter) {
    throw new Error(`Revenue center ${revenueCenterId} not found`);
  }
  
  if (!revenueCenter.stationTokens.includes(corporationId)) {
    throw new Error(`Corporation ${corporationId} does not have a station at ${revenueCenterId}`);
  }
  
  return {
    ...graph,
    revenueCenters: {
      ...graph.revenueCenters,
      [revenueCenterId]: {
        ...revenueCenter,
        stationTokens: revenueCenter.stationTokens.filter((id: string) => id !== corporationId)
      }
    }
  };
}

// === Enhanced Test Suite ===

export function runEnhancedTest(): void {
  console.log('🧪 Running Enhanced Map Graph Test...\n');
  
  // Create test graph
  let graph = createTestGraph();
  console.log('✅ Created test graph with 5 revenue centers');
  console.log('Layout:');
  console.log('[0,0] [1,0] [2,0]  - T10  E   T15');
  console.log('[0,1] [1,1] [2,1]  - E   C50 E  ');
  console.log('[0,2] [1,2] [2,2]  - T20 E   T25\n');
  
  // Test Phase 1 (Yellow) - Laying track that CONNECTS revenue centers
  console.log('\n📦 Phase 1 (Yellow) - Laying Track That CONNECTS Revenue Centers:');
  try {
    // To connect T10 to T15, we need track tiles that actually connect them:
    
    // 1. Track tile on T10 (0,0) - with exits pointing toward the next hex
    graph = placeTrackTile(graph, { x: 0, y: 0 }, 'yellow-straight');
    console.log('✅ Placed yellow-straight tile at (0,0) - track on T10 with exits toward next hex');
    
    // 2. Track tile on empty hex (1,0) - with exits that connect T10 to T15
    graph = placeTrackTile(graph, { x: 1, y: 0 }, 'yellow-straight');
    console.log('✅ Placed yellow-straight tile at (1,0) - track connects T10 to T15 through this hex');
    
    // 3. Track tile on T15 (2,0) - with exits pointing toward the previous hex
    graph = placeTrackTile(graph, { x: 2, y: 0 }, 'yellow-straight');
    console.log('✅ Placed yellow-straight tile at (2,0) - track on T15 with exits toward previous hex');
    
    console.log(`🔗 Phase 1 connections: ${graph.connections.length}`);
  } catch (error) {
    console.log(`❌ Phase 1 error: ${error}`);
  }
  
  // Test Phase 2 (Green) - More track that connects revenue centers
  console.log('\n📦 Phase 2 (Green) - Enhanced Track That CONNECTS Revenue Centers:');
  try {
    // Track tile on C50 (1,1) - with exits that connect to adjacent centers
    graph = placeTrackTile(graph, { x: 1, y: 1 }, 'green-cross');
    console.log('✅ Placed green-cross tile at (1,1) - track on C50 connects to all adjacent centers');
    
    // Track tile on T20 (0,2) - with exits pointing toward C50
    graph = placeTrackTile(graph, { x: 0, y: 2 }, 'green-curve');
    console.log('✅ Placed green-curve tile at (0,2) - track on T20 with exits toward C50');
    
    // Track tile on empty hex (0,1) - connects T10 to C50 (vertical connection)
    graph = placeTrackTile(graph, { x: 0, y: 1 }, 'green-straight');
    console.log('✅ Placed green-straight tile at (0,1) - track connects T10 to C50 through this hex (vertical)');
    
    console.log(`🔗 Phase 2 connections: ${graph.connections.length}`);
  } catch (error) {
    console.log(`❌ Phase 2 error: ${error}`);
  }
  
  // Test Phase 3 (Brown) - Advanced track that connects remaining centers
  console.log('\n📦 Phase 3 (Brown) - Advanced Track That CONNECTS Remaining Centers:');
  try {
    // Track tile on T25 (2,2) - with exits pointing toward C50
    graph = placeTrackTile(graph, { x: 2, y: 2 }, 'brown-curve');
    console.log('✅ Placed brown-curve tile at (2,2) - track on T25 with exits toward C50');
    
    // Track tile on empty hex (2,1) - connects C50 to T25 (vertical connection)
    graph = placeTrackTile(graph, { x: 2, y: 1 }, 'brown-straight');
    console.log('✅ Placed brown-straight tile at (2,1) - track connects C50 to T25 through this hex (vertical)');
    
    console.log(`🔗 Phase 3 connections: ${graph.connections.length}`);
  } catch (error) {
    console.log(`❌ Phase 3 error: ${error}`);
  }
  
  // Show all connections created by track that actually connects revenue centers
  console.log('\n🔗 Track Connections (Revenue Centers Connected by Track):');
  graph.connections.forEach((conn: TrackConnection) => {
    const fromTile = graph.trackTiles[coordinateToString(conn.hexesTraversed[0])];
    console.log(`  ${conn.from} ↔ ${conn.to} (via ${fromTile?.color}-${fromTile?.type} track through hex at ${coordinateToString(conn.hexesTraversed[0])})`);
  });
  
  // Test station token placement on revenue centers
  console.log('\n🏢 Testing Station Token Placement on Revenue Centers:');
  try {
    graph = placeStationToken(graph, 'PRR', 't20');
    console.log('✅ Placed PRR station at T20 (revenue center with connecting track)');
    
    graph = placeStationToken(graph, 'B&O', 't10');
    console.log('✅ Placed B&O station at T10 (revenue center with connecting track)');
    
    // Test duplicate placement
    try {
      graph = placeStationToken(graph, 'PRR', 't20');
      console.log('❌ Should not allow duplicate station');
    } catch (error) {
      console.log('✅ Correctly prevented duplicate station placement');
    }
  } catch (error) {
    console.log(`❌ Station token error: ${error}`);
  }
  
  // Test route finding using track that connects revenue centers
  const routes = findRoutes(graph, 't10', 4);
  console.log(`\n🚂 Found ${routes.length} routes from T10 using connecting track:`);
  
  routes.forEach(route => {
    console.log(`  ${route.path.join(' -> ')} = $${route.revenue} (${route.trainLength} stops)`);
  });
  
  // Test comprehensive route validation
  console.log('\n🎯 Testing Comprehensive Route Validation:');
  
  // Test 2-train route T10 -> T15
  const t10ToT15Route = validateRoute(graph, ['t10', 't15'], '2-train', 'B&O', []);
  console.log(`2-train route T10 -> T15: ${t10ToT15Route.isValid ? 'VALID' : 'INVALID'}`);
  if (t10ToT15Route.isValid) {
    console.log(`  Revenue: $${t10ToT15Route.revenue} (T10: $10 + T15: $15)`);
    console.log(`  Train length: ${t10ToT15Route.trainLength} stops`);
  } else {
    console.log(`  Errors: ${t10ToT15Route.errors.join(', ')}`);
  }
  
  // Test 3-train route T10 -> T15 (should be valid - can visit 2-3 centers)
  const t10ToT15Route3Train = validateRoute(graph, ['t10', 't15'], '3-train', 'B&O', []);
  console.log(`3-train route T10 -> T15: ${t10ToT15Route3Train.isValid ? 'VALID' : 'INVALID'}`);
  if (t10ToT15Route3Train.isValid) {
    console.log(`  Revenue: $${t10ToT15Route3Train.revenue} (T10: $10 + T15: $15)`);
    console.log(`  Train length: ${t10ToT15Route3Train.trainLength} stops (flexible 3-train)`);
  } else {
    console.log(`  Errors: ${t10ToT15Route3Train.errors.join(', ')}`);
  }
  
  // Test invalid 2-train route with 3 stops
  const invalid2TrainRoute = validateRoute(graph, ['t10', 't15', 't25'], '2-train', 'B&O', []);
  console.log(`2-train route T10 -> T15 -> T25: ${invalid2TrainRoute.isValid ? 'VALID' : 'INVALID'}`);
  if (!invalid2TrainRoute.isValid) {
    console.log(`  Expected Error: ${invalid2TrainRoute.errors.join(', ')}`);
  }
  
  // Test station access validation
  const routeWithoutStation = validateRoute(graph, ['t10', 't15'], '2-train', 'UNKNOWN_CORP', []);
  console.log(`Route without station access: ${routeWithoutStation.isValid ? 'VALID' : 'INVALID'}`);
  if (!routeWithoutStation.isValid) {
    console.log(`  Expected Error: ${routeWithoutStation.errors.join(', ')}`);
  }
  
  // Test multiple trains with track segment conflicts
  const existingRoutes = [['t10', 't15']]; // First train uses T10-T15 track
  const conflictingRoute = validateRoute(graph, ['t10', 't15'], '2-train', 'PRR', existingRoutes);
  console.log(`Conflicting route (same track): ${conflictingRoute.isValid ? 'VALID' : 'INVALID'}`);
  if (!conflictingRoute.isValid) {
    console.log(`  Expected Error: ${conflictingRoute.errors.join(', ')}`);
  }
  
  // Test valid multiple trains sharing revenue centers but not track
  // PRR can run from T20 to T10 (PRR has station at T20), uses different track than existing T10->T15 route
  const validMultipleTrains = validateRoute(graph, ['t20', 't10'], '2-train', 'PRR', existingRoutes);
  console.log(`Valid multiple trains (different track): ${validMultipleTrains.isValid ? 'VALID' : 'INVALID'}`);
  if (validMultipleTrains.isValid) {
    console.log(`  Revenue: $${validMultipleTrains.revenue} (T20: $20 + T10: $10)`);
    console.log(`  Note: Different train using different track segments (T20->T10 vs existing T10->T15)`);
  } else {
    console.log(`  Error: ${validMultipleTrains.errors.join(', ')}`);
  }
  
  console.log('\n✅ Enhanced test completed successfully!');
}

export function runSimpleTest(): void {
  console.log('🧪 Running Simple Map Graph Test...\n');
  
  // Create test graph
  let graph = createTestGraph();
  console.log('✅ Created test graph with 5 revenue centers');
  
  // Add some connections
  graph = addConnection(graph, 't10', 'c50');
  graph = addConnection(graph, 'c50', 't25');
  console.log('✅ Added connections: t10 -> c50 -> t25');
  
  // Test route finding
  const routes = findRoutes(graph, 't10', 4);
  console.log(`✅ Found ${routes.length} routes from t10:`);
  
  routes.forEach(route => {
    console.log(`  ${route.path.join(' -> ')} = $${route.revenue}`);
  });
  
  console.log('\n✅ Test completed successfully!');
}
