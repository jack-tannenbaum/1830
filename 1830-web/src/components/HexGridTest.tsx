import React, { useState } from 'react';
import HexGrid from './HexGrid';
import { HexCoordinate } from '../types/mapGraph';
import { hexToString } from '../utils/hexCoordinates';
import TileRenderer from './TileRenderer';
import { ALL_TILES, getPlayableTilesByColor, canPlaceTile } from '../types/tiles';

const HexGridTest: React.FC = () => {
  const [selectedHex, setSelectedHex] = useState<HexCoordinate | null>(null);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [mapSeed, setMapSeed] = useState(0);
  const [hoveredHex, setHoveredHex] = useState<HexCoordinate | null>(null);
  const [hexFeatures, setHexFeatures] = useState<Map<string, 'city' | 'town' | 'two-towns' | 'B' | '2-city' | 'NYC'>>(new Map());

  const handleHexClick = (hex: HexCoordinate) => {
    setSelectedHex(hex);
  };

  const handleHexHover = (hex: HexCoordinate | null) => {
    setHoveredHex(hex);
  };

  const handleHexFeaturesChange = (features: Map<string, 'city' | 'town' | 'two-towns' | 'B' | '2-city' | 'NYC'>) => {
    setHexFeatures(features);
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

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Hex Grid */}
        <div style={{ 
          width: '600px', 
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
            onHexHover={handleHexHover}
            onHexFeaturesChange={handleHexFeaturesChange}
            highlightedHexes={[]}
            seed={mapSeed}
          />
        </div>

        {/* Tile Library */}
        <div style={{ 
          width: '300px', 
          height: '600px', 
          border: '2px solid #333',
          borderRadius: '8px',
          padding: '10px',
          overflow: 'auto',
          backgroundColor: '#f8f9fa'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Tile Library</h3>
          
          {/* Get the feature of the hovered hex to determine eligible tiles */}
          {(() => {
            const hoveredFeature = hoveredHex ? hexFeatures.get(hexToString(hoveredHex)) : undefined;
            
            return (
              <div>
                {/* Yellow Tiles */}
                <h4 style={{ margin: '10px 0 8px 0', fontSize: '14px', color: '#92400e' }}>Yellow Tiles</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '15px' }}>
                  {getPlayableTilesByColor('yellow').map((tile) => {
                    const isEligible = hoveredHex ? canPlaceTile(tile, hoveredFeature) : false;
                    return (
                      <div key={tile.id} style={{ textAlign: 'center' }}>
                        <TileRenderer 
                          tile={tile} 
                          size={50} 
                          highlight={isEligible}
                        />
                        <div style={{ fontSize: '10px', marginTop: '2px' }}>
                          Qty: {tile.quantity}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Green Tiles */}
                <h4 style={{ margin: '10px 0 8px 0', fontSize: '14px', color: '#166534' }}>Green Tiles</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {getPlayableTilesByColor('green').map((tile) => {
                    const isEligible = hoveredHex ? canPlaceTile(tile, hoveredFeature) : false;
                    return (
                      <div key={tile.id} style={{ textAlign: 'center' }}>
                        <TileRenderer 
                          tile={tile} 
                          size={50} 
                          highlight={isEligible}
                        />
                        <div style={{ fontSize: '10px', marginTop: '2px' }}>
                          Qty: {tile.quantity}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Instructions:</h3>
        <ul>
          <li>Click on any hex to select it and see its coordinates</li>
          <li>Yellow hex is the center (0,0,0)</li>
          <li>Toggle coordinates to see/hide hex coordinates</li>
          <li>Click "Regenerate Map" to create a new random distribution of cities, towns, and B tiles</li>
          <li>B tiles (yellow hexes with B labels) are special starting tiles with B-C track connections</li>
        </ul>
      </div>
    </div>
  );
};

export default HexGridTest;
