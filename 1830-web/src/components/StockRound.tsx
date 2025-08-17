import React from 'react';
import { useGameStore } from '../store/gameStore';
import { useColors } from '../styles/colors';
import { RoundType } from '../types/game';
import type { Corporation, Certificate } from '../types/game';

const StockRound: React.FC = () => {
  const { corporations, players, currentPlayerIndex } = useGameStore();
  const colors = useColors();

  // Debug logging
  console.log('StockRound - Corporations:', corporations);
  console.log('StockRound - Players:', players);
  console.log('StockRound - Corporations length:', corporations.length);
  console.log('StockRound - First corporation:', corporations[0]);

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {corporations.length === 0 ? (
          <div className={`col-span-full text-center py-8 ${colors.text.secondary}`}>
            <div className="mb-4">No corporations available. Please start a new game.</div>
            <button
              onClick={() => useGameStore.getState().initializeGame(['Player 1', 'Player 2', 'Player 3'])}
              className={`px-6 py-3 rounded-lg ${colors.button.primary} font-medium transition-colors`}
            >
              Initialize Test Game
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
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
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
                  if (playerCerts.length === 0) return null;
                  
                  const totalPercentage = playerCerts.reduce((sum, cert) => sum + cert.percentage, 0);
                  return (
                    <div key={player.id} className="flex justify-between items-center">
                      <span className={`text-xs ${colors.text.secondary}`}>{player.name}</span>
                      <span className={`text-xs font-medium ${colors.text.primary}`}>
                        {totalPercentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-colors ${colors.button.primary}`}
              >
                Buy
              </button>
              <button
                className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-colors ${colors.button.secondary}`}
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
          className={`px-6 py-3 rounded-lg ${colors.button.primary} font-medium transition-colors`}
        >
          Buy Certificate
        </button>
        <button
          className={`px-6 py-3 rounded-lg ${colors.button.secondary} font-medium transition-colors`}
        >
          Pass
        </button>
      </div>
    </div>
  );
};

export default StockRound;
