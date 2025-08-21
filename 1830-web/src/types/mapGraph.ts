// === Core Map Graph Types ===

export interface HexCoordinate {
  q: number; // cube coordinate q
  r: number; // cube coordinate r  
  s: number; // cube coordinate s (q + r + s = 0)
}

// Legacy interface for backward compatibility during migration
export interface GridCoordinate {
  x: number;
  y: number;
}

export interface RevenueCenter {
  id: string;
  name: string;
  coordinate: HexCoordinate;
  revenue: number;
  type: 'city' | 'town';
  stationTokens: string[]; // corporation IDs that have stations here
}

export interface TrackTile {
  id: string;
  type: 'straight' | 'curve' | 'cross' | 'diagonal';
  color: 'yellow' | 'green' | 'brown' | 'gray';
  exits: HexCoordinate[]; // relative hex coordinates of track exits
  cost: number;
  isPlaced: boolean;
}

export interface TrackConnection {
  from: string; // revenue center ID
  to: string; // revenue center ID
  hexesTraversed: HexCoordinate[]; // hexes this track passes through
  trackTiles: string[]; // track tile IDs used in this connection
  isActive: boolean;
}

export interface GameMapGraph {
  gridSize: {
    width: number;
    height: number;
  };
  revenueCenters: Record<string, RevenueCenter>;
  trackTiles: Record<string, TrackTile>; // hex coordinate string -> track tile
  connections: TrackConnection[];
}

// Route validation result
export interface RouteValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  revenue: number;
  path: string[]; // sequence of revenue center IDs
  trainLength: number; // how many revenue centers this route visits
  hexesTraversed: HexCoordinate[]; // hexes this route passes through
}

// Train route definition - a route run along track connections
export interface TrainRoute {
  id: string;
  corporationId: string;
  trainType: string;
  path: string[];
  revenue: number;
  hexesTraversed: HexCoordinate[];
}

// Map layout for testing
export interface MapLayout {
  revenueCenters: RevenueCenter[];
  initialTrackTiles: Array<{
    coordinate: HexCoordinate;
    tileId: string;
  }>;
}
