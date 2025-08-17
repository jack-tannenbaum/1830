import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useColors } from '../styles/colors';
import { Corporation, Certificate, RoundType } from '../types/game';
import { CORPORATIONS, GAME_CONSTANTS } from '../types/constants';

interface StockRoundProps {}

export const StockRound: React.FC<StockRoundProps> = () => {
  const {
    players,
    corporations,
    currentPlayerIndex,
    roundType,
    buyCertificate,
    buyPresidentCertificate,
    sellCertificate,
    nextPlayer,
    nextRound,
    addNotification
  } = useGameStore();

  const colors = useColors();
  const currentPlayer = players[currentPlayerIndex];
  const [selectedAction, setSelectedAction] = useState<'buy' | 'sell' | 'float' | null>(null);
  const [selectedCorporation, setSelectedCorporation] = useState<Corporation | null>(null);
  const [selectedShares, setSelectedShares] = useState<number>(1);
  const [parValue, setParValue] = useState<number>(100);

  // Available par values for floating corporations
  const parValues = [67, 71, 76, 82, 90, 100, 112, 125, 142, 160, 180, 200, 225, 250, 275, 300, 325, 350];

  // Get unfloated corporations
  const unfloatedCorporations = CORPORATIONS.filter(corp => 
    !corporations.some(existing => existing.abbreviation === corp.abbreviation)
  );

  // Get player's certificates by corporation
  const getPlayerCertificates = (playerId: string, corporationId: string): Certificate[] => {
    return currentPlayer?.certificates.filter(cert => cert.corporationId === corporationId) || [];
  };

  // Get corporation by ID
  const getCorporation = (corporationId: string): Corporation | undefined => {
    return corporations.find(corp => corp.id === corporationId);
  };

  // Calculate certificate limit for current player count
  const certificateLimit = GAME_CONSTANTS.CERTIFICATE_LIMIT[players.length as keyof typeof GAME_CONSTANTS.CERTIFICATE_LIMIT] || 11;

  // Check if player can buy more certificates
  const canBuyMoreCertificates = (): boolean => {
    if (!currentPlayer) return false;
    return currentPlayer.certificates.length < certificateLimit;
  };

  // Check if player can buy from corporation
  const canBuyFromCorporation = (corporation: Corporation): boolean => {
    if (!currentPlayer || !canBuyMoreCertificates()) return false;
    
    // Check if corporation has available shares
    const availableShares = corporation.availableShares.length;
    if (availableShares === 0) return false;

    // Check if player can afford the share
    const shareCost = corporation.sharePrice;
    return currentPlayer.cash >= shareCost;
  };

  // Check if player can sell certificates
  const canSellCertificates = (corporation: Corporation): boolean => {
    if (!currentPlayer) return false;
    
    const playerCerts = getPlayerCertificates(currentPlayer.id, corporation.id);
    return playerCerts.length > 0;
  };

  // Check if player can float a corporation
  const canFloatCorporation = (): boolean => {
    if (!currentPlayer) return false;
    
    // Player must have enough cash for president's certificate
    const presidentCost = parValue * (GAME_CONSTANTS.PRESIDENT_SHARE_PERCENTAGE / 100);
    return currentPlayer.cash >= presidentCost;
  };

  const handleBuyCertificate = () => {
    if (!selectedCorporation || !currentPlayer) return;
    
    const success = buyCertificate(currentPlayer.id, selectedCorporation.id);
    if (success) {
      addNotification({
        title: 'Certificate Purchased',
        message: `${currentPlayer.name} bought a certificate of ${selectedCorporation.name} for $${selectedCorporation.sharePrice}`,
        type: 'info',
        duration: 3000
      });
      setSelectedAction(null);
      setSelectedCorporation(null);
    }
  };

  const handleSellCertificate = () => {
    if (!selectedCorporation || !currentPlayer) return;
    
    const success = sellCertificate(currentPlayer.id, selectedCorporation.id, selectedShares);
    if (success) {
      addNotification({
        title: 'Certificate Sold',
        message: `${currentPlayer.name} sold ${selectedShares} certificate(s) of ${selectedCorporation.name} for $${selectedCorporation.sharePrice * selectedShares}`,
        type: 'info',
        duration: 3000
      });
      setSelectedAction(null);
      setSelectedCorporation(null);
      setSelectedShares(1);
    }
  };

  const handleFloatCorporation = () => {
    if (!currentPlayer || !selectedCorporation) return;
    
    const success = buyPresidentCertificate(currentPlayer.id, selectedCorporation.id, parValue);
    if (success) {
      addNotification({
        title: 'Corporation Floated',
        message: `${currentPlayer.name} floated ${selectedCorporation.name} at par value $${parValue}`,
        type: 'info',
        duration: 4000
      });
      setSelectedAction(null);
      setSelectedCorporation(null);
      setParValue(100);
    }
  };

  const handlePass = () => {
    nextPlayer();
    setSelectedAction(null);
    setSelectedCorporation(null);
    setSelectedShares(1);
    setParValue(100);
  };

  const handleEndStockRound = () => {
    nextRound();
    addNotification({
      title: 'Stock Round Ended',
      message: 'Moving to Operating Round',
      type: 'info',
      duration: 3000
    });
  };

  return (
    <div className={`${colors.card.background} rounded-lg ${colors.card.shadow} p-6`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-semibold ${colors.text.primary}`}>Stock Round</h2>
        <div className={`text-sm ${colors.text.secondary}`}>
          Certificate Limit: {currentPlayer?.certificates.length || 0}/{certificateLimit}
        </div>
      </div>

      {/* Current Player Info */}
      <div className={`${colors.card.backgroundAlt} rounded-lg p-4 mb-6 ${colors.card.borderAlt}`}>
        <h3 className={`text-lg font-semibold mb-2 ${colors.text.primary}`}>
          Current Player: {currentPlayer?.name}
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className={colors.text.secondary}>Cash: </span>
            <span className={`font-semibold ${colors.text.success}`}>${currentPlayer?.cash}</span>
          </div>
          <div>
            <span className={colors.text.secondary}>Certificates: </span>
            <span className={`font-semibold ${colors.text.primary}`}>
              {currentPlayer?.certificates.length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Action Selection */}
      {!selectedAction && (
        <div className="mb-6">
          <h3 className={`text-lg font-semibold mb-3 ${colors.text.primary}`}>Choose Action</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedAction('buy')}
              disabled={!canBuyMoreCertificates()}
              className={`p-3 rounded-lg transition-colors ${
                canBuyMoreCertificates() 
                  ? colors.button.primary 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Buy Certificate
            </button>
            <button
              onClick={() => setSelectedAction('sell')}
              className={`p-3 rounded-lg transition-colors ${colors.button.danger}`}
            >
              Sell Certificate
            </button>
            <button
              onClick={() => setSelectedAction('float')}
              disabled={!canFloatCorporation()}
              className={`p-3 rounded-lg transition-colors ${
                canFloatCorporation() 
                  ? colors.button.success 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Float Corporation
            </button>
            <button
              onClick={handlePass}
              className={`p-3 rounded-lg transition-colors ${colors.button.secondary}`}
            >
              Pass
            </button>
          </div>
        </div>
      )}

      {/* Buy Certificate */}
      {selectedAction === 'buy' && (
        <div className="mb-6">
          <h3 className={`text-lg font-semibold mb-3 ${colors.text.primary}`}>Buy Certificate</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Floated Corporations */}
            <div>
              <h4 className={`font-medium mb-2 ${colors.text.primary}`}>Floated Corporations</h4>
              <div className="space-y-2">
                {corporations.map(corp => (
                  <div
                    key={corp.id}
                    onClick={() => setSelectedCorporation(corp)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedCorporation?.id === corp.id
                        ? colors.player.current
                        : colors.card.backgroundAlt
                    } ${colors.card.borderAlt}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: corp.color }}
                        >
                          {corp.abbreviation}
                        </div>
                        <span className={colors.text.primary}>{corp.name}</span>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${colors.text.success}`}>${corp.sharePrice}</div>
                        <div className={`text-xs ${colors.text.secondary}`}>
                          {corp.availableShares.length} shares
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col justify-center space-y-3">
              {selectedCorporation && (
                <div className={`${colors.card.backgroundAlt} p-4 rounded-lg ${colors.card.borderAlt}`}>
                  <h4 className={`font-medium mb-2 ${colors.text.primary}`}>Selected Corporation</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: selectedCorporation.color }}
                    >
                      {selectedCorporation.abbreviation}
                    </div>
                    <span className={colors.text.primary}>{selectedCorporation.name}</span>
                  </div>
                  <div className={`text-lg font-semibold ${colors.text.success}`}>
                    ${selectedCorporation.sharePrice}
                  </div>
                  <div className={`text-sm ${colors.text.secondary}`}>
                    {selectedCorporation.availableShares.length} shares available
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2">
                <button
                  onClick={handleBuyCertificate}
                  disabled={!selectedCorporation || !canBuyFromCorporation(selectedCorporation)}
                  className={`flex-1 py-2 px-4 rounded transition-colors ${
                    selectedCorporation && canBuyFromCorporation(selectedCorporation)
                      ? colors.button.primary
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Buy Certificate
                </button>
                <button
                  onClick={() => {
                    setSelectedAction(null);
                    setSelectedCorporation(null);
                  }}
                  className={`py-2 px-4 rounded transition-colors ${colors.button.secondary}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sell Certificate */}
      {selectedAction === 'sell' && (
        <div className="mb-6">
          <h3 className={`text-lg font-semibold mb-3 ${colors.text.primary}`}>Sell Certificate</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Player's Certificates */}
            <div>
              <h4 className={`font-medium mb-2 ${colors.text.primary}`}>Your Certificates</h4>
              <div className="space-y-2">
                {corporations
                  .filter(corp => canSellCertificates(corp))
                  .map(corp => {
                    const playerCerts = getPlayerCertificates(currentPlayer!.id, corp.id);
                    return (
                      <div
                        key={corp.id}
                        onClick={() => setSelectedCorporation(corp)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedCorporation?.id === corp.id
                            ? colors.player.current
                            : colors.card.backgroundAlt
                        } ${colors.card.borderAlt}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: corp.color }}
                            >
                              {corp.abbreviation}
                            </div>
                            <span className={colors.text.primary}>{corp.name}</span>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${colors.text.success}`}>${corp.sharePrice}</div>
                            <div className={`text-xs ${colors.text.secondary}`}>
                              {playerCerts.length} certificates
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col justify-center space-y-3">
              {selectedCorporation && (
                <div className={`${colors.card.backgroundAlt} p-4 rounded-lg ${colors.card.borderAlt}`}>
                  <h4 className={`font-medium mb-2 ${colors.text.primary}`}>Sell Certificates</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: selectedCorporation.color }}
                    >
                      {selectedCorporation.abbreviation}
                    </div>
                    <span className={colors.text.primary}>{selectedCorporation.name}</span>
                  </div>
                  <div className="mb-3">
                    <label className={`block text-sm ${colors.text.secondary} mb-1`}>
                      Number of certificates to sell:
                    </label>
                    <select
                      value={selectedShares}
                      onChange={(e) => setSelectedShares(Number(e.target.value))}
                      className={`w-full p-2 rounded border ${colors.auction.bidInput.background} ${colors.auction.bidInput.border}`}
                    >
                      {Array.from({ length: getPlayerCertificates(currentPlayer!.id, selectedCorporation.id).length }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                  <div className={`text-lg font-semibold ${colors.text.success}`}>
                    Total: ${selectedCorporation.sharePrice * selectedShares}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2">
                <button
                  onClick={handleSellCertificate}
                  disabled={!selectedCorporation}
                  className={`flex-1 py-2 px-4 rounded transition-colors ${
                    selectedCorporation ? colors.button.danger : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Sell Certificate{selectedShares > 1 ? 's' : ''}
                </button>
                <button
                  onClick={() => {
                    setSelectedAction(null);
                    setSelectedCorporation(null);
                    setSelectedShares(1);
                  }}
                  className={`py-2 px-4 rounded transition-colors ${colors.button.secondary}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Float Corporation */}
      {selectedAction === 'float' && (
        <div className="mb-6">
          <h3 className={`text-lg font-semibold mb-3 ${colors.text.primary}`}>Float Corporation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Available Corporations */}
            <div>
              <h4 className={`font-medium mb-2 ${colors.text.primary}`}>Available Corporations</h4>
              <div className="space-y-2">
                {unfloatedCorporations.map(corp => (
                  <div
                    key={corp.abbreviation}
                    onClick={() => setSelectedCorporation(corp as Corporation)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedCorporation?.abbreviation === corp.abbreviation
                        ? colors.player.current
                        : colors.card.backgroundAlt
                    } ${colors.card.borderAlt}`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: corp.color }}
                      >
                        {corp.abbreviation}
                      </div>
                      <span className={colors.text.primary}>{corp.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col justify-center space-y-3">
              {selectedCorporation && (
                <div className={`${colors.card.backgroundAlt} p-4 rounded-lg ${colors.card.borderAlt}`}>
                  <h4 className={`font-medium mb-2 ${colors.text.primary}`}>Float Corporation</h4>
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: selectedCorporation.color }}
                    >
                      {selectedCorporation.abbreviation}
                    </div>
                    <span className={colors.text.primary}>{selectedCorporation.name}</span>
                  </div>
                  <div className="mb-3">
                    <label className={`block text-sm ${colors.text.secondary} mb-1`}>
                      Par Value:
                    </label>
                    <select
                      value={parValue}
                      onChange={(e) => setParValue(Number(e.target.value))}
                      className={`w-full p-2 rounded border ${colors.auction.bidInput.background} ${colors.auction.bidInput.border}`}
                    >
                      {parValues.map(value => (
                        <option key={value} value={value}>${value}</option>
                      ))}
                    </select>
                  </div>
                  <div className={`text-sm ${colors.text.secondary}`}>
                    President's Certificate: ${parValue * (GAME_CONSTANTS.PRESIDENT_SHARE_PERCENTAGE / 100)}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2">
                <button
                  onClick={handleFloatCorporation}
                  disabled={!selectedCorporation || !canFloatCorporation()}
                  className={`flex-1 py-2 px-4 rounded transition-colors ${
                    selectedCorporation && canFloatCorporation()
                      ? colors.button.success
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Float Corporation
                </button>
                <button
                  onClick={() => {
                    setSelectedAction(null);
                    setSelectedCorporation(null);
                    setParValue(100);
                  }}
                  className={`py-2 px-4 rounded transition-colors ${colors.button.secondary}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* End Stock Round Button */}
      <div className="flex justify-end">
        <button
          onClick={handleEndStockRound}
          className={`py-2 px-6 rounded transition-colors ${colors.button.warning}`}
        >
          End Stock Round
        </button>
      </div>
    </div>
  );
};
