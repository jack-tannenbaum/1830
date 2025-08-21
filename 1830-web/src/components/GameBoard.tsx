import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { RoundType, GamePhase } from '../types/game';
import { PrivateAuction } from './PrivateAuction';
import { AuctionSummary } from './AuctionSummary';
import { NotificationPopup } from './NotificationPopup';
import { TurnDisplay } from './TurnDisplay';
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
    setGameState,
    operatingRoundState,
    operatingRoundsCompleted
  } = useGameStore();

  const colors = useColors();
  const { theme, toggleTheme } = useThemeStore();
  const currentPlayer = players[currentPlayerIndex];
  const [showStockMarket, setShowStockMarket] = useState(roundType === RoundType.STOCK);
  const [showPhaseTooltip, setShowPhaseTooltip] = useState(false);

  // Get operating round data safely
  const operatingOrder = operatingRoundState?.operatingOrder || [];
  const currentOperatingCorporationId = operatingRoundState?.operatingCorporationId;



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
                  roundType === RoundType.STOCK ? 'Stock Round' : 
                  `Operating Round ${(operatingRoundsCompleted || 0) + 1} of ${getPhaseConfig(phase).operatingRoundsBetweenStock}`
                }
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Debug Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setGameState({ roundType: RoundType.STOCK })}
                  className={`px-3 py-2 rounded-lg transition-colors duration-300 ${
                    roundType === RoundType.STOCK 
                      ? colors.button.success
                      : colors.button.primary
                  }`}
                  title="Start Stock Round (Debug)"
                >
                  🚂 Stock
                </button>
                
                <button
                  onClick={() => setGameState({ roundType: RoundType.OPERATING })}
                  className={`px-3 py-2 rounded-lg transition-colors duration-300 ${
                    roundType === RoundType.OPERATING 
                      ? colors.button.success
                      : colors.button.primary
                  }`}
                  title="Start Operating Round (Debug)"
                >
                  🏭 Operating
                </button>
                
                <button
                  onClick={() => setGameState({ roundType: RoundType.PRIVATE_AUCTION })}
                  className={`px-3 py-2 rounded-lg transition-colors duration-300 ${
                    roundType === RoundType.PRIVATE_AUCTION 
                      ? colors.button.success
                      : colors.button.primary
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
                    ? colors.button.warning
                    : colors.button.secondary
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
                  <>
                    <div className={`aspect-video ${colors.gameBoard.map.background} rounded-lg border-2 border-dashed ${colors.gameBoard.map.border} flex items-center justify-center`}>
                      <div className={`text-center ${colors.gameBoard.map.text}`}>
                        <div className="text-4xl mb-2">🚂</div>
                        <p className="text-lg font-medium">Railway Map</p>
                        <p className="text-sm">Hex map will be implemented here</p>
                      </div>
                    </div>

                    {/* Corporation Card - appears when it's a corporation's turn to operate */}
                    {currentOperatingCorporationId && (() => {
                      const operatingCorporation = corporations.find(corp => corp.id === currentOperatingCorporationId);
                      if (!operatingCorporation) return null;
                      
                      return (
                        <div 
                          className="mt-6 p-6 rounded-lg shadow-lg border-2 border-white"
                          style={{ 
                            backgroundColor: operatingCorporation.color + '20',
                            borderColor: operatingCorporation.color
                          }}
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div 
                              className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl border-4 border-white shadow-lg"
                              style={{ 
                                backgroundColor: operatingCorporation.color,
                                color: operatingCorporation.color === '#FFFF00' || operatingCorporation.color === '#FFA500' ? '#000000' : '#FFFFFF'
                              }}
                            >
                              {operatingCorporation.abbreviation}
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                                {operatingCorporation.name}
                              </h2>
                              <p className="text-white text-lg" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                                President: {players.find(p => p.id === operatingCorporation.presidentId)?.name || 'Unknown'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-6">
                            <div 
                              className="rounded-lg p-4"
                              style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                            >
                              <h3 className="text-white font-semibold mb-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                                Corporation Info
                              </h3>
                              <div className="space-y-1 text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                                <p>Share Price: ${operatingCorporation.sharePrice}</p>
                                <p>Treasury: ${operatingCorporation.treasury}</p>
                                <p>Trains: {operatingCorporation.trains.length}</p>
                              </div>
                            </div>
                            
                            <div 
                              className="rounded-lg p-4"
                              style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                            >
                              <h3 className="text-white font-semibold mb-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                                Available Actions
                              </h3>
                              <div className="space-y-2">
                                <button 
                                  className="w-full text-white font-medium py-2 px-4 rounded hover:opacity-80 transition-opacity"
                                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                                >
                                  Lay Track
                                </button>
                                <button 
                                  className="w-full text-white font-medium py-2 px-4 rounded hover:opacity-80 transition-opacity"
                                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                                >
                                  Place Token
                                </button>
                                <button 
                                  className="w-full text-white font-medium py-2 px-4 rounded hover:opacity-80 transition-opacity"
                                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                                >
                                  Run Trains
                                </button>
                                <button 
                                  className="w-full text-white font-medium py-2 px-4 rounded hover:opacity-80 transition-opacity"
                                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                                >
                                  Buy Train
                                </button>
                                <button 
                                  className="w-full text-white font-medium py-2 px-4 rounded hover:opacity-80 transition-opacity"
                                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                                  onClick={() => {
                                    if (operatingRoundState?.operatingCorporationId) {
                                      useGameStore.getState().nextOperatingCorporation();
                                    }
                                  }}
                                >
                                  End Turn
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Players */}
            {roundType === RoundType.STOCK ? (
              /* Stock Round Layout - Keep existing player pane */
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
                                <div className={`${colors.text.tertiary} text-xs`}>Bought for ${privateCompany.purchasePrice}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Operating Round Layout - Square-based player areas */
              <div className={`${colors.card.backgroundAlt} rounded-lg ${colors.card.shadow} p-4 ${colors.card.borderAlt}`}>
                <h3 className={`text-lg font-semibold mb-3 ${colors.text.primary}`}>Players</h3>
                <div className="grid grid-cols-2 gap-4">
                  {players.map((player, index) => {
                    // Get corporations this player is president of that are floated
                    const operatingCorporations = corporations.filter(corp => 
                      corp.presidentId === player.id && corp.floated
                    );
                    
                    // Sort by operating order
                    const sortedOperatingCorporations = operatingCorporations.sort((a, b) => {
                      const aIndex = operatingOrder.indexOf(a.id);
                      const bIndex = operatingOrder.indexOf(b.id);
                      return aIndex - bIndex;
                    });
                    
                    return (
                      <div 
                        key={player.id}
                        className={`aspect-square p-3 rounded-md border relative ${
                          index === currentPlayerIndex 
                            ? `${colors.player.current}` 
                            : `${colors.card.border}`
                        }`}
                      >

                        {/* Player Summary */}
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className={`font-medium text-sm ${colors.text.primary}`}>{player.name}</span>
                            <span className={`${colors.player.cash} font-semibold`}>${player.cash}</span>
                          </div>
                          
                          {/* Stock Holdings Summary */}
                          {(() => {
                            const stockHoldings = corporations
                              .map(corp => {
                                const playerShares = corp.playerShares.get(player.id) || [];
                                const totalPercentage = playerShares.reduce((sum, cert) => sum + cert.percentage, 0);
                                return { corporation: corp, totalPercentage };
                              })
                              .filter(holding => holding.totalPercentage > 0)
                              .sort((a, b) => b.totalPercentage - a.totalPercentage);
                            
                            return stockHoldings.length > 0 ? (
                              <div className="text-xs">
                                <span className={`${colors.text.secondary}`}>
                                  {stockHoldings.map(holding => 
                                    `${holding.corporation.abbreviation} ${holding.totalPercentage}%`
                                  ).join(', ')}
                                </span>
                              </div>
                            ) : null;
                          })()}
                          
                          {/* Private Companies Summary */}
                          {player.privateCompanies.length > 0 && (
                            <div className="text-xs mt-1">
                              <span className={`${colors.text.secondary}`}>
                                Privates: {player.privateCompanies.map(privateCompany => {
                                  // Create shortened names for private companies
                                  const shortName = privateCompany.name
                                    .replace('Schuylkill Valley', 'SV')
                                    .replace('Champlain & St. Lawrence', 'C&SL')
                                    .replace('Delaware & Hudson', 'D&H')
                                    .replace('Mohawk & Hudson', 'M&H')
                                    .replace('Camden & Amboy', 'C&A')
                                    .replace('Baltimore & Ohio', 'B&O');
                                  return `${shortName} ($${privateCompany.revenue})`;
                                }).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Operating Corporations */}
                        {sortedOperatingCorporations.length > 0 && (
                          <div className="space-y-2">
                            <div className={`text-xs font-semibold ${colors.text.secondary} uppercase tracking-wide`}>
                              Operating
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {sortedOperatingCorporations.map((corporation) => {
                                const operatingIndex = operatingOrder.indexOf(corporation.id);
                                const isCurrentOperating = currentOperatingCorporationId === corporation.id;
                                
                                return (
                                  <div 
                                    key={corporation.id}
                                    className="relative"
                                  >
                                    <div 
                                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 border-white shadow-sm ${
                                        isCurrentOperating ? 'ring-2 ring-yellow-400 ring-opacity-75' : ''
                                      }`}
                                      style={{ 
                                        backgroundColor: corporation.color,
                                        color: corporation.color === '#FFFF00' || corporation.color === '#FFA500' ? '#000000' : '#FFFFFF'
                                      }}
                                    >
                                      {corporation.abbreviation}
                                    </div>
                                    {/* Operating order number - top right of corporation circle */}
                                    <div 
                                      className={`absolute w-4 h-4 text-white text-xs rounded-full flex items-center justify-center font-bold ${colors.button.danger}`}
                                      style={{ top: '-8px', right: '-8px' }}
                                    >
                                      {operatingIndex + 1}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
      
      {/* Turn Display */}
      <TurnDisplay />
      
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
