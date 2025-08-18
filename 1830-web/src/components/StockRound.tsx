import React from 'react';
import { useGameStore } from '../store/gameStore';
import { useColors } from '../styles/colors';
import { RoundType } from '../types/game';
import type { Corporation, Certificate } from '../types/game';

const StockRound: React.FC = () => {
  const { corporations, players, currentPlayerIndex, phase, buyCertificate, sellCertificate, buyPresidentCertificate, undoLastStockAction, nextStockPlayer, stockRoundState } = useGameStore();
  const colors = useColors();
  const [debugFirstStockRound, setDebugFirstStockRound] = React.useState(false);
  const [showParValueModal, setShowParValueModal] = React.useState(false);
  const [selectedCorporation, setSelectedCorporation] = React.useState<Corporation | null>(null);
  const [selectedParValue, setSelectedParValue] = React.useState<number>(100);

  // Check if this is the first stock round (phase 1) or debug override
  const isFirstStockRound = debugFirstStockRound ? false : true; // Debug override: when checked, force later stock round (selling enabled)

  // Available par values (red spaces on stock market)
  const availableParValues = [67, 71, 76, 82, 90, 100];

  const handleBuyCertificate = (corporationId: string) => {
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) return;
    
    // Check if player has already bought this turn
    const hasBoughtThisTurn = stockRoundState?.currentPlayerActions.some(action => 
      action.type === 'buy_certificate' || action.type === 'start_corporation'
    );
    
    if (hasBoughtThisTurn) return;
    
    const corporation = corporations.find(c => c.id === corporationId);
    if (!corporation) return;
    
    // Check if this is the first purchase (corporation not floated)
    if (!corporation.floated) {
      // Show par value selection modal
      setSelectedCorporation(corporation);
      setSelectedParValue(100); // Default to $100
      setShowParValueModal(true);
      return;
    }
    
    // Regular purchase for floated corporation
    buyCertificate(currentPlayer.id, corporationId);
  };

  const handleSellCertificate = (corporationId: string) => {
    console.log('=== handleSellCertificate called ===');
    console.log('corporationId:', corporationId);
    console.log('isFirstStockRound:', isFirstStockRound);
    
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) {
      console.log('No current player found');
      return;
    }
    
    console.log('Current player:', currentPlayer.name);
    
    // For now, sell 1 share (10% certificate)
    const result = sellCertificate(currentPlayer.id, corporationId, 1);
    console.log('sellCertificate result:', result);
  };
  
  
  

  const renderIPOShares = (corporation: Corporation) => {
    const ipoShares = corporation.ipoShares;
    const bankShares = corporation.bankShares;
    
    return (
      <div className="flex flex-col space-y-2">
        {/* IPO Shares */}
        <div className="flex flex-col">
          <div className={`text-xs font-medium ${colors.text.secondary} mb-1`}>
            IPO ({ipoShares.length} shares)
          </div>
          <div className="flex flex-wrap gap-2">
            {ipoShares.map((cert, index) => (
              <div
                key={`ipo-${corporation.id}-${index}`}
                className={`w-8 h-10 rounded border-2 ${colors.card.border} ${colors.card.background} flex items-center justify-center text-xs font-bold cursor-pointer hover:${colors.card.backgroundHighlight} transition-colors`}
                style={{ 
                  backgroundColor: corporation.color + '20',
                  borderColor: corporation.color,
                  color: corporation.color
                }}
                title={`${cert.isPresident ? 'President' : 'Share'} - ${cert.percentage}%`}
              >
                {cert.isPresident ? 'P' : cert.percentage}
              </div>
            ))}
          </div>
        </div>

        {/* Bank Pool */}
        {bankShares.length > 0 && (
          <div className="flex flex-col">
            <div className={`text-xs font-medium ${colors.text.secondary} mb-1`}>
              Bank Pool ({bankShares.length} shares)
            </div>
            <div className="flex flex-wrap gap-2">
              {bankShares.map((cert, index) => (
                <div
                  key={`bank-${corporation.id}-${index}`}
                  className={`w-8 h-10 rounded border-2 border-dashed ${colors.card.borderAlt} ${colors.card.backgroundAlt} flex items-center justify-center text-xs font-bold`}
                  style={{ 
                    backgroundColor: corporation.color + '10',
                    borderColor: corporation.color + '60',
                    color: corporation.color + '80'
                  }}
                  title={`${cert.isPresident ? 'President' : 'Share'} - ${cert.percentage}% (Bank Pool)`}
                >
                  {cert.isPresident ? 'P' : cert.percentage}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPlayerShares = (corporation: Corporation) => {
    return (
      <div className="flex flex-col space-y-2">
        <div className={`text-xs font-medium ${colors.text.secondary} mb-1`}>
          Player Shares
        </div>
        <div className="space-y-1">
          {players.map(player => {
            const playerCerts = corporation.playerShares.get(player.id) || [];
            if (playerCerts.length === 0) return null;
            
            return (
              <div key={player.id} className="flex items-center space-x-2">
                <div className={`text-xs ${colors.text.secondary} min-w-[60px]`}>
                  {player.name}:
                </div>
                <div className="flex flex-wrap gap-2">
                  {playerCerts.map((cert, index) => (
                    <div
                      key={`player-${player.id}-${corporation.id}-${index}`}
                      className={`w-6 h-8 rounded border ${colors.card.border} ${colors.card.background} flex items-center justify-center text-xs font-bold`}
                      style={{ 
                        backgroundColor: corporation.color + '30',
                        borderColor: corporation.color,
                        color: corporation.color
                      }}
                      title={`${cert.isPresident ? 'President' : 'Share'} - ${cert.percentage}%`}
                    >
                      {cert.isPresident ? 'P' : cert.percentage}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`${colors.card.background} rounded-lg ${colors.card.shadow} p-6`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-semibold ${colors.text.primary}`}>Stock Round</h2>
        <div className={`text-sm ${colors.text.secondary}`}>
          Current Player: {players[currentPlayerIndex]?.name}
        </div>
      </div>



      {/* Debug Controls */}
      <div className={`mb-4 p-3 rounded-lg border ${colors.card.backgroundAlt} ${colors.card.borderAlt}`}>
        <div className="flex items-center justify-center space-x-4">
          <label className={`text-sm ${colors.text.secondary}`}>
            Debug: First Stock Round Mode
          </label>
          <input
            type="checkbox"
            checked={debugFirstStockRound}
            onChange={(e) => setDebugFirstStockRound(e.target.checked)}
            className="w-4 h-4"
          />
          <span className={`text-sm font-medium ${isFirstStockRound ? colors.text.warning : colors.text.success}`}>
            {isFirstStockRound ? 'First Stock Round (Selling Disabled)' : 'Later Stock Round (Selling Enabled)'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {corporations.length === 0 ? (
          <div className={`col-span-full text-center py-8 ${colors.text.secondary}`}>
            <div className="mb-4">No corporations available. Please start a new game.</div>
            <button
              onClick={() => {
                useGameStore.getState().newGame();
                useGameStore.getState().initializeGame(['Player 1', 'Player 2', 'Player 3']);
              }}
              className={`px-6 py-3 rounded-lg ${colors.button.primary} font-medium transition-colors`}
            >
              New Game (Updated Colors)
            </button>
          </div>
        ) : (
          corporations.map(corporation => (
          <div
            key={corporation.id}
            className="rounded-lg border-2 p-4 shadow-md"
            style={{ 
              backgroundColor: corporation.color + '08',
              borderColor: corporation.color + '30',
              boxShadow: `0 4px 6px -1px ${corporation.color}20`
            }}
          >
            {/* Corporation Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className={`font-semibold ${colors.text.primary}`}>
                  {corporation.abbreviation}
                </div>
                <div className={`text-xs ${colors.text.secondary}`}>
                  {corporation.name}
                </div>
              </div>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm px-1"
                style={{ backgroundColor: corporation.color }}
              >
                {corporation.abbreviation}
              </div>
            </div>

            {/* Key Data */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center">
                <div className={`text-xs ${colors.text.secondary}`}>Par Value</div>
                <div className={`text-sm font-semibold ${colors.text.primary}`}>
                  ${corporation.parValue || 'Not Set'}
                </div>
              </div>
              <div className="text-center">
                <div className={`text-xs ${colors.text.secondary}`}>Market Price</div>
                <div className={`text-sm font-semibold ${colors.text.primary}`}>
                  ${corporation.sharePrice || 'Not Set'}
                </div>
              </div>
            </div>

            {/* President */}
            {corporation.presidentId && (
              <div className="text-center mb-4">
                <div className={`text-xs ${colors.text.secondary}`}>President</div>
                <div className={`text-sm font-semibold ${colors.text.success}`}>
                  {players.find(p => p.id === corporation.presidentId)?.name}
                </div>
              </div>
            )}

            {/* Share Pools */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className={`text-xs ${colors.text.secondary}`}>IPO Pool</span>
                <span className={`text-xs font-medium ${colors.text.primary}`}>
                  {corporation.ipoShares.reduce((total, cert) => total + cert.percentage, 0) / 10} shares
                </span>
              </div>
              {corporation.bankShares.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${colors.text.secondary}`}>Bank Pool</span>
                  <span className={`text-xs font-medium ${colors.text.primary}`}>
                    {corporation.bankShares.reduce((total, cert) => total + cert.percentage, 0) / 10} shares
                  </span>
                </div>
              )}
            </div>

            {/* Ownership Breakdown */}
            <div className="mb-4">
              <div className={`text-xs ${colors.text.secondary} mb-2`}>Ownership</div>
              <div className="space-y-1">
                {players.map(player => {
                  const playerCerts = corporation.playerShares.get(player.id) || [];
                  const totalPercentage = playerCerts.reduce((sum, cert) => sum + cert.percentage, 0);
                  const isPresident = corporation.presidentId === player.id;
                  

                  
                  return (
                    <div key={player.id} className="flex justify-between items-center">
                      <span className={`text-xs ${colors.text.secondary} flex items-center gap-1`}>
                        {player.name}
                        {isPresident && (
                          <span className={`text-xs px-1 py-0.5 rounded ${colors.text.success} bg-green-100 dark:bg-green-900`}>
                            President
                          </span>
                        )}
                      </span>
                      <span className={`text-xs font-medium ${colors.text.primary}`}>
                        {totalPercentage > 0 ? `${totalPercentage}%` : '0%'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleBuyCertificate(corporation.id)}
                disabled={stockRoundState?.currentPlayerActions.some(action => 
                  action.type === 'buy_certificate' || action.type === 'start_corporation'
                )}
                className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-colors ${
                  stockRoundState?.currentPlayerActions.some(action => 
                    action.type === 'buy_certificate' || action.type === 'start_corporation'
                  )
                    ? colors.button.disabled
                    : colors.button.primary
                }`}
                title={stockRoundState?.currentPlayerActions.some(action => 
                  action.type === 'buy_certificate' || action.type === 'start_corporation'
                ) ? "Already bought this turn" : "Buy shares"}
              >
                Buy
              </button>
              <button
                onClick={() => handleSellCertificate(corporation.id)}
                disabled={isFirstStockRound}
                className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-colors ${
                  isFirstStockRound ? colors.button.disabled : colors.button.secondary
                }`}
                title={isFirstStockRound ? "Selling not allowed in first stock round" : "Sell shares"}
              >
                Sell
              </button>
            </div>
          </div>
        ))
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-center space-x-4">
        <button
          onClick={() => undoLastStockAction()}
          disabled={!stockRoundState?.currentPlayerActions || stockRoundState.currentPlayerActions.length === 0}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            stockRoundState?.currentPlayerActions && stockRoundState.currentPlayerActions.length > 0
              ? `${colors.button.secondary} hover:bg-red-600 hover:text-white`
              : colors.button.disabled
          }`}
          title={stockRoundState?.currentPlayerActions && stockRoundState.currentPlayerActions.length > 0 
            ? "Undo last action" 
            : "No actions to undo"
          }
        >
          ↩️ Undo
        </button>

        <button
          onClick={() => nextStockPlayer()}
          className={`px-6 py-3 rounded-lg ${colors.button.secondary} font-medium transition-colors`}
        >
          Pass
        </button>
      </div>

      {/* Par Value Selection Modal */}


      
      {/* Par Value Selection Modal */}
      {showParValueModal && selectedCorporation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div style={{
            backgroundColor: 'white',
            color: 'black',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '16px'}}>
              Set Par Value for {selectedCorporation.name}
            </h3>
            
            <p style={{marginBottom: '20px', color: '#666'}}>
              Choose the par value for this corporation. This will be the initial share price.
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginBottom: '20px',
              maxHeight: '200px',
              overflow: 'auto'
            }}>
              {availableParValues.map((value) => (
                <button
                  key={value}
                  onClick={() => setSelectedParValue(value)}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: '1px solid #ddd',
                    backgroundColor: selectedParValue === value ? '#3b82f6' : '#f9fafb',
                    color: selectedParValue === value ? 'white' : '#374151',
                    cursor: 'pointer'
                  }}
                >
                  ${value}
                </button>
              ))}
            </div>
            
            <div style={{display: 'flex', gap: '12px'}}>
              <button
                onClick={() => {
                  const currentPlayer = players[currentPlayerIndex];
                  if (currentPlayer && selectedCorporation) {
                    buyPresidentCertificate(currentPlayer.id, selectedCorporation.abbreviation, selectedParValue);
                  }
                  setShowParValueModal(false);
                  setSelectedCorporation(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '500',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Start Corporation
              </button>
              <button
                onClick={() => {
                  setShowParValueModal(false);
                  setSelectedCorporation(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '500',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockRound;
