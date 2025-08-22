import { Station, Corporation, TileWithStations } from '../types/game';
import { TileDefinition, StationDefinition } from '../types/tiles';

export class StationManager {
  private tileStations: Map<string, TileWithStations> = new Map();
  private corporations: Map<string, Corporation> = new Map();

  // Initialize stations for a tile based on its definition
  initializeTileStations(tileId: string, tileDefinition: TileDefinition): void {
    const stations: Station[] = [];
    
    if (tileDefinition.stations) {
      // Use explicit station definitions
      tileDefinition.stations.forEach(stationDef => {
        stations.push({
          id: `${tileId}-${stationDef.id}`,
          position: stationDef.position,
          type: stationDef.type,
          assignedCorporation: undefined,
          isOccupied: false
        });
      });
    } else {
      // Fall back to implicit station generation based on tile requirements
      const implicitStations = this.generateImplicitStations(tileDefinition);
      implicitStations.forEach((station, index) => {
        stations.push({
          id: `${tileId}-station-${index}`,
          position: station.position,
          type: station.type,
          assignedCorporation: undefined,
          isOccupied: false
        });
      });
    }

    this.tileStations.set(tileId, {
      tileId,
      stations,
      placedCorporations: []
    });
  }

  // Generate implicit stations based on tile requirements (current system)
  private generateImplicitStations(tileDefinition: TileDefinition): StationDefinition[] {
    const stations: StationDefinition[] = [];
    
    switch (tileDefinition.requires.type) {
      case 'city':
        if (tileDefinition.color === 'yellow') {
          // Yellow city tiles have 1 station
          stations.push({
            id: 'center',
            position: { x: 0.5, y: 0.5 }, // Relative positions (0-1)
            type: 'city',
            maxCorporations: 1
          });
        } else {
          // Green and brown city tiles have 2 stations
          stations.push(
            {
              id: 'left',
              position: { x: 0.4, y: 0.5 },
              type: 'city',
              maxCorporations: 1
            },
            {
              id: 'right',
              position: { x: 0.6, y: 0.5 },
              type: 'city',
              maxCorporations: 1
            }
          );
        }
        break;
      case 'B':
        // B tiles have a city in the center
        stations.push({
          id: 'center',
          position: { x: 0.5, y: 0.5 },
          type: 'city',
          maxCorporations: 1
        });
        break;
      case 'NYC':
        // NYC tiles have two cities
        stations.push(
          {
            id: 'upper',
            position: { x: 0.4, y: 0.4 },
            type: 'city',
            maxCorporations: 1
          },
          {
            id: 'lower',
            position: { x: 0.6, y: 0.6 },
            type: 'city',
            maxCorporations: 1
          }
        );
        break;
      case '2-city':
        // 2-city tiles have two cities
        stations.push(
          {
            id: 'left',
            position: { x: 0.4, y: 0.4 },
            type: 'city',
            maxCorporations: 1
          },
          {
            id: 'right',
            position: { x: 0.6, y: 0.6 },
            type: 'city',
            maxCorporations: 1
          }
        );
        break;
      // Towns don't get stations (stations can only be placed on cities)
    }
    
    return stations;
  }

  // Check if a corporation can place a station on a specific tile
  canPlaceStation(tileId: string, corporationId: string): boolean {
    const tileData = this.tileStations.get(tileId);
    if (!tileData) return false;

    const corporation = this.corporations.get(corporationId);
    if (!corporation || !corporation.isFloated) return false;

    // Check if corporation already has a station on this tile
    if (tileData.placedCorporations.includes(corporationId)) return false;

    // Check if there are available city stations
    const availableCityStations = tileData.stations.filter(
      station => station.type === 'city' && !station.isOccupied
    );

    return availableCityStations.length > 0;
  }

  // Place a station for a corporation on a tile
  placeStation(tileId: string, corporationId: string, stationId?: string): boolean {
    if (!this.canPlaceStation(tileId, corporationId)) return false;

    const tileData = this.tileStations.get(tileId);
    const corporation = this.corporations.get(corporationId);
    
    if (!tileData || !corporation) return false;

    // Find an available city station
    let targetStation: Station | undefined;
    
    if (stationId) {
      // Try to place on specific station
      targetStation = tileData.stations.find(
        station => station.id === stationId && 
                   station.type === 'city' && 
                   !station.isOccupied
      );
    } else {
      // Find first available city station
      targetStation = tileData.stations.find(
        station => station.type === 'city' && !station.isOccupied
      );
    }

    if (!targetStation) return false;

    // Assign the station to the corporation
    targetStation.assignedCorporation = corporationId;
    targetStation.isOccupied = true;
    
    // Update tile and corporation data
    tileData.placedCorporations.push(corporationId);
    corporation.stations.push(targetStation.id);

    return true;
  }

  // Remove a corporation's station from a tile
  removeStation(tileId: string, corporationId: string): boolean {
    const tileData = this.tileStations.get(tileId);
    const corporation = this.corporations.get(corporationId);
    
    if (!tileData || !corporation) return false;

    const station = tileData.stations.find(
      s => s.assignedCorporation === corporationId
    );

    if (!station) return false;

    // Remove the assignment
    station.assignedCorporation = undefined;
    station.isOccupied = false;
    
    // Update tile and corporation data
    const corpIndex = tileData.placedCorporations.indexOf(corporationId);
    if (corpIndex > -1) {
      tileData.placedCorporations.splice(corpIndex, 1);
    }
    
    const stationIndex = corporation.stations.indexOf(station.id);
    if (stationIndex > -1) {
      corporation.stations.splice(stationIndex, 1);
    }

    return true;
  }

  // Get all stations for a tile
  getTileStations(tileId: string): Station[] {
    const tileData = this.tileStations.get(tileId);
    return tileData ? tileData.stations : [];
  }

  // Get all stations owned by a corporation
  getCorporationStations(corporationId: string): Station[] {
    const corporation = this.corporations.get(corporationId);
    if (!corporation) return [];

    const stations: Station[] = [];
    corporation.stations.forEach(stationId => {
      // Find which tile this station belongs to
      for (const [tileId, tileData] of this.tileStations) {
        const station = tileData.stations.find(s => s.id === stationId);
        if (station) {
          stations.push(station);
          break;
        }
      }
    });

    return stations;
  }

  // Register a corporation
  registerCorporation(corporation: Corporation): void {
    this.corporations.set(corporation.id, corporation);
  }

  // Get corporation by ID
  getCorporation(corporationId: string): Corporation | undefined {
    return this.corporations.get(corporationId);
  }

  // Get all corporations
  getAllCorporations(): Corporation[] {
    return Array.from(this.corporations.values());
  }
}
