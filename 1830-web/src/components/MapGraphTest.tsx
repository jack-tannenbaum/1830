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
      <h2>🧪 Map Graph Test Suite</h2>
      <p>Click the buttons below to run map graph tests in the console.</p>
      
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

      <h3>Test Layout (3x3 Grid)</h3>
      <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
{`[0,0] [1,0] [2,0]  - T10  E   T15
[0,1] [1,1] [2,1]  - E   C50 E  
[0,2] [1,2] [2,2]  - T20 E   T25

Legend:
- T10, T15, T20, T25: Towns with revenue values
- C50: City with $50 revenue  
- E: Empty squares (no revenue centers)`}
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
        <li><strong>Track Tiles</strong>: Placed on hexes to create track infrastructure</li>
        <li><strong>Track Connections</strong>: Created automatically when track tiles are placed</li>
        <li><strong>Routes</strong>: Run along existing track connections between revenue centers</li>
        <li><strong>Station Tokens</strong>: Allow corporations to start routes from specific revenue centers</li>
      </ul>
    </div>
  );
};

export default MapGraphTest;
