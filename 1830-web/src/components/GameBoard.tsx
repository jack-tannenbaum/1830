import React from 'react';
import { useGameStore } from '../store/gameStore';
import { RoundType } from '../types/game';
import { PrivateAuction } from './PrivateAuction';
import { AuctionSummary } from './AuctionSummary';
import { NotificationPopup } from './NotificationPopup';
import { colors } from '../styles/colors';

export const GameBoard: React.FC = () => {
  const { 
    players, 
    corporations, 
    phase, 
    roundType, 
    currentPlayerIndex,
    notifications,
    closeNotification
  } = useGameStore();

  const currentPlayer = players[currentPlayerIndex];

  return (
    <div className={`min-h-screen ${colors.layout.background}`}>
      {/* Header */}
      <div className={`${colors.layout.header.background} shadow-sm ${colors.layout.header.border}`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${colors.layout.header.title}`}>1830: Railways & Robber Barons</h1>
              <p className={colors.layout.header.subtitle}>
                Phase {phase} • {
                  roundType === RoundType.PRIVATE_AUCTION ? 'Private Company Auction' :
                  roundType === RoundType.AUCTION_SUMMARY ? 'Auction Summary' :
                  roundType === RoundType.STOCK ? 'Stock Round' : 'Operating Round'
                }
              </p>
            </div>
            
            {currentPlayer && (
              <div className="text-right">
                <p className={`text-sm ${colors.text.secondary}`}>Current Player</p>
                <p className={`text-lg font-semibold ${colors.text.success}`}>{currentPlayer.name}</p>
                <p className={`text-sm ${colors.text.tertiary}`}>${currentPlayer.cash}</p>
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
            ) : roundType === RoundType.AUCTION_SUMMARY ? (
              <AuctionSummary />
            ) : (
              <div className={`${colors.card.background} rounded-lg ${colors.card.shadow} p-6`}>
                <h2 className={`text-xl font-semibold mb-4 ${colors.text.primary}`}>Game Board</h2>
                
                {/* Placeholder for hex map */}
                <div className={`aspect-video ${colors.gameBoard.map.background} rounded-lg border-2 border-dashed ${colors.gameBoard.map.border} flex items-center justify-center`}>
                  <div className={`text-center ${colors.gameBoard.map.text}`}>
                    <div className="text-4xl mb-2">🚂</div>
                    <p className="text-lg font-medium">Railway Map</p>
                    <p className="text-sm">Hex map will be implemented here</p>
                  </div>
                </div>
                
                {/* Stock Market */}
                <div className="mt-6">
                  <h3 className={`text-lg font-semibold mb-3 ${colors.text.primary}`}>Stock Market</h3>
                  <div className={`${colors.gameBoard.stockMarket.background} p-4 rounded-lg`}>
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
            <div className={`${colors.card.background} rounded-lg ${colors.card.shadow} p-4`}>
              <h3 className={`text-lg font-semibold mb-3 ${colors.text.primary}`}>Players</h3>
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
                    <div className="flex justify-between items-center mb-2">
                      <span className={`font-medium ${colors.player.name}`}>{player.name}</span>
                      <span className={`${colors.player.cash} font-semibold`}>${player.cash}</span>
                    </div>
                    
                    <div className={`text-xs mb-2 ${colors.text.tertiary}`}>
                      {player.certificates.length} certificates
                    </div>
                    
                    {/* Private Companies */}
                    {player.privateCompanies.length > 0 && (
                      <div className="mt-2">
                        <div className={`text-xs font-medium ${colors.private.name} mb-1`}>Private Companies:</div>
                        <div className="space-y-1">
                          {player.privateCompanies.map((privateCompany) => (
                            <div key={privateCompany.id} className={`text-xs ${colors.auction.bidInput.background} ${colors.auction.bidInput.border} rounded px-2 py-1`}>
                              <div className={`font-medium ${colors.private.name}`}>{privateCompany.name}</div>
                              <div className={colors.private.name}>Bought for ${privateCompany.purchasePrice}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Corporations */}
            <div className={`${colors.card.background} rounded-lg ${colors.card.shadow} p-4`}>
              <h3 className={`text-lg font-semibold mb-3 ${colors.text.primary}`}>Corporations</h3>
              {corporations.length === 0 ? (
                <p className={`${colors.text.tertiary} text-sm`}>No corporations floated yet</p>
              ) : (
                <div className="space-y-2">
                  {corporations.map((corp) => (
                    <div key={corp.id} className={`p-2 ${colors.corporation.border} rounded`}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="corporation-token"
                          style={{ backgroundColor: corp.color }}
                        >
                          {corp.abbreviation}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${colors.corporation.name}`}>{corp.name}</p>
                          <p className={`text-xs ${colors.corporation.price}`}>${corp.sharePrice}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Game Actions - Only show during Stock Round */}
            {roundType === RoundType.STOCK && (
              <div className={`${colors.card.background} rounded-lg ${colors.card.shadow} p-4`}>
                <h3 className={`text-lg font-semibold mb-3 ${colors.text.primary}`}>Stock Actions</h3>
                <div className="space-y-2">
                  <button className={`w-full py-2 px-3 ${colors.button.primary} rounded transition-colors text-sm`}>
                    Buy Certificate
                  </button>
                  <button className={`w-full py-2 px-3 ${colors.button.danger} rounded transition-colors text-sm`}>
                    Sell Certificate
                  </button>
                  <button className={`w-full py-2 px-3 ${colors.button.success} rounded transition-colors text-sm`}>
                    Buy President's Certificate
                  </button>
                  <button className={`w-full py-2 px-3 ${colors.button.secondary} rounded transition-colors text-sm`}>
                    Pass
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Notifications Stack */}
      {notifications
        .sort((a, b) => a.timestamp - b.timestamp) // Sort by timestamp for proper stacking
        .map((notification, index) => (
          <NotificationPopup
            key={notification.id}
            id={notification.id}
            title={notification.title}
            message={notification.message}
            type={notification.type}
            onClose={() => closeNotification(notification.id)}
            index={index}
            duration={notification.duration}
          />
        ))}
    </div>
  );
};
