import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { RoundType, Corporation } from '../types/game';
import { PrivateAuction } from './PrivateAuction';
import { AuctionSummary } from './AuctionSummary';
import { NotificationPopup } from './NotificationPopup';
import { useColors } from '../styles/colors';
import { useThemeStore } from '../store/themeStore';
import StockRound from './StockRound';
import { STOCK_MARKET_GRID, STOCK_MARKET_COLOR_GRID } from '../types/constants';

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
  const [showStockMarket, setShowStockMarket] = useState(true);



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
                  onClick={() => setGameState({ roundType: RoundType.OPERATING })}
                  className={`px-3 py-2 rounded-lg transition-colors duration-300 ${
                    roundType === RoundType.OPERATING 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  title="Start Operating Round (Debug)"
                >
                  🏭 Operating
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
                <div className="flex justify-between items-center mb-4">
                  <h2 className={`text-xl font-semibold ${colors.text.primary}`}>Game Board</h2>
                  <button
                    onClick={() => setShowStockMarket(!showStockMarket)}
                    className={`px-3 py-2 rounded-lg transition-colors duration-300 text-white ${
                      showStockMarket 
                        ? colors.gameBoard.toggleButton.stockMarket
                        : colors.gameBoard.toggleButton.railwayMap
                    }`}
                    title={showStockMarket ? 'Show Railway Map' : 'Show Stock Market'}
                  >
                    {showStockMarket ? '🗺️ Map' : '📊 Market'}
                  </button>
                </div>
                
                {showStockMarket ? (
                  /* Stock Market */
                  <div className={`${colors.gameBoard.stockMarket.background} p-4 rounded-lg`}>
                    <div className="grid grid-cols-19 gap-1 text-xs">
                      {(() => {

                                                const getCellStyle = (value: string | null, rowIndex: number, colIndex: number) => {
                          if (!value) return {};
                          
                          // Get color from the color grid
                          const color = STOCK_MARKET_COLOR_GRID[rowIndex]?.[colIndex];
                          if (!color) return {};
                          
                          // Map color names to CSS variables
                          switch (color) {
                            case 'orange': return { backgroundColor: 'var(--stock-orange)' };
                            case 'yellow': return { backgroundColor: 'var(--stock-yellow)' };
                            case 'red': return { backgroundColor: 'var(--stock-red)' };
                            case 'brown': return { backgroundColor: 'var(--stock-brown)' };
                            case 'white': return { backgroundColor: 'var(--stock-gray)' };
                            default: return {};
                          }
                        };

                        const getCorporationsAtPosition = (rowIndex: number, colIndex: number) => {
                          const corporationsAtPosition: Corporation[] = [];
                          for (const [corporationId, position] of stockMarket.tokenPositions.entries()) {
                            if (position.x === colIndex && position.y === rowIndex) {
                              const corporation = corporations.find(corp => corp.id === corporationId);
                              if (corporation) {
                                corporationsAtPosition.push(corporation);
                              }
                            }
                          }
                          return corporationsAtPosition;
                        };

                        return STOCK_MARKET_GRID.flatMap((row, rowIndex) => 
                          row.map((value, colIndex) => {
                            const corporationsAtPosition = getCorporationsAtPosition(rowIndex, colIndex);
                            
                            // Create hover tooltip content
                            const tooltipContent = value 
                              ? corporationsAtPosition.length > 0
                                ? `$${value} - ${corporationsAtPosition.map(corp => `${corp.name} (${corp.abbreviation})`).join(', ')}`
                                : `$${value}`
                              : '';
                            
                            return (
                              <div 
                                key={`${rowIndex}-${colIndex}`} 
                                className={`stock-cell relative ${corporationsAtPosition.length > 0 ? 'group' : ''}`}
                                style={getCellStyle(value, rowIndex, colIndex)}
                                title={corporationsAtPosition.length > 0 ? tooltipContent : (value ? `$${value}` : '')}
                              >
                                {value || ''}
                                {corporationsAtPosition.length > 0 && (
                                  <>
                                    <div className="absolute inset-0 flex items-center justify-center gap-1 p-1">
                                      {corporationsAtPosition.map((corporation, index) => (
                                        <div 
                                          key={corporation.id}
                                          className="flex-shrink-0"
                                          style={{ 
                                            backgroundColor: corporation.color,
                                            borderRadius: '4px',
                                            padding: '2px 4px',
                                            fontSize: '8px',
                                            fontWeight: 'bold',
                                            color: 'white',
                                            textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
                                            minWidth: '16px',
                                            textAlign: 'center'
                                          }}
                                        >
                                          {corporation.abbreviation}
                                        </div>
                                      ))}
                                    </div>
                                    
                                    {/* Hover Popup - only when corporations are present */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                      <div className={`${colors.card.background} ${colors.card.border} rounded-lg shadow-lg p-3 border-2 min-w-max`}>
                                        <div className={`text-sm font-semibold ${colors.text.primary} mb-2`}>
                                          ${value} - {corporationsAtPosition.length} corporation{corporationsAtPosition.length > 1 ? 's' : ''}
                                        </div>
                                        <div className="space-y-1">
                                          {corporationsAtPosition.map((corporation) => (
                                            <div key={corporation.id} className="flex items-center gap-2">
                                              <div 
                                                className="w-3 h-3 rounded"
                                                style={{ backgroundColor: corporation.color }}
                                              />
                                              <span className={`text-sm ${colors.text.secondary}`}>
                                                {corporation.name} ({corporation.abbreviation})
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                      {/* Arrow pointing down */}
                                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800 mx-auto"></div>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  /* Railway Map */
                  <div className={`aspect-video ${colors.gameBoard.map.background} rounded-lg border-2 border-dashed ${colors.gameBoard.map.border} flex items-center justify-center`}>
                    <div className={`text-center ${colors.gameBoard.map.text}`}>
                      <div className="text-4xl mb-2">🚂</div>
                      <p className="text-lg font-medium">Railway Map</p>
                      <p className="text-sm">Hex map will be implemented here</p>
                    </div>
                  </div>
                )}
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
                              {roundType === RoundType.PRIVATE_AUCTION && (
                                <div className={colors.private.name}>Bought for ${privateCompany.purchasePrice}</div>
                              )}
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
