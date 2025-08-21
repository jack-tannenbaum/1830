import React from 'react';
import { TileDefinition } from '../types/tiles';

interface TileRendererProps {
  tile: TileDefinition;
  size?: number;
  showId?: boolean;
  highlight?: boolean;
}

const TileRenderer: React.FC<TileRendererProps> = ({ 
  tile, 
  size = 40, 
  showId = true,
  highlight = false 
}) => {
  // Calculate hex points for the tile
  const getHexPoints = () => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 + Math.PI / 6; // Pointy-top orientation
      const x = size / 2 + (size / 2) * Math.cos(angle);
      const y = size / 2 + (size / 2) * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  // Get position for each side (A-F) - center of the side, not the corner
  const getSidePosition = (side: string) => {
    const sideIndex = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5 }[side] || 0;
    
    // Calculate the midpoint of each hex side
    // Get the two corner points for this side
    const corner1Angle = (sideIndex * Math.PI) / 3 + Math.PI / 6;
    const corner2Angle = ((sideIndex + 1) * Math.PI) / 3 + Math.PI / 6;
    
    const radius = size / 2;
    const corner1 = {
      x: size / 2 + radius * Math.cos(corner1Angle),
      y: size / 2 + radius * Math.sin(corner1Angle)
    };
    const corner2 = {
      x: size / 2 + radius * Math.cos(corner2Angle),
      y: size / 2 + radius * Math.sin(corner2Angle)
    };
    
    // Return the midpoint between the two corners
    return {
      x: (corner1.x + corner2.x) / 2,
      y: (corner1.y + corner2.y) / 2
    };
  };

  // Get revenue center positions based on tile requirements
  const getRevenueCenterPositions = () => {
    const centers: { x: number; y: number; type: string }[] = [];
    
    switch (tile.requires.type) {
      case 'city':
        if (tile.color === 'yellow') {
          // Yellow city tiles have 1 station
          centers.push({ x: size / 2, y: size / 2, type: 'city' });
        } else {
          // Green and brown city tiles have 2 stations
          centers.push(
            { x: size / 2 - 6, y: size / 2, type: 'city' },
            { x: size / 2 + 6, y: size / 2, type: 'city' }
          );
        }
        break;
      case 'B':
        // B tiles have a city in the center
        centers.push({ x: size / 2, y: size / 2, type: 'city' });
        break;
      case '1 town':
        centers.push({ x: size / 2, y: size / 2, type: 'town' });
        break;
      case '2 town':
      case '2 towns':
        centers.push(
          { x: size / 2 - 3, y: size / 2 - 6, type: 'town' },
          { x: size / 2 + 3, y: size / 2 + 5, type: 'town' }
        );
        break;
    }
    
    return centers;
  };

  // Generate track paths that go through revenue centers
  const getTrackPaths = () => {
    const paths: string[] = [];
    const centers = getRevenueCenterPositions();
    
    // Helper function to check if two sides are directly opposite
    const areOpposite = (side1: string, side2: string) => {
      const sideMap: Record<string, string> = {
        'A': 'D', 'B': 'E', 'C': 'F',
        'D': 'A', 'E': 'B', 'F': 'C'
      };
      return sideMap[side1] === side2;
    };
    
    // Special handling for specific tiles
    if (tile.id === '14') {
      // Tile 14: X pattern centered at the circle
      const center = { x: size / 2, y: size / 2 };
      const aPos = getSidePosition('A');
      const cPos = getSidePosition('C');
      const dPos = getSidePosition('D');
      const fPos = getSidePosition('F');
      
      // A-C line through center
      paths.push(`M ${aPos.x} ${aPos.y} L ${center.x} ${center.y} L ${cPos.x} ${cPos.y}`);
      // D-F line through center
      paths.push(`M ${dPos.x} ${dPos.y} L ${center.x} ${center.y} L ${fPos.x} ${fPos.y}`);
      return paths;
    }
    
    if (tile.id === '15') {
      // Tile 15: K pattern centered at the circle
      const center = { x: size / 2, y: size / 2 };
      const aPos = getSidePosition('A');
      const bPos = getSidePosition('B');
      const cPos = getSidePosition('C');
      const dPos = getSidePosition('D');
      
      // A-D line through center
      paths.push(`M ${aPos.x} ${aPos.y} L ${center.x} ${center.y} L ${dPos.x} ${dPos.y}`);
      // B-C line through center
      paths.push(`M ${bPos.x} ${bPos.y} L ${center.x} ${center.y} L ${cPos.x} ${cPos.y}`);
      return paths;
    }
    
    if (tile.id === '63') {
      // Tile 63: All sides connect to city center (hub)
      const center = { x: size / 2, y: size / 2 };
      const sides = ['A', 'B', 'C', 'D', 'E', 'F'];
      
      sides.forEach(side => {
        const sidePos = getSidePosition(side);
        paths.push(`M ${sidePos.x} ${sidePos.y} L ${center.x} ${center.y}`);
      });
      
      return paths;
    }
    
    if (tile.id === '61') {
      // Tile 61: A, B, D, F connect to city center with straight lines
      const center = { x: size / 2, y: size / 2 };
      const sides = ['A', 'B', 'D', 'F'];
      
      sides.forEach(side => {
        const sidePos = getSidePosition(side);
        paths.push(`M ${sidePos.x} ${sidePos.y} L ${center.x} ${center.y}`);
      });
      
      return paths;
    }
    
    // Handle regular connection pairs
    tile.connects.forEach((connection, index) => {
      const fromPos = getSidePosition(connection.from);
      const toPos = getSidePosition(connection.to);
      
      // If there's a revenue center, make the track go through it
      if (centers[index]) {
        const center = centers[index];
        paths.push(`M ${fromPos.x} ${fromPos.y} Q ${center.x} ${center.y} ${toPos.x} ${toPos.y}`);
      } else {
        // Check if sides are directly opposite
        if (areOpposite(connection.from, connection.to)) {
          // Straight line for opposite sides (A-D, B-E, C-F)
          paths.push(`M ${fromPos.x} ${fromPos.y} L ${toPos.x} ${toPos.y}`);
        } else {
          // Add a curve for non-opposite connections
          const centerX = size / 2;
          const centerY = size / 2;
          
          // Create a control point that's offset from the center for a gentle curve
          const midX = (fromPos.x + toPos.x) / 2;
          const midY = (fromPos.y + toPos.y) / 2;
          
          // Calculate offset direction (perpendicular to the line)
          const dx = toPos.x - fromPos.x;
          const dy = toPos.y - fromPos.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          
          // Perpendicular vector (rotated 90 degrees)
          const perpX = -dy / length;
          const perpY = dx / length;
          
          // Offset the control point by a small amount
          const offset = size * 0.15; // Adjust this for more/less curve
          const controlX = midX + perpX * offset;
          const controlY = midY + perpY * offset;
          
          paths.push(`M ${fromPos.x} ${fromPos.y} Q ${controlX} ${controlY} ${toPos.x} ${toPos.y}`);
        }
      }
    });
    
    return paths;
  };

  const hexPoints = getHexPoints();
  const trackPaths = getTrackPaths();
  const revenueCenters = getRevenueCenterPositions();

  return (
    <div style={{ 
      position: 'relative', 
      width: size, 
      height: size,
      border: highlight ? '2px solid #ff6b6b' : '1px solid #ccc',
      borderRadius: '4px',
      backgroundColor: highlight ? '#fff5f5' : '#fff'
    }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0 }}>
        {/* Hex background */}
        <polygon
          points={hexPoints}
          fill={
            tile.color === 'yellow' ? '#fef3c7' : 
            tile.color === 'green' ? '#dcfce7' : 
            tile.color === 'brown' ? '#d97706' : 
            '#ffffff'
          }
          stroke="#666"
          strokeWidth="1"
        />
        
        {/* Track lines */}
        {trackPaths.map((path, index) => (
          <path
            key={index}
            d={path}
            stroke="#333"
            strokeWidth="2"
            fill="none"
          />
        ))}
        
        {/* Revenue centers */}
        {revenueCenters.map((center, index) => (
          <circle
            key={index}
            cx={center.x}
            cy={center.y}
            r={center.type === 'city' ? 4 : 2}
            fill={center.type === 'city' ? 'none' : '#000'}
            stroke={center.type === 'city' ? '#000' : 'none'}
            strokeWidth={center.type === 'city' ? 2 : 0}
          />
        ))}
      </svg>
      
      {/* Tile ID */}
      {showId && (
        <div style={{
          position: 'absolute',
          bottom: '2px',
          right: '2px',
          fontSize: '8px',
          fontWeight: 'bold',
          color: '#666',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '1px 2px',
          borderRadius: '2px'
        }}>
          {tile.id}
        </div>
      )}
      
      {/* Special labels for B and NYC tiles */}
      {(tile.id === 'B' || tile.id === 'NYC' || tile.id === '54' || tile.id === '62' || tile.id === '61') && (
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '25%',
          fontSize: '8px',
          fontWeight: 'bold',
          color: '#333',
          zIndex: 10
        }}>
          {tile.id === '54' || tile.id === '62' ? 'NYC' : tile.id === '61' ? 'B' : tile.id}
        </div>
      )}
    </div>
  );
};

export default TileRenderer;
