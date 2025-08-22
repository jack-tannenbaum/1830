import React, { useMemo, useState } from 'react';
import { HexCoordinate } from '../types/mapGraph';
import { hexToString, getNeighbors, hexesInRadius } from '../utils/hexCoordinates';
import { ALL_TILES } from '../types/tiles';
import { getSidePosition } from '../utils/hexUtils';
import { useColors } from '../styles/colors';

interface HexGridProps {
  centerHex?: HexCoordinate;
  radius?: number;
  hexSize?: number;
  showCoordinates?: boolean;
  onHexClick?: (hex: HexCoordinate) => void;
  onHexHover?: (hex: HexCoordinate | null) => void;
  onHexFeaturesChange?: (features: Map<string, 'city' | 'town' | 'two-towns' | 'B' | '2-city' | 'NYC'>) => void;
  highlightedHexes?: HexCoordinate[];
  children?: React.ReactNode;
  seed?: number; // Add seed prop to control regeneration
}

const HexGrid: React.FC<HexGridProps> = ({
  centerHex = { q: 0, r: 0, s: 0 },
  radius = 5,
  hexSize = 8,
  showCoordinates = false,
  onHexClick,
  onHexHover,
  onHexFeaturesChange,
  highlightedHexes = [],
  children,
  seed = 0
}) => {
  const colors = useColors();
  
  // Calculate hex dimensions
  const width = hexSize * 2;
  const height = Math.sqrt(3) * hexSize;

  // Get all hexes in the specified radius
  const hexes = hexesInRadius(centerHex, radius);

  // Generate cities and towns for the hexes
  const hexFeatures = useMemo(() => {
    const features = new Map<string, 'city' | 'town' | 'two-towns' | 'B' | '2-city' | 'NYC'>();
    
    // Create a seeded random number generator
    const seededRandom = (seed: number) => {
      let x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    
    let bTileCount = 0;
    let twoCityCount = 0;
    let nycPlaced = false;
    
    // First, place NYC tile (always one per board)
    const nycHexIndex = Math.floor(seededRandom(seed * 1000) * hexes.length);
    const nycHex = hexes[nycHexIndex];
    const nycHexKey = hexToString(nycHex);
    features.set(nycHexKey, 'NYC');
    nycPlaced = true;
    
    hexes.forEach((hex, index) => {
      const hexKey = hexToString(hex);
      
      // Skip if this is the NYC hex
      if (hexKey === nycHexKey) {
        return;
      }
      
      // Create unique seed for each hex based on position and global seed
      const hexSeed = seed * 1000 + hex.q * 37 + hex.r * 73 + hex.s * 97 + index;
      const random = seededRandom(hexSeed);
      
      if (random < 0.02) {
        // Place 2-city tiles (2% chance, up to 3 per board)
        if (twoCityCount < 3) {
          features.set(hexKey, '2-city');
          twoCityCount++;
        } else if (random < 0.05) {
          features.set(hexKey, 'two-towns');
        } else if (random < 0.15) {
          features.set(hexKey, 'city');
        } else if (random < 0.30) {
          features.set(hexKey, 'town');
        }
      } else if (random < 0.03) {
        // Place B tiles (3% chance, up to 2 per board)
        if (bTileCount < 2) {
          features.set(hexKey, 'B');
          bTileCount++;
        } else if (random < 0.05) {
          features.set(hexKey, 'two-towns');
        } else if (random < 0.15) {
          features.set(hexKey, 'city');
        } else if (random < 0.30) {
          features.set(hexKey, 'town');
        }
      } else if (random < 0.05) {
        features.set(hexKey, 'two-towns');
      } else if (random < 0.15) {
        features.set(hexKey, 'city');
      } else if (random < 0.30) {
        features.set(hexKey, 'town');
      }
      // 70% remain as white space (no feature)
    });
    
    return features;
  }, [hexes, seed]);

  // Notify parent of hex features changes
  React.useEffect(() => {
    onHexFeaturesChange?.(hexFeatures);
  }, [hexFeatures, onHexFeaturesChange]);

  // Convert hex coordinate to pixel position
  const hexToPixel = (hex: HexCoordinate) => {
    // For pointy-top hexagons with cube coordinates (q,r,s)
    // Standard formula for axial coordinates (q,r) to pixel coordinates
    const x = hexSize * (Math.sqrt(3) * hex.q + Math.sqrt(3) / 2 * hex.r);
    const y = hexSize * (3 / 2 * hex.r);
    return { x, y };
  };

  // Generate hex path points
  const getHexPoints = (centerX: number, centerY: number, size: number) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      // Add Math.PI/6 (30 degrees) to rotate the hexagon to pointy-top
      const angle = (i * Math.PI) / 3 + Math.PI / 6;
      const x = centerX + size * Math.cos(angle);
      const y = centerY + size * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  // Check if hex is highlighted
  const isHighlighted = (hex: HexCoordinate) => {
    return highlightedHexes.some(h => 
      h.q === hex.q && h.r === hex.r && h.s === hex.s
    );
  };

  // Get neighbors for hover effect
  const getNeighborHexes = (hex: HexCoordinate) => {
    return getNeighbors(hex);
  };

  // Render NYC tile track connections
  const renderNYCTrackConnections = (pixelPos: { x: number; y: number }, size: number) => {
    // NYC tile has two cities with tracks to A and D sides
    // Using the same side mapping as TileRenderer: A=0, B=1, C=2, D=3, E=4, F=5
    const centerX = pixelPos.x;
    const centerY = pixelPos.y;
    
    const aPos = getSidePosition('A', size, centerX, centerY, size); // A side (top-right)
    const dPos = getSidePosition('D', size, centerX, centerY, size); // D side (top-left)
    
    // City positions (like 2-city tiles)
    const upperCityX = centerX - 3; // Upper city (top-left area)
    const upperCityY = centerY - 12;
    const lowerCityX = centerX + 3; // Lower city (bottom-right area)
    const lowerCityY = centerY + 10;
    
    // Create tracks from upper city to D side and lower city to A side
    return (
      <path
        d={`M ${upperCityX} ${upperCityY} L ${dPos.x} ${dPos.y} M ${lowerCityX} ${lowerCityY} L ${aPos.x} ${aPos.y}`}
        stroke="#333"
        strokeWidth="3"
        fill="none"
        style={{ pointerEvents: 'none' }}
      />
    );
  };

  // Render B tile track connections
  const renderBTileConnections = (pixelPos: { x: number; y: number }, size: number) => {
    // B tile connects B to D sides with straight lines into the city
    // Using the same side mapping as TileRenderer: A=0, B=1, C=2, D=3, E=4, F=5
    const centerX = pixelPos.x;
    const centerY = pixelPos.y;
    
    const bPos = getSidePosition('B', size, centerX, centerY, size); // B side
    const dPos = getSidePosition('D', size, centerX, centerY, size); // D side
    
    // City position (slightly above center)
    const cityX = centerX;
    const cityY = centerY - 8;
    
    // Create straight lines from B side to city and from city to D side
    return (
      <path
        d={`M ${bPos.x} ${bPos.y} L ${cityX} ${cityY} L ${dPos.x} ${dPos.y}`}
        stroke="#333"
        strokeWidth="3"
        fill="none"
        style={{ pointerEvents: 'none' }}
      />
    );
  };

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%',
      overflow: 'auto'
    }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`${-radius * hexSize * Math.sqrt(3) * 1.5} ${-radius * hexSize * 2} ${radius * hexSize * Math.sqrt(3) * 3} ${radius * hexSize * 4}`}
        style={{ 
          background: '#f0f0f0',
          border: '1px solid #ccc'
        }}
      >
        {/* Render hexes */}
        {hexes.map((hex) => {
          const pixelPos = hexToPixel(hex);
          const hexPoints = getHexPoints(pixelPos.x, pixelPos.y, hexSize);
          const isHighlightedHex = isHighlighted(hex);
          const isCenter = hex.q === centerHex.q && hex.r === centerHex.r && hex.s === centerHex.s;
          
          const hexKey = hexToString(hex);
          const feature = hexFeatures.get(hexKey);
          
          // Determine fill color based on feature type
          let fillColor = '#ffffff'; // default white space
          if (isCenter) {
            fillColor = '#ffeb3b'; // yellow for center
          } else if (isHighlightedHex) {
            fillColor = '#4caf50'; // green for highlighted
          } else if (feature === 'B') {
                      fillColor = colors.tile.yellow; // yellow for B tiles
        } else if (feature === '2-city') {
          fillColor = colors.tile.yellow; // yellow for 2-city tiles
        } else if (feature === 'NYC') {
          fillColor = colors.tile.yellow; // yellow for NYC tiles
          }
          // Cities, towns, and two-towns will remain white but have dots added
          
          return (
            <g key={hexKey}>
              {/* Hex background */}
              <polygon
                points={hexPoints}
                fill={fillColor}
                stroke="#666"
                strokeWidth="1"
                style={{ cursor: 'pointer' }}
                onClick={() => onHexClick?.(hex)}
                onMouseEnter={(e) => {
                  let hoverColor = fillColor;
                  if (isCenter) {
                    hoverColor = '#fff59d';
                  } else if (isHighlightedHex) {
                    hoverColor = '#66bb6a';
                  } else if (feature === 'B') {
                    hoverColor = '#fde68a';
                  } else if (feature === '2-city') {
                    hoverColor = '#fde68a';
                  } else if (feature === 'NYC') {
                    hoverColor = '#fde68a';
                  } else {
                    hoverColor = '#f5f5f5';
                  }
                  e.currentTarget.style.fill = hoverColor;
                  onHexHover?.(hex);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.fill = fillColor;
                  onHexHover?.(null);
                }}
              />
              
              {/* B tile track connections */}
              {feature === 'B' && renderBTileConnections(pixelPos, hexSize)}
              
              {/* NYC tile track connections */}
              {feature === 'NYC' && renderNYCTrackConnections(pixelPos, hexSize)}
              
              {/* City and Town dots */}
              {feature === 'city' && (
                <circle
                  cx={pixelPos.x}
                  cy={pixelPos.y - 8}
                  r="6"
                  fill="none"
                  stroke="#000"
                  strokeWidth="2"
                  style={{ pointerEvents: 'none' }}
                />
              )}
              {feature === 'B' && (
                <circle
                  cx={pixelPos.x}
                  cy={pixelPos.y - 8}
                  r="6"
                  fill="none"
                  stroke="#000"
                  strokeWidth="2"
                  style={{ pointerEvents: 'none' }}
                />
              )}
              {feature === '2-city' && (
                <>
                  <circle
                    cx={pixelPos.x - 3}
                    cy={pixelPos.y - 12}
                    r="6"
                    fill="none"
                    stroke="#000"
                    strokeWidth="2"
                    style={{ pointerEvents: 'none' }}
                  />
                  <circle
                    cx={pixelPos.x + 3}
                    cy={pixelPos.y + 10}
                    r="6"
                    fill="none"
                    stroke="#000"
                    strokeWidth="2"
                    style={{ pointerEvents: 'none' }}
                  />
                </>
              )}
              {feature === 'NYC' && (
                <>
                  <circle
                    cx={pixelPos.x - 3}
                    cy={pixelPos.y - 12}
                    r="6"
                    fill="none"
                    stroke="#000"
                    strokeWidth="2"
                    style={{ pointerEvents: 'none' }}
                  />
                  <circle
                    cx={pixelPos.x + 3}
                    cy={pixelPos.y + 10}
                    r="6"
                    fill="none"
                    stroke="#000"
                    strokeWidth="2"
                    style={{ pointerEvents: 'none' }}
                  />
                </>
              )}
              {feature === 'town' && (
                <circle
                  cx={pixelPos.x}
                  cy={pixelPos.y - 8}
                  r="3"
                  fill="#000"
                  style={{ pointerEvents: 'none' }}
                />
              )}
              {feature === 'two-towns' && (
                <>
                  <circle
                    cx={pixelPos.x - 3}
                    cy={pixelPos.y - 12}
                    r="3"
                    fill="#000"
                    style={{ pointerEvents: 'none' }}
                  />
                  <circle
                    cx={pixelPos.x + 3}
                    cy={pixelPos.y + 10}
                    r="3"
                    fill="#000"
                    style={{ pointerEvents: 'none' }}
                  />
                </>
              )}
              
              {/* B tile label */}
              {feature === 'B' && (
                <text
                  x={pixelPos.x}
                  y={pixelPos.y + 15}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill="#333"
                  style={{ pointerEvents: 'none' }}
                >
                  B
                </text>
              )}
              
              {/* Coordinate label */}
              {showCoordinates && (
                <text
                  x={pixelPos.x}
                  y={pixelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="8"
                  fill="#333"
                  style={{ pointerEvents: 'none' }}
                >
                  {`${hex.q},${hex.r},${hex.s}`}
                </text>
              )}
            </g>
          );
        })}
        
        {/* Render children (revenue centers, track tiles, etc.) */}
        {children}
      </svg>
      
      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '12px',
        border: '1px solid #ccc'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '16px', height: '16px', position: 'relative', backgroundColor: colors.tile.yellow, border: '1px solid #666' }}>
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              width: '12px', 
              height: '12px', 
              border: '2px solid #000', 
              borderRadius: '50%',
              backgroundColor: 'transparent'
            }}></div>
            <text style={{ 
              position: 'absolute', 
              bottom: '-2px', 
              right: '-2px', 
              fontSize: '8px', 
              fontWeight: 'bold' 
            }}>B</text>
          </div>
          <span>B Tiles (on Cities)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '16px', height: '16px', position: 'relative', backgroundColor: colors.tile.yellow, border: '1px solid #666' }}>
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '40%', 
              transform: 'translate(-50%, -50%)',
              width: '12px', 
              height: '12px', 
              border: '2px solid #000', 
              borderRadius: '50%',
              backgroundColor: 'transparent'
            }}></div>
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '60%', 
              transform: 'translate(-50%, -50%)',
              width: '12px', 
              height: '12px', 
              border: '2px solid #000', 
              borderRadius: '50%',
              backgroundColor: 'transparent'
            }}></div>
          </div>
          <span>2-City Tiles</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '16px', height: '16px', position: 'relative', backgroundColor: colors.tile.yellow, border: '1px solid #666' }}>
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '40%', 
              transform: 'translate(-50%, -50%)',
              width: '12px', 
              height: '12px', 
              border: '2px solid #000', 
              borderRadius: '50%',
              backgroundColor: 'transparent'
            }}></div>
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '60%', 
              transform: 'translate(-50%, -50%)',
              width: '12px', 
              height: '12px', 
              border: '2px solid #000', 
              borderRadius: '50%',
              backgroundColor: 'transparent'
            }}></div>
            <text style={{ 
              position: 'absolute', 
              bottom: '-2px', 
              right: '-2px', 
              fontSize: '8px', 
              fontWeight: 'bold' 
            }}>NYC</text>
          </div>
          <span>NYC Tiles</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '16px', height: '16px', position: 'relative', backgroundColor: '#ffffff', border: '1px solid #666' }}>
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              width: '12px', 
              height: '12px', 
              border: '2px solid #000', 
              borderRadius: '50%',
              backgroundColor: 'transparent'
            }}></div>
          </div>
          <span>Cities (10%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '16px', height: '16px', position: 'relative', backgroundColor: '#ffffff', border: '1px solid #666' }}>
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              width: '6px', 
              height: '6px', 
              backgroundColor: '#000', 
              borderRadius: '50%'
            }}></div>
          </div>
          <span>Towns (15%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '16px', height: '16px', position: 'relative', backgroundColor: '#ffffff', border: '1px solid #666' }}>
            <div style={{ 
              position: 'absolute', 
              top: '30%', 
              left: '40%', 
              transform: 'translate(-50%, -50%)',
              width: '6px', 
              height: '6px', 
              backgroundColor: '#000', 
              borderRadius: '50%'
            }}></div>
            <div style={{ 
              position: 'absolute', 
              top: '75%', 
              left: '60%', 
              transform: 'translate(-50%, -50%)',
              width: '6px', 
              height: '6px', 
              backgroundColor: '#000', 
              borderRadius: '50%'
            }}></div>
          </div>
          <span>Two Towns (5%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#ffffff', border: '1px solid #666' }}></div>
          <span>White Space (70%)</span>
        </div>
      </div>
    </div>
  );
};

export default HexGrid;
