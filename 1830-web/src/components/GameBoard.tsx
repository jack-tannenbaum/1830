import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { RoundType, GamePhase } from '../types/game';
import { PrivateAuction } from './PrivateAuction';
import { AuctionSummary } from './AuctionSummary';
import { NotificationPopup } from './NotificationPopup';
import { useColors } from '../styles/colors';
import { useThemeStore } from '../store/themeStore';
import StockRound from './StockRound';
import { StockMarketDisplay } from './StockMarketDisplay';
import { getMarketPriceColor } from '../utils/stockMarketColors';
import { getPhaseConfig } from '../types/phaseConfigs';

// Phase Tooltip Component
const PhaseTooltip: React.FC<{ phase: GamePhase; colors: ReturnType<typeof useColors> }> = ({ phase, colors }) => {
  const currentPhaseConfig = getPhaseConfig(phase);
  const nextPhase = phase < GamePhase.SEVEN ? phase + 1 : null;
  const nextPhaseConfig = nextPhase ? getPhaseConfig(nextPhase as GamePhase) : null;
  
  const getTrainTypeName = (trainType: string) => {
    switch (trainType) {
      case 'two': return '2-Train';
      case 'three': return '3-Train';
      case 'four': return '4-Train';
      case 'five': return '5-Train';
      case 'six': return '6-Train';
      case 'diesel': return 'Diesel';
      default: return trainType;
    }
  };

  return (
    <div>
      <div className={`text-sm ${colors.text.primary} space-y-1`}>
        <div className={`font-bold ${colors.text.secondary} mb-2`}>{currentPhaseConfig.name}</div>
        <div><strong>Trains:</strong> {currentPhaseConfig.trainTypes.map(getTrainTypeName).join(', ')}</div>
        <div><strong>Tiles:</strong> {currentPhaseConfig.allowedTileColors.length > 0 ? currentPhaseConfig.allowedTileColors.join(', ') : 'None'}</div>
        <div><strong>Max Trains:</strong> {currentPhaseConfig.maxTrainsPerCorp} per corp</div>
        {nextPhaseConfig && (
          <div><strong>Next:</strong> Buy first {getTrainTypeName(nextPhaseConfig.trainTypes[0]?.toLowerCase() || '')}</div>
        )}
      </div>
    </div>
  );
};

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
  const [showPhaseTooltip, setShowPhaseTooltip] = useState(false);



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
                <span 
                  className="cursor-help hover:underline relative"
                  onMouseEnter={() => setShowPhaseTooltip(true)}
                  onMouseLeave={() => setShowPhaseTooltip(false)}
                >
                  Phase {phase}
                  {showPhaseTooltip && (
                    <div className={`fixed z-50 p-4 rounded-lg shadow-lg border ${colors.card.background} ${colors.card.shadow} ${colors.card.border} w-80`} style={{ top: '80px', left: '20px' }}>
                      <PhaseTooltip phase={phase} colors={colors} />
                    </div>
                  )}
                </span> • {
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
                  <StockMarketDisplay />
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
                      <span className={`font-medium ${colors.text.primary}`}>{player.name}</span>
                      <span className={`${colors.player.cash} font-semibold`}>${player.cash}</span>
                    </div>
                    
                    <div className={`text-xs ${colors.text.tertiary} mb-3`}>
                      {player.certificates.length} certificates
                    </div>
                    
                    {/* Stock Holdings */}
                    {(() => {
                      const stockHoldings = corporations
                        .map(corp => {
                          const playerShares = corp.playerShares.get(player.id) || [];
                          const totalPercentage = playerShares.reduce((sum, cert) => sum + cert.percentage, 0);
                          const isPresident = corp.presidentId === player.id;
                          return { corporation: corp, shares: playerShares, totalPercentage, isPresident };
                        })
                        .filter(holding => holding.totalPercentage > 0)
                        .sort((a, b) => b.totalPercentage - a.totalPercentage);
                      
                      return stockHoldings.length > 0 ? (
                        <div className="mb-3">
                          <div className={`text-xs font-semibold ${colors.text.secondary} mb-2 uppercase tracking-wide`}>Stock Holdings</div>
                          <div className="space-y-1.5">
                            {stockHoldings.map((holding) => (
                              <div key={holding.corporation.id} className="text-xs flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <div 
                                    className="w-2.5 h-2.5 rounded"
                                    style={{ backgroundColor: holding.corporation.color }}
                                  />
                                  <span className={`font-medium ${colors.corporation.name}`}>
                                    {holding.corporation.abbreviation}
                                  </span>
                                  {holding.isPresident && (
                                    <span className="text-xs font-bold" style={{ color: '#FFD700' }}>P</span>
                                  )}
                                </div>
                                <span className={`${colors.text.primary} font-semibold`}>
                                  {holding.totalPercentage}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}
                    
                    {/* Private Companies */}
                    {player.privateCompanies.length > 0 && (
                      <div className="mb-3">
                        <div className={`text-xs font-semibold ${colors.text.secondary} mb-2 uppercase tracking-wide`}>Private Companies</div>
                        <div className="space-y-1.5">
                          {player.privateCompanies.map((privateCompany) => (
                            <div key={privateCompany.id} className="text-xs">
                              <div className={`font-medium ${colors.text.primary}`}>{privateCompany.name}</div>
                              {roundType === RoundType.PRIVATE_AUCTION && (
                                <div className={`${colors.text.tertiary} text-xs`}>Bought for ${privateCompany.purchasePrice}</div>
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
                <p className={`${colors.text.tertiary} text-sm`}>No corporations started yet</p>
              ) : (
                <div className="space-y-2">
                  {corporations.map((corporation) => (
                    <div key={corporation.id} className="corporation-item">
                      <div className="flex items-center gap-2">
                        <div 
                          className="corporation-token"
                          style={{ backgroundColor: corporation.color }}
                        >
                          {corporation.abbreviation}
                        </div>
                        <div className="flex-1" style={{ lineHeight: '1.2' }}>
                          <p className={`font-medium text-sm ${colors.corporation.name}`} style={{ margin: '0 0 2px 0' }}>{corporation.name}</p>
                          {corporation.presidentId && (
                            <p className={`text-sm italic ${colors.text.tertiary}`} style={{ margin: '0 0 2px 0' }}>
                              President: {players.find(p => p.id === corporation.presidentId)?.name}
                            </p>
                          )}
                          {corporation.parValue && (
                            <p className={`text-sm italic`} style={{ margin: '0' }}>
                              <span className={colors.text.tertiary}>PAR: ${corporation.parValue} | MP: </span>
                              <span className={getMarketPriceColor(corporation.id, stockMarket, colors)}>${corporation.sharePrice}</span>
                            </p>
                          )}
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
