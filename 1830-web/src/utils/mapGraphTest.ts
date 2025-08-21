import { createTestLayout, createEnhancedTestLayout } from './mapGraph';
import { findRoutes } from './mapGraph';
import { validateRoute } from './routeValidation';
import { hexToString, getNeighbors, hexDistance } from './hexCoordinates';

// === Test Functions ===

export function runSimpleTest(): string {
  console.log('🧪 Running Simple Hexagonal Map Test...');
  
  const layout = createTestLayout();
  const results: string[] = [];
  
  results.push('=== Simple Hexagonal Map Test ===');
  results.push(`Revenue Centers: ${Object.keys(layout.revenueCenters).length}`);
  results.push(`Track Tiles: ${Object.keys(layout.trackTiles).length}`);
  results.push(`Connections: ${layout.connections.length}`);
  
  // Test coordinate conversion
  results.push('\n--- Coordinate Tests ---');
  const testHex = { q: 1, r: -1, s: 0 };
  results.push(`Test hex: ${JSON.stringify(testHex)}`);
  results.push(`Hex string: ${hexToString(testHex)}`);
  
  // Test neighbors
  const neighbors = getNeighbors(testHex);
  results.push(`Neighbors of ${hexToString(testHex)}: ${neighbors.map(n => hexToString(n)).join(', ')}`);
  
  // Test distance
  const distance = hexDistance({ q: 0, r: 0, s: 0 }, { q: 2, r: -2, s: 0 });
  results.push(`Distance from (0,0,0) to (2,-2,0): ${distance}`);
  
  // Test route finding
  results.push('\n--- Route Finding Tests ---');
  const routes = findRoutes(layout, 't10', 3);
  results.push(`Routes from t10 (max length 3): ${routes.length}`);
  
  routes.forEach((route, index) => {
    results.push(`  Route ${index + 1}: ${route.path.join(' → ')} (Revenue: $${route.revenue})`);
  });
  
  // Test route validation
  results.push('\n--- Route Validation Tests ---');
  if (routes.length > 0) {
    const validation = validateRoute(layout, routes[0].path, '2-train', 'TEST_CORP', []);
    results.push(`Validation for first route: ${validation.isValid ? 'VALID' : 'INVALID'}`);
    if (!validation.isValid) {
      results.push(`  Errors: ${validation.errors.join(', ')}`);
    }
  }
  
  const output = results.join('\n');
  console.log(output);
  return output;
}

export function runEnhancedTest(): string {
  console.log('🧪 Running Enhanced Hexagonal Map Test...');
  
  const layout = createEnhancedTestLayout();
  const results: string[] = [];
  
  results.push('=== Enhanced Hexagonal Map Test ===');
  results.push(`Revenue Centers: ${Object.keys(layout.revenueCenters).length}`);
  results.push(`Track Tiles: ${Object.keys(layout.trackTiles).length}`);
  results.push(`Connections: ${layout.connections.length}`);
  
  // List all revenue centers with their coordinates
  results.push('\n--- Revenue Centers ---');
  Object.values(layout.revenueCenters).forEach(center => {
    results.push(`${center.name} (${center.id}): ${hexToString(center.coordinate)} - $${center.revenue}`);
  });
  
  // List all connections
  results.push('\n--- Track Connections ---');
  layout.connections.forEach((conn, index) => {
    const from = layout.revenueCenters[conn.from];
    const to = layout.revenueCenters[conn.to];
    results.push(`Connection ${index + 1}: ${from.name} → ${to.name}`);
    results.push(`  Hexes: ${conn.hexesTraversed.map(h => hexToString(h)).join(' → ')}`);
  });
  
  // Test route finding from multiple starting points
  results.push('\n--- Multi-Point Route Finding ---');
  const startPoints = ['t10', 't15', 'c50'];
  
  startPoints.forEach(startId => {
    const routes = findRoutes(layout, startId, 4);
    results.push(`Routes from ${startId} (max length 4): ${routes.length}`);
    
    // Show top 3 routes by revenue
    const topRoutes = routes
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);
    
    topRoutes.forEach((route, index) => {
      results.push(`  ${index + 1}. ${route.path.join(' → ')} (Revenue: $${route.revenue})`);
    });
  });
  
  // Test hex grid properties
  results.push('\n--- Hex Grid Properties ---');
  const centerHex = { q: 0, r: 0, s: 0 };
  const neighbors = getNeighbors(centerHex);
  results.push(`Center hex ${hexToString(centerHex)} has ${neighbors.length} neighbors:`);
  neighbors.forEach((neighbor, index) => {
    const direction = ['right', 'down-right', 'down-left', 'left', 'up-left', 'up-right'][index];
    results.push(`  ${direction}: ${hexToString(neighbor)}`);
  });
  
  // Test distance calculations
  results.push('\n--- Distance Calculations ---');
  const testPairs = [
    [{ q: 0, r: 0, s: 0 }, { q: 1, r: -1, s: 0 }],
    [{ q: 0, r: 0, s: 0 }, { q: 2, r: -2, s: 0 }],
    [{ q: 0, r: 0, s: 0 }, { q: 0, r: 1, s: -1 }]
  ];
  
  testPairs.forEach(([a, b]) => {
    const distance = hexDistance(a, b);
    results.push(`Distance from ${hexToString(a)} to ${hexToString(b)}: ${distance}`);
  });
  
  const output = results.join('\n');
  console.log(output);
  return output;
}

// === Test Layout Display ===

export function getTestLayout(): any {
  return {
    simple: createTestLayout(),
    enhanced: createEnhancedTestLayout()
  };
}

// === Hex Grid Concepts ===

export function getHexGridConcepts(): string {
  return `
=== Hexagonal Grid Concepts ===

1. Cube Coordinates (q, r, s):
   - q: horizontal axis
   - r: diagonal axis  
   - s: third axis (q + r + s = 0)
   - Example: (1, -1, 0) means q=1, r=-1, s=0

2. Six Directions:
   - Right: (1, -1, 0)
   - Down-right: (1, 0, -1)
   - Down-left: (0, 1, -1)
   - Left: (-1, 1, 0)
   - Up-left: (-1, 0, 1)
   - Up-right: (0, -1, 1)

3. Distance:
   - Manhattan distance: (|q1-q2| + |r1-r2| + |s1-s2|) / 2
   - Example: (0,0,0) to (2,-2,0) = (2+2+0)/2 = 2

4. Neighbors:
   - Each hex has exactly 6 neighbors
   - Add direction vectors to current position

5. Advantages over Square Grid:
   - More natural for train tracks
   - Equal distance to all neighbors
   - Better for route planning
   - Standard in 1830 and similar games
`;
}
