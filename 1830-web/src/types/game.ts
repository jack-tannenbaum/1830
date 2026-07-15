// Legacy types retained solely for the station/tile/map experiment code
// paths that have not yet been migrated to the engine model. All obsolete
// financial models (Player.certificates, Corporation.playerShares, ipoShares,
// bankShares, floated/isFloated legacy fields, AuctionState, StockAction,
// GameAction, TurnInfo, ConnectedPlayer, PhaseConfig, GamePhase, RoundType,
// etc.) have been removed. The engine now owns those shapes under
// src/engine/model.ts.

export interface Point {
  x: number;
  y: number;
}

export interface Station {
  id: string;
  position: { x: number; y: number };
  type: "city" | "town";
  assignedCorporation?: string;
  isOccupied: boolean;
}

// Minimal corporation shape used only by the station experiment code
// (utils/stationManager.ts, components/StationTest.tsx, components/TileRenderer.tsx).
// The authoritative corporation model is CorporationState in src/engine/model.ts.
export interface Corporation {
  id: string;
  name: string;
  abbreviation: string;
  color: string;
  stations: string[];
  isFloated: boolean;
}

export interface TileWithStations {
  tileId: string;
  stations: Station[];
  placedCorporations: string[];
}
