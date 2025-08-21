import React from 'react';
import { runSimpleTest, runEnhancedTest } from '../utils/mapGraphTest';

const MapGraphTest: React.FC = () => {
  const handleRunSimpleTest = () => {
    console.clear();
    runSimpleTest();
  };

  const handleRunEnhancedTest = () => {
    console.clear();
    runEnhancedTest();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🧪 Hexagonal Map Graph Test Suite</h2>
      <p>Click the buttons below to run hexagonal map graph tests in the console.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={handleRunSimpleTest}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Run Simple Test
        </button>
        
        <button 
          onClick={handleRunEnhancedTest}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Run Enhanced Test
        </button>
      </div>

      <h3>Test Layout (Hexagonal Grid)</h3>
      <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
{`    [0,-1,1] [1,-1,0] [2,-2,0]
[-1,1,0] [0,0,0] [1,-1,0] [2,-2,0]
    [-1,0,1] [0,1,-1] [1,0,-1]

Legend:
- (0,0,0): Center hex - Town 10 ($10)
- (1,-1,0): East - Town 15 ($15)  
- (2,-2,0): Far East - Town 20 ($20)
- (0,1,-1): South - City 50 ($50)
- (-1,1,0): West - City 75 ($75)
- (1,0,-1): Southeast - Town 30 ($30)

Hexagonal coordinates: (q,r,s) where q + r + s = 0
Directions: Right, Down-right, Down-left, Left, Up-left, Up-right`}
      </pre>

      <h3>What the tests validate:</h3>
      
      <h4>Simple Test:</h4>
      <ul>
        <li>✅ Graph creation with revenue centers</li>
        <li>✅ Adding track connections</li>
        <li>✅ Route finding between connected centers</li>
        <li>✅ Revenue calculation for routes</li>
      </ul>

      <h4>Enhanced Test:</h4>
      <ul>
        <li>✅ Track tile placement and validation</li>
        <li>✅ Automatic connection creation when tiles are placed</li>
        <li>✅ Station token placement and management</li>
        <li>✅ Route validation for specific train types</li>
        <li>✅ Track infrastructure modeling (tiles create connections)</li>
        <li>✅ Route running along existing track connections</li>
      </ul>

      <h3>Key Concepts:</h3>
      <ul>
        <li><strong>Hexagonal Grid</strong>: Uses cube coordinates (q,r,s) where q + r + s = 0</li>
        <li><strong>Track Tiles</strong>: Placed on hexes to create track infrastructure with 6-direction connectivity</li>
        <li><strong>Track Connections</strong>: Created automatically when track tiles are placed between revenue centers</li>
        <li><strong>Routes</strong>: Run along existing track connections between revenue centers</li>
        <li><strong>Station Tokens</strong>: Allow corporations to start routes from specific revenue centers</li>
        <li><strong>Hexagonal Movement</strong>: Equal distance to all 6 neighbors, natural for train tracks</li>
      </ul>
    </div>
  );
};

export default MapGraphTest;
