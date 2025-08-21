import React from 'react';
import { useGameStore } from '../store/gameStore';
import { useColors } from '../styles/colors';
import { ActionType } from '../types/game';

export const TurnDisplay: React.FC = () => {
  const { currentTurn, players, roundType, isPlayerTurn, getAvailableActions } = useGameStore();
  const colors = useColors();

  if (!currentTurn || !currentTurn.isActive) {
    return null;
  }

  const currentPlayer = players.find(p => p.id === currentTurn.playerId);
  const availableActions = getAvailableActions();
  const timeRemaining = Math.max(0, currentTurn.timeoutMs - (Date.now() - currentTurn.startTime));
  const timeRemainingSeconds = Math.ceil(timeRemaining / 1000);

  // Format action names for display
  const formatActionName = (action: ActionType): string => {
    switch (action) {
      case ActionType.BUY_CHEAPEST_PRIVATE:
        return 'Buy Cheapest Private';
      case ActionType.BID_ON_PRIVATE:
        return 'Bid on Private';
      case ActionType.PASS_PRIVATE_AUCTION:
        return 'Pass Auction';
      case ActionType.BUY_CERTIFICATE:
        return 'Buy Certificate';
      case ActionType.BUY_PRESIDENT_CERTIFICATE:
        return 'Buy President Certificate';
      case ActionType.SELL_CERTIFICATE:
        return 'Sell Certificate';
      case ActionType.PASS_STOCK:
        return 'Pass Stock Round';
      case ActionType.LAY_TRACK:
        return 'Lay Track';
      case ActionType.PLACE_TOKEN:
        return 'Place Token';
      case ActionType.RUN_TRAINS:
        return 'Run Trains';
      case ActionType.BUY_TRAIN:
        return 'Buy Train';
      case ActionType.DECLARE_DIVIDEND:
        return 'Declare Dividend';
      default:
        return action;
    }
  };

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${colors.card.background} ${colors.card.border} rounded-lg shadow-lg p-4 min-w-80`}>
      <div className="text-center">
        <h3 className={`text-lg font-semibold mb-2 ${colors.text.primary}`}>
          Current Turn
        </h3>
        
        <div className={`text-xl font-bold mb-2 ${colors.text.accent}`}>
          {currentPlayer?.name || 'Unknown Player'}
        </div>
        
        <div className={`text-sm mb-3 ${colors.text.secondary}`}>
          {roundType.replace('_', ' ').toUpperCase()} ROUND
        </div>
        
        {/* Time remaining */}
        <div className={`text-sm font-medium mb-3 ${
          timeRemainingSeconds <= 10 ? colors.text.danger : 
          timeRemainingSeconds <= 30 ? colors.text.warning : 
          colors.text.success
        }`}>
          Time Remaining: {timeRemainingSeconds}s
        </div>
        
        {/* Available actions */}
        <div className="text-left">
          <div className={`text-xs font-medium mb-1 ${colors.text.secondary}`}>
            Available Actions:
          </div>
          <div className="space-y-1">
            {availableActions.map((action) => (
              <div key={action} className={`text-xs ${colors.text.tertiary}`}>
                • {formatActionName(action)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
