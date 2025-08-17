import React from 'react';
import { useGameStore } from '../store/gameStore';
import { RoundType } from '../types/game';
import { PrivateAuction } from './PrivateAuction';
import { AuctionSummary } from './AuctionSummary';
import { NotificationPopup } from './NotificationPopup';
import { useColors } from '../styles/colors';
import { useThemeStore } from '../store/themeStore';
import { StockRound } from './StockRound';

export const GameBoard: React.FC = () => {
  const { 
    players, 
    corporations, 
    phase, 
    roundType, 
    currentPlayerIndex,
    notifications,
    closeNotification,
    stockMarket,
    setGameState
  } = useGameStore();

  const colors = useColors();
  const { theme, toggleTheme } = useThemeStore();
  const currentPlayer = players[currentPlayerIndex];

  // Debug logging
  console.log('Current theme:', theme);
  console.log('Current colors:', colors.layout.background);

  return (
    <div className={`min-h-screen ${colors.layout.background}`} data-theme={theme}>
      {/* Debug theme indicator */}
      <div className={`fixed top-0 left-0 z-50 p-2 text-xs ${colors.text.primary} ${colors.card.background}`}>
        Theme: {theme} | Background: {colors.layout.background}
      </div>
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
            
            <div className="flex items-center space-x-4">
              {currentPlayer && (
                <div className="text-right">
                  <p className={`text-sm ${colors.text.secondary}`}>Current Player</p>
                  <p className={`text-lg font-semibold ${colors.text.success}`}>{currentPlayer.name}</p>
                  <p className={`text-sm ${colors.text.tertiary}`}>${currentPlayer.cash}</p>
                </div>
              )}
              
              {/* Debug Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setGameState({ roundType: RoundType.STOCK })}
                  className={`px-3 py-2 rounded-lg transition-colors duration-300 ${
                    roundType === RoundType.STOCK 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  title="Start Stock Round (Debug)"
                >
                  🚂 Stock
                </button>
                
                <button
                  onClick={() => setGameState({ roundType: RoundType.PRIVATE_AUCTION })}
                  className={`px-3 py-2 rounded-lg transition-colors duration-300 ${
                    roundType === RoundType.PRIVATE_AUCTION 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  title="Start Private Auction (Debug)"
                >
                  💰 Auction
                </button>
              </div>
              
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-900' 
                    : 'bg-gray-800 hover:bg-gray-700 text-white'
                }`}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>
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
            ) : roundType === RoundType.STOCK ? (
              <StockRound />
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
                    <div className="grid grid-cols-19 gap-1 text-xs">
                      {(() => {
                        const stockMarketGrid = [
                          ["60", "67", "71", "76", "82", "90", "100", "112", "125", "142", "160", "180", "200", "225", "250", "275", "300", "325", "350"],
                          ["53", "60", "66", "70", "76", "82", "90", "100", "112", "125", "142", "160", "180", "200", "220", "240", "260", "280", "300"],
                          ["46", "55", "60", "65", "70", "76", "82", "90", "100", "111", "125", "140", "155", "170", "185", "200", null, null, null],
                          ["39", "48", "54", "60", "66", "71", "76", "82", "90", "100", "110", "120", "130", null, null, null, null, null, null],
                          ["32", "41", "48", "55", "62", "67", "71", "76", "82", "90", "100", null, null, null, null, null, null, null, null],
                          ["25", "34", "42", "50", "58", "65", "67", "71", "75", "80", null, null, null, null, null, null, null, null, null],
                          ["18", "27", "36", "45", "54", "63", "67", "69", "70", null, null, null, null, null, null, null, null, null, null],
                          ["10", "20", "30", "40", "50", "60", "67", "68", null, null, null, null, null, null, null, null, null, null, null],
                          [null, "10", "20", "30", "40", "50", "60", null, null, null, null, null, null, null, null, null, null, null, null],
                          [null, null, "10", "20", "30", "40", "50", null, null, null, null, null, null, null, null, null, null, null, null],
                          [null, null, null, "10", "20", "30", "40", null, null, null, null, null, null, null, null, null, null, null, null]
                        ];

                        const stockMarketColorGrid = [
                          ["yellow", "white", "white", "white", "white", "white", "red", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white"],
                          ["yellow", "yellow", "white", "white", "white", "white", "red", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white"],
                          ["yellow", "yellow", "yellow", "white", "white", "white", "red", "white", "white", "white", "white", "white", "white", "white", "white", "white", null, null, null],
                          ["orange", "yellow", "yellow", "yellow", "white", "white", "red", "white", "white", "white", "white", "white", "white", null, null, null, null, null, null],
                          ["orange", "orange", "yellow", "yellow", "white", "white", "red", "white", "white", "white", "white", null, null, null, null, null, null, null, null],
                          ["brown", "orange", "orange", "yellow", "yellow", "white", "red", "white", "white", "white", null, null, null, null, null, null, null, null, null],
                          ["brown", "brown", "orange", "orange", "yellow", "white", "white", "white", "white", null, null, null, null, null, null, null, null, null, null],
                          ["brown", "brown", "brown", "orange", "yellow", "yellow", "white", "white", null, null, null, null, null, null, null, null, null, null, null],
                          [null, "brown", "brown", "brown", "orange", "yellow", "yellow", null, null, null, null, null, null, null, null, null, null, null, null],
                          [null, null, "brown", "brown", "brown", "orange", "yellow", null, null, null, null, null, null, null, null, null, null, null, null],
                          [null, null, null, "brown", "brown", "brown", "orange", null, null, null, null, null, null, null, null, null, null, null, null]
                        ];

                                                const getCellStyle = (value: string | null, rowIndex: number, colIndex: number) => {
                          if (!value) return {};
                          
                          // Check if any corporation is at this position
                          const hasCorporation = Array.from(stockMarket.tokenPositions.values()).some(pos => 
                            pos.x === colIndex && pos.y === rowIndex
                          );
                          
                          if (hasCorporation) return { backgroundColor: '#93c5fd', border: '2px solid #2563eb' };
                          
                          // Get color from the color grid
                          const color = stockMarketColorGrid[rowIndex]?.[colIndex];
                          if (!color) return {};
                          
                          // Map color names to inline styles
                          switch (color) {
                            case 'orange': return { backgroundColor: '#f97316' }; // orange-500
                            case 'yellow': return { backgroundColor: '#facc15' }; // yellow-400
                            case 'red': return { backgroundColor: '#ef4444' }; // red-500
                            case 'brown': return { backgroundColor: '#a16207' }; // amber-700
                            case 'white': return { backgroundColor: '#9ca3af' }; // gray-400
                            default: return {};
                          }
                        };



                        return stockMarketGrid.flatMap((row, rowIndex) => 
                          row.map((value, colIndex) => (
                            <div 
                              key={`${rowIndex}-${colIndex}`} 
                              className="stock-cell"
                              style={getCellStyle(value, rowIndex, colIndex)}
                              title={value ? `$${value}` : ''}
                            >
                              {value || ''}
                            </div>
                          ))
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Players */}
            <div className={`${colors.card.backgroundAlt} rounded-lg ${colors.card.shadow} p-4 ${colors.card.borderAlt}`}>
              <h3 className={`text-lg font-semibold mb-3 ${colors.text.primary}`}>Players</h3>
              <div className="space-y-3">
                {players.map((player, index) => (
                  <div 
                    key={player.id}
                    className={`p-3 rounded-md border ${
                      index === currentPlayerIndex 
                        ? `${colors.player.current}` 
                        : `${colors.card.border}`
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
            <div className={`${colors.card.backgroundHighlight} rounded-lg ${colors.card.shadow} p-4 ${colors.card.borderAlt}`}>
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
              <div className={`${colors.card.backgroundAlt} rounded-lg ${colors.card.shadow} p-4 ${colors.card.borderAlt}`}>
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
