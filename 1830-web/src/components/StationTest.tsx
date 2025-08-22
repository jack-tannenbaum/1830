import React, { useState, useEffect } from 'react';
import { StationManager } from '../utils/stationManager';
import { ALL_TILES } from '../types/tiles';
import { Corporation } from '../types/game';
import TileRenderer from './TileRenderer';

const StationTest: React.FC = () => {
  const [stationManager] = useState(() => new StationManager());
  const [selectedCorporation, setSelectedCorporation] = useState<string>('');
  const [corporations, setCorporations] = useState<Corporation[]>([]);

  // Initialize test corporations
  useEffect(() => {
    const testCorporations: Corporation[] = [
      {
        id: 'B&O',
        name: 'Baltimore & Ohio',
        color: '#ff6b6b',
        treasury: 1000,
        stations: [],
        shares: 10,
        parValue: 67,
        isFloated: true
      },
      {
        id: 'C&O',
        name: 'Chesapeake & Ohio',
        color: '#4ecdc4',
        treasury: 1000,
        stations: [],
        shares: 10,
        parValue: 67,
        isFloated: true
      },
      {
        id: 'NYC',
        name: 'New York Central',
        color: '#45b7d1',
        treasury: 1000,
        stations: [],
        shares: 10,
        parValue: 67,
        isFloated: true
      }
    ];

    testCorporations.forEach(corp => stationManager.registerCorporation(corp));
    setCorporations(testCorporations);
    setSelectedCorporation(testCorporations[0].id);
  }, [stationManager]);

  // Initialize stations for all tiles
  useEffect(() => {
    ALL_TILES.forEach(tile => {
      stationManager.initializeTileStations(tile.id, tile);
    });
  }, [stationManager]);

  const handleStationClick = (tileId: string, stationId: string) => {
    if (selectedCorporation) {
      const success = stationManager.placeStation(tileId, selectedCorporation, stationId);
      if (success) {
        // Force re-render by updating corporations
        setCorporations([...corporations]);
      }
    }
  };

  const handleRemoveStation = (tileId: string, corporationId: string) => {
    const success = stationManager.removeStation(tileId, corporationId);
    if (success) {
      setCorporations([...corporations]);
    }
  };

  const getTileStations = (tileId: string) => {
    return stationManager.getTileStations(tileId);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Station System Test</h2>
      
      {/* Corporation Selection */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Select Corporation:</h3>
        <select 
          value={selectedCorporation} 
          onChange={(e) => setSelectedCorporation(e.target.value)}
          style={{ marginRight: '10px' }}
        >
          {corporations.map(corp => (
            <option key={corp.id} value={corp.id}>
              {corp.name} ({corp.stations.length} stations)
            </option>
          ))}
        </select>
        
        <div style={{ marginTop: '10px' }}>
          {corporations.map(corp => (
            <div key={corp.id} style={{ 
              display: 'inline-block', 
              marginRight: '20px',
              padding: '5px',
              border: selectedCorporation === corp.id ? '2px solid #333' : '1px solid #ccc'
            }}>
              <div style={{ 
                width: '20px', 
                height: '20px', 
                backgroundColor: corp.color, 
                borderRadius: '50%',
                display: 'inline-block',
                marginRight: '5px'
              }} />
              {corp.name}: {corp.stations.length} stations
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <strong>Instructions:</strong>
        <ul>
          <li>Select a corporation from the dropdown</li>
          <li>Click on any city station (hollow circle) to assign it to the selected corporation</li>
          <li>Only city stations (hollow circles) can have corporations assigned</li>
          <li>Town stations (filled circles) cannot have corporations assigned</li>
        </ul>
      </div>

      {/* Tile Library */}
      <div>
        <h3>Tile Library (Click stations to assign corporations):</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px' }}>
          {ALL_TILES.filter(tile => 
            tile.requires.type === 'city' || 
            tile.requires.type === 'B' || 
            tile.requires.type === 'NYC' || 
            tile.requires.type === '2-city'
          ).map(tile => {
            const tileStations = getTileStations(tile.id);
            return (
              <div key={tile.id} style={{ textAlign: 'center' }}>
                <TileRenderer
                  tile={tile}
                  size={80}
                  showId={true}
                  stations={tileStations}
                  corporations={corporations}
                  onStationClick={(stationId) => handleStationClick(tile.id, stationId)}
                />
                <div style={{ fontSize: '10px', marginTop: '5px' }}>
                  {tileStations.filter(s => s.isOccupied).length}/{tileStations.filter(s => s.type === 'city').length} occupied
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Corporation Station Summary */}
      <div style={{ marginTop: '30px' }}>
        <h3>Corporation Station Summary:</h3>
        {corporations.map(corp => {
          const corpStations = stationManager.getCorporationStations(corp.id);
          return (
            <div key={corp.id} style={{ 
              marginBottom: '10px', 
              padding: '10px', 
              border: '1px solid #ccc',
              backgroundColor: '#f9f9f9'
            }}>
              <div style={{ 
                display: 'inline-block', 
                width: '20px', 
                height: '20px', 
                backgroundColor: corp.color, 
                borderRadius: '50%',
                marginRight: '10px'
              }} />
              <strong>{corp.name}</strong>: {corpStations.length} stations
              {corpStations.length > 0 && (
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  {corpStations.map(station => (
                    <li key={station.id} style={{ fontSize: '12px' }}>
                      {station.id} ({station.type})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StationTest;
