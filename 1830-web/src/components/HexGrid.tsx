import React, { useMemo } from 'react';
import { HexCoordinate } from '../types/mapGraph';
import { hexToString, getNeighbors, hexesInRadius } from '../utils/hexCoordinates';

interface HexGridProps {
  centerHex?: HexCoordinate;
  radius?: number;
  hexSize?: number;
  showCoordinates?: boolean;
  onHexClick?: (hex: HexCoordinate) => void;
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
  highlightedHexes = [],
  children,
  seed = 0
}) => {
  // Calculate hex dimensions
  const width = hexSize * 2;
  const height = Math.sqrt(3) * hexSize;

  // Get all hexes in the specified radius
  const hexes = hexesInRadius(centerHex, radius);

  // Generate cities and towns for the hexes
  const hexFeatures = useMemo(() => {
    const features = new Map<string, 'city' | 'town'>();
    
    // Create a seeded random number generator
    const seededRandom = (seed: number) => {
      let x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    
    hexes.forEach((hex, index) => {
      const hexKey = hexToString(hex);
      // Create unique seed for each hex based on position and global seed
      const hexSeed = seed * 1000 + hex.q * 37 + hex.r * 73 + hex.s * 97 + index;
      const random = seededRandom(hexSeed);
      
      if (random < 0.10) {
        features.set(hexKey, 'city');
      } else if (random < 0.25) {
        features.set(hexKey, 'town');
      }
      // 75% remain as white space (no feature)
    });
    
    return features;
  }, [hexes, seed]);

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
          }
          // Cities and towns will remain white but have dots added
          
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
                  } else {
                    hoverColor = '#f5f5f5';
                  }
                  e.currentTarget.style.fill = hoverColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.fill = fillColor;
                }}
              />
              
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
              {feature === 'town' && (
                <circle
                  cx={pixelPos.x}
                  cy={pixelPos.y - 8}
                  r="3"
                  fill="#000"
                  style={{ pointerEvents: 'none' }}
                />
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
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           <div style={{ width: '16px', height: '16px', backgroundColor: '#ffffff', border: '1px solid #666' }}></div>
           <span>White Space (75%)</span>
         </div>
       </div>
    </div>
  );
};

export default HexGrid;
