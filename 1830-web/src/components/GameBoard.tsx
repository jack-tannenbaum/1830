import React from 'react';
import { useGameStore } from '../store/gameStore';
import { RoundType } from '../types/game';
import { PrivateAuction } from './PrivateAuction';

export const GameBoard: React.FC = () => {
  const { 
    players, 
    corporations, 
    phase, 
    roundType, 
    currentPlayerIndex
  } = useGameStore();

  const currentPlayer = players[currentPlayerIndex];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">1830: Railways & Robber Barons</h1>
              <p className="text-gray-600">
                Phase {phase} • {
                  roundType === RoundType.PRIVATE_AUCTION ? 'Private Company Auction' :
                  roundType === RoundType.STOCK ? 'Stock Round' : 'Operating Round'
                }
              </p>
            </div>
            
            {currentPlayer && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Current Player</p>
                <p className="text-lg font-semibold text-green-600">{currentPlayer.name}</p>
                <p className="text-sm text-gray-500">${currentPlayer.cash}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Game Area */}
          <div className="lg:col-span-3">
            {roundType === RoundType.PRIVATE_AUCTION ? (
              <PrivateAuction />
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Game Board</h2>
                
                {/* Placeholder for hex map */}
                <div className="aspect-video bg-green-100 rounded-lg border-2 border-dashed border-green-300 flex items-center justify-center">
                  <div className="text-center text-green-600">
                    <div className="text-4xl mb-2">🚂</div>
                    <p className="text-lg font-medium">Railway Map</p>
                    <p className="text-sm">Hex map will be implemented here</p>
                  </div>
                </div>
                
                {/* Stock Market */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Stock Market</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-11 gap-1 text-xs">
                      {Array.from({ length: 10 }, (_, row) => 
                        Array.from({ length: 11 }, (_, col) => (
                          <div 
                            key={`${row}-${col}`}
                            className="stock-cell"
                          >
                            {row + col > 0 ? (60 + (row * 5) + (col * 10)) : ''}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Players */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-3">Players</h3>
              <div className="space-y-3">
                {players.map((player, index) => (
                  <div 
                    key={player.id}
                    className={`p-3 rounded-md border ${
                      index === currentPlayerIndex 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{player.name}</span>
                      <span className="text-green-600 font-semibold">${player.cash}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {player.certificates.length} certificates
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Corporations */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-3">Corporations</h3>
              {corporations.length === 0 ? (
                <p className="text-gray-500 text-sm">No corporations floated yet</p>
              ) : (
                <div className="space-y-2">
                  {corporations.map((corp) => (
                    <div key={corp.id} className="p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <div 
                          className="corporation-token"
                          style={{ backgroundColor: corp.color }}
                        >
                          {corp.abbreviation}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{corp.name}</p>
                          <p className="text-xs text-gray-500">${corp.sharePrice}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Game Actions - Only show during Stock Round */}
            {roundType === RoundType.STOCK && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-3">Stock Actions</h3>
                <div className="space-y-2">
                  <button className="w-full py-2 px-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm">
                    Buy Certificate
                  </button>
                  <button className="w-full py-2 px-3 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm">
                    Sell Certificate
                  </button>
                  <button className="w-full py-2 px-3 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm">
                    Buy President's Certificate
                  </button>
                  <button className="w-full py-2 px-3 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm">
                    Pass
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
