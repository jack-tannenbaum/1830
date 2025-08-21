import React from 'react';
import { useGameStore } from '../store/gameStore';
import { useColors } from '../styles/colors';
import type { Corporation } from '../types/game';
import { StockMarketDisplay } from './StockMarketDisplay';
import { getMarketPriceColor } from '../utils/stockMarketColors';

// Import findParValuePosition from gameStore
const findParValuePosition = (parValue: number): { x: number; y: number } | null => {
  const STOCK_MARKET_GRID = [
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
  ] as const;

  for (let y = 0; y < STOCK_MARKET_GRID.length; y++) {
    for (let x = 0; x < STOCK_MARKET_GRID[y].length; x++) {
      if (STOCK_MARKET_GRID[y][x] === parValue.toString()) {
        return { x, y };
      }
    }
  }
  return null;
};

const StockRound: React.FC = () => {
  const { corporations, players, currentPlayerIndex, stockMarket, buyCertificate, sellCertificate, undoLastStockAction, passStockRound, stockRoundState, pendingBoeffect } = useGameStore();
  
  // Debug: Log corporation share prices to see if they're updating
  React.useEffect(() => {
    console.log('=== DEBUG: StockRound component - Corporation share prices ===');
    corporations.forEach(corp => {
      console.log(`${corp.abbreviation}: $${corp.sharePrice}`);
    });
  }, [corporations]);

  const colors = useColors();
  const [debugFirstStockRound, setDebugFirstStockRound] = React.useState(false);
  const [showParValueModal, setShowParValueModal] = React.useState(false);
  const [selectedCorporation, setSelectedCorporation] = React.useState<Corporation | null>(null);
  const [selectedParValue, setSelectedParValue] = React.useState<number>(100);
  const [showStockMarket, setShowStockMarket] = React.useState(false);
  const boEffectShownRef = React.useRef<string | null>(null);

  // Handle B&O effect - show par value modal when pendingBoeffect is set
  React.useEffect(() => {
    if (pendingBoeffect && boEffectShownRef.current !== pendingBoeffect.corporationId) {
      const corporation = corporations.find(c => c.id === pendingBoeffect.corporationId);
      if (corporation) {
        setSelectedCorporation(corporation);
        setSelectedParValue(100); // Default to $100
        setShowParValueModal(true);
        boEffectShownRef.current = pendingBoeffect.corporationId; // Mark as shown
      }
    }
  }, [pendingBoeffect, corporations]);

  // Check if this is the first stock round (phase 1) or debug override
  const isFirstStockRound = debugFirstStockRound ? false : true; // Debug override: when checked, force later stock round (selling enabled)

  // Available par values (red spaces on stock market)
  const availableParValues = [67, 71, 76, 82, 90, 100];



  const handleBuyFromIPO = (corporationId: string) => {
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) return;
    
    // Check if player has already bought this turn
    const hasBoughtThisTurn = stockRoundState?.currentPlayerActions.some(action => 
      action.type === 'buy_certificate' || action.type === 'start_corporation'
    );
    
    if (hasBoughtThisTurn) {
      useGameStore.getState().addNotification({
        title: 'Already Bought This Turn',
        message: 'You have already bought shares this turn',
        type: 'warning',
        duration: 3000
      });
      return;
    }
    
    const corporation = corporations.find(c => c.id === corporationId);
    if (!corporation) return;
    
    // Check if player has sold this corporation this round (can't buy the same corporation after selling it)
    const hasSoldThisCorporationThisRound = stockRoundState?.currentPlayerActions.some(action => 
      action.type === 'sell_certificate' && action.data?.corporationId === corporationId
    );
    
    if (hasSoldThisCorporationThisRound) {
      useGameStore.getState().addNotification({
        title: 'Cannot Buy After Selling',
        message: `You cannot buy ${corporation.abbreviation} shares after selling ${corporation.abbreviation} shares in the same round`,
        type: 'warning',
        duration: 3000
      });
      return;
    }
    
    // Check if this is the first purchase (corporation not started)
    if (!corporation.started) {
      // Show par value selection modal
      setSelectedCorporation(corporation);
      setSelectedParValue(100); // Default to $100
      setShowParValueModal(true);
      return;
    }
    
    // Regular purchase from IPO for started corporation
    buyCertificate(currentPlayer.id, corporationId, undefined, false);
  };



  const handleBuyFromBank = (corporationId: string) => {
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) return;
    
    // Check if player has already bought this turn
    const hasBoughtThisTurn = stockRoundState?.currentPlayerActions.some(action => 
      action.type === 'buy_certificate' || action.type === 'start_corporation'
    );
    
    if (hasBoughtThisTurn) {
      useGameStore.getState().addNotification({
        title: 'Already Bought This Turn',
        message: 'You have already bought shares this turn',
        type: 'warning',
        duration: 3000
      });
      return;
    }
    
    const corporation = corporations.find(c => c.id === corporationId);
    if (!corporation) return;
    
    // Check if player has sold this corporation this round (can't buy the same corporation after selling it)
    const hasSoldThisCorporationThisRound = stockRoundState?.currentPlayerActions.some(action => 
      action.type === 'sell_certificate' && action.data?.corporationId === corporationId
    );
    
    if (hasSoldThisCorporationThisRound) {
      useGameStore.getState().addNotification({
        title: 'Cannot Buy After Selling',
        message: `You cannot buy ${corporation.abbreviation} shares after selling ${corporation.abbreviation} shares in the same round`,
        type: 'warning',
        duration: 3000
      });
      return;
    }
    
    // Can only buy from bank if corporation is started
    if (!corporation.started) {
      useGameStore.getState().addNotification({
        title: 'Corporation Not Started',
        message: 'Cannot buy from bank pool - corporation has not been started yet',
        type: 'warning',
        duration: 3000
      });
      return;
    }
    
    // Purchase from bank pool at market price
    buyCertificate(currentPlayer.id, corporationId, undefined, true);
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
    
    // Check first stock round restriction
    if (isFirstStockRound) {
      useGameStore.getState().addNotification({
        title: 'Selling Not Allowed',
        message: 'Selling shares is not allowed during the first stock round',
        type: 'warning',
        duration: 3000
      });
      return;
    }
    
    // For now, sell 1 share (10% certificate)
    const result = sellCertificate(currentPlayer.id, corporationId, 1);
    console.log('sellCertificate result:', result);
  };

  const handleCorporationClick = (corporation: Corporation) => {
    // This could be used for additional actions when clicking on a corporation in the stock market
    console.log('Corporation clicked:', corporation.name);
  };
  
  
  





  return (
    <div className={`${colors.card.background} rounded-lg ${colors.card.shadow} p-6`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${colors.text.primary}`}>Stock Round</h2>
          <div className={`text-sm ${colors.text.secondary}`}>
            Current Player: {players[currentPlayerIndex]?.name}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => undoLastStockAction()}
            disabled={!stockRoundState?.currentPlayerActions || stockRoundState.currentPlayerActions.length === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              stockRoundState?.currentPlayerActions && stockRoundState.currentPlayerActions.length > 0
                ? `${colors.button.secondary} hover:${colors.button.danger.split(' ')[1]} hover:text-white`
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
            onClick={() => passStockRound()}
            className={`px-4 py-2 rounded-lg ${colors.button.secondary} font-medium transition-colors`}
          >
            Pass
          </button>

          <button
            onClick={() => setShowStockMarket(!showStockMarket)}
            className={`px-4 py-2 rounded-lg transition-colors duration-300 font-medium ${
              showStockMarket 
                ? colors.button.success
                : colors.button.primary
            }`}
            title={showStockMarket ? "Switch to Corporations View" : "Switch to Stock Market View"}
          >
            {showStockMarket ? '📊 Stock Market' : '🏢 Corporations'}
          </button>
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

      {/* Content Area */}
      {showStockMarket ? (
        <StockMarketDisplay 
          onCorporationClick={handleCorporationClick}
          className="w-full"
        />
      ) : (
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
                {players
                  .map(player => {
                    const playerCerts = corporation.playerShares.get(player.id) || [];
                    const totalPercentage = playerCerts.reduce((sum, cert) => sum + cert.percentage, 0);
                    const isPresident = corporation.presidentId === player.id;
                    
                    return { player, totalPercentage, isPresident };
                  })
                  .filter(({ totalPercentage }) => totalPercentage > 0) // Hide players with 0% ownership
                  .sort((a, b) => b.totalPercentage - a.totalPercentage) // Sort by percentage (highest first)
                  .map(({ player, totalPercentage, isPresident }) => (
                    <div key={player.id} className="flex justify-between items-center">
                      <span className={`text-xs ${colors.text.secondary} flex items-center`}>
                        {player.name}
                        {isPresident && (
                          <span className="text-xs font-bold" style={{ color: '#FFD700', marginLeft: '4px' }}>
                            P
                          </span>
                        )}
                      </span>
                      <span className={`text-xs font-medium ${colors.text.primary}`}>
                        {totalPercentage}%
                      </span>
                    </div>
                  ))}
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
                <div className={`text-sm font-semibold ${corporation.sharePrice ? getMarketPriceColor(corporation.id, stockMarket, colors) : colors.text.primary}`}>
                  ${corporation.sharePrice || 'Not Set'}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {/* Buy Options */}
              <div className="flex space-x-1">
                <button
                  onClick={() => handleBuyFromIPO(corporation.id)}
                  disabled={stockRoundState?.currentPlayerActions.some(action => 
                    action.type === 'buy_certificate' || action.type === 'start_corporation'
                  ) || stockRoundState?.stockRoundActions.some(action => 
                    action.type === 'sell_certificate' && action.data?.corporationId === corporation.id
                  ) || corporation.ipoShares.length === 0}
                  className={`flex-1 py-2 px-2 rounded text-xs font-medium transition-colors ${
                    stockRoundState?.currentPlayerActions.some(action => 
                      action.type === 'buy_certificate' || action.type === 'start_corporation'
                    ) || stockRoundState?.stockRoundActions.some(action => 
                      action.type === 'sell_certificate' && action.data?.corporationId === corporation.id
                    ) || corporation.ipoShares.length === 0
                      ? colors.button.disabled
                      : colors.button.success
                  }`}
                  title={
                    stockRoundState?.currentPlayerActions.some(action => 
                      action.type === 'buy_certificate' || action.type === 'start_corporation'
                    ) ? "Already bought this turn" : 
                    stockRoundState?.stockRoundActions.some(action => 
                      action.type === 'sell_certificate' && action.data?.corporationId === corporation.id
                    ) ? "Cannot buy after selling this corporation this stock round" :
                    corporation.ipoShares.length === 0 ? "No shares in IPO" :
                    `Buy from IPO at $${corporation.parValue || 'par value'}`
                  }
                >
                  Buy IPO
                </button>
                <button
                  onClick={() => handleBuyFromBank(corporation.id)}
                  disabled={stockRoundState?.currentPlayerActions.some(action => 
                    action.type === 'buy_certificate' || action.type === 'start_corporation'
                  ) || stockRoundState?.stockRoundActions.some(action => 
                    action.type === 'sell_certificate' && action.data?.corporationId === corporation.id
                  ) || corporation.bankShares.length === 0}
                  className={`flex-1 py-2 px-2 rounded text-xs font-medium transition-colors ${
                    stockRoundState?.currentPlayerActions.some(action => 
                      action.type === 'buy_certificate' || action.type === 'start_corporation'
                    ) || stockRoundState?.stockRoundActions.some(action => 
                      action.type === 'sell_certificate' && action.data?.corporationId === corporation.id
                    ) || corporation.bankShares.length === 0
                      ? colors.button.disabled
                      : colors.button.primary
                  }`}
                  title={
                    stockRoundState?.currentPlayerActions.some(action => 
                      action.type === 'buy_certificate' || action.type === 'start_corporation'
                    ) ? "Already bought this turn" : 
                    stockRoundState?.stockRoundActions.some(action => 
                      action.type === 'sell_certificate' && action.data?.corporationId === corporation.id
                    ) ? "Cannot buy after selling this corporation this stock round" :
                    corporation.bankShares.length === 0 ? "No shares in bank" :
                    `Buy from bank at $${corporation.sharePrice}`
                  }
                >
                  Buy Bank
                </button>
              </div>
              
              {/* Sell Button */}
              <button
                onClick={() => handleSellCertificate(corporation.id)}
                className={`w-full py-2 px-3 rounded text-xs font-medium transition-colors ${
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
      )}



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
                    // Check if this is a B&O effect (corporation already started but needs par value)
                    const isBoeffect = selectedCorporation.name === 'Baltimore & Ohio' && selectedCorporation.started && !selectedCorporation.parValue;
                    
                    if (isBoeffect) {
                      // For B&O effect, just set the par value without buying another certificate
                      const parValuePosition = findParValuePosition(selectedParValue);
                      if (parValuePosition) {
                        useGameStore.getState().setGameState({
                          corporations: corporations.map(c => 
                            c.id === selectedCorporation.id 
                              ? { ...c, parValue: selectedParValue, sharePrice: selectedParValue }
                              : c
                          ),
                          stockMarket: {
                            ...stockMarket,
                            tokenPositions: new Map([
                              ...stockMarket.tokenPositions,
                              [selectedCorporation.id, parValuePosition]
                            ])
                          },
                          pendingBoeffect: undefined // Clear the pending effect
                        });
                        
                        useGameStore.getState().addNotification({
                          title: 'Baltimore & Ohio Par Value Set',
                          message: `${selectedCorporation.name} par value set to $${selectedParValue}`,
                          type: 'success',
                          duration: 3000
                        });
                      }
                    } else {
                      // Normal corporation start
                      buyCertificate(currentPlayer.id, selectedCorporation.id, selectedParValue);
                    }
                  }
                  setShowParValueModal(false);
                  setSelectedCorporation(null);
                  boEffectShownRef.current = null; // Reset the ref
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
