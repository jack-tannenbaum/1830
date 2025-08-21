import React, { useState } from 'react';
import HexGrid from './HexGrid';
import { HexCoordinate } from '../types/mapGraph';
import { hexToString } from '../utils/hexCoordinates';

const HexGridTest: React.FC = () => {
  const [selectedHex, setSelectedHex] = useState<HexCoordinate | null>(null);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [mapSeed, setMapSeed] = useState(0);

  const handleHexClick = (hex: HexCoordinate) => {
    setSelectedHex(hex);
  };

  const regenerateMap = () => {
    setMapSeed(prev => prev + 1);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🧪 Hexagonal Grid Test</h2>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <label>
          <input
            type="checkbox"
            checked={showCoordinates}
            onChange={(e) => setShowCoordinates(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          Show Coordinates
        </label>
        
        <button
          onClick={regenerateMap}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🎲 Regenerate Map
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        {selectedHex && (
          <div>
            <strong>Selected Hex:</strong> {hexToString(selectedHex)}
          </div>
        )}
      </div>

      <div style={{ 
        width: '800px', 
        height: '600px', 
        border: '2px solid #333',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <HexGrid
          centerHex={{ q: 0, r: 0, s: 0 }}
          radius={4}
          hexSize={35}
          showCoordinates={showCoordinates}
          onHexClick={handleHexClick}
          highlightedHexes={[]}
          seed={mapSeed}
        />
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Instructions:</h3>
        <ul>
          <li>Click on any hex to select it and see its coordinates</li>
          <li>Yellow hex is the center (0,0,0)</li>
          <li>Toggle coordinates to see/hide hex coordinates</li>
          <li>Click "Regenerate Map" to create a new random distribution of cities and towns</li>
        </ul>
      </div>
    </div>
  );
};

export default HexGridTest;
