import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { STARTING_CASH } from '../engine/constants';
import { useColors } from '../styles/colors';

interface GameSetupProps {
  onGameStart: () => void;
}

function deriveDeterministicPlaceOrder(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const GameSetup: React.FC<GameSetupProps> = ({ onGameStart }) => {
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '', '']);
  const dispatch = useGameStore((state) => state.dispatch);
  const colors = useColors();

  const defaultNames = ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6'];
  const validPlayerCount = playerNames.filter((name) => name.trim() !== '').length;
  const startingCash = validPlayerCount >= 3 && validPlayerCount <= 6
    ? STARTING_CASH[validPlayerCount as 3 | 4 | 5 | 6]
    : null;

  const fillDefaultNames = () => {
    const namesToFill = playerNames.length;
    setPlayerNames(defaultNames.slice(0, namesToFill));
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const addPlayer = () => {
    if (playerNames.length < 6) {
      const newNames = [...playerNames, ''];
      setPlayerNames(newNames);
      // Auto-fill the new player's name
      if (newNames.length <= defaultNames.length) {
        const updatedNames = [...newNames];
        updatedNames[updatedNames.length - 1] = defaultNames[updatedNames.length - 1];
        setPlayerNames(updatedNames);
      }
    }
  };

  const removePlayer = (index: number) => {
    if (playerNames.length > 3) {
      const newNames = playerNames.filter((_, i) => i !== index);
      setPlayerNames(newNames);
    }
  };

  const handleStartGame = () => {
    const validNames = playerNames.filter(name => name.trim() !== '');
    if (validNames.length < 3 || validNames.length > 6) return;

    const commandId = crypto.randomUUID();
    const gameId = crypto.randomUUID();
    const placeOrder = deriveDeterministicPlaceOrder(validNames.length);

    const result = dispatch({
      id: commandId,
      gameId,
      actorId: `player-${placeOrder[0] + 1}`,
      expectedVersion: 0,
      type: 'game.create',
      payload: { playerNames: validNames, placeOrder },
    });

    if (result.ok) {
      onGameStart();
    }
  };

  const isValidSetup = () => {
    const validNames = playerNames.filter(name => name.trim() !== '');
    return validNames.length >= 3 && validNames.length <= 6;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center p-4">
      <div className={`${colors.card.background} ${colors.card.border} rounded-lg border shadow-2xl p-8 max-w-md w-full`}>
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${colors.text.primary}`}>1830</h1>
          <p className={colors.text.secondary}>Railways & Robber Barons</p>
        </div>

        <div className="space-y-4">
          <h2 className={`text-xl font-semibold mb-4 ${colors.text.primary}`}>Player Setup</h2>

          <div className="ui-actions mb-4">
            <button
              onClick={fillDefaultNames}
              className={`flex-1 py-2 rounded-md text-sm ${colors.button.primary}`}
            >
              Fill Default Names
            </button>
          </div>

          {playerNames.map((name, index) => (
            <div key={index} className="ui-actions">
              <input
                type="text"
                placeholder={`Player ${index + 1} Name`}
                value={name}
                onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                className="flex-1 rounded-md border px-3 py-2 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--bg-card-alt, var(--bg-card))',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                onClick={() => handlePlayerNameChange(index, defaultNames[index])}
                className={`rounded-md px-3 py-2 text-sm ${colors.button.secondary}`}
                title={`Fill ${defaultNames[index]}`}
              >
                {defaultNames[index].split(' ')[1]}
              </button>
              {playerNames.length > 3 && (
                <button
                  onClick={() => removePlayer(index)}
                  className={`rounded-md px-3 py-2 ${colors.button.danger}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {playerNames.length < 6 && (
            <button
              onClick={addPlayer}
              className={`w-full rounded-md border-2 border-dashed py-2 ${colors.text.secondary} ${colors.card.borderAlt}`}
            >
              + Add Player
            </button>
          )}

          <div className="pt-4">
            <p className={`mb-4 text-sm ${colors.text.secondary}`}>
              3-6 players required.
              {startingCash !== null && ` Each player starts with $${startingCash}.`}
            </p>

            <button
              onClick={handleStartGame}
              disabled={!isValidSetup()}
              className={`w-full py-3 font-semibold rounded-md transition-colors ${
                isValidSetup()
                  ? colors.button.success
                  : colors.button.disabled
              }`}
            >
              Start Game
            </button>

            <div className={`mt-4 border-t pt-4 ${colors.card.border}`}>
              <p className={`mb-3 text-center text-sm ${colors.text.secondary}`}>
                Developer Tools
              </p>
              <button
                onClick={() => window.location.href = '?test=map'}
                className={`mb-2 w-full rounded-md py-2 text-sm font-medium ${colors.button.warning}`}
              >
                🧪 Test Map System
              </button>
              <button
                onClick={() => window.location.href = '?test=hexgrid'}
                className={`mb-2 w-full rounded-md py-2 text-sm font-medium ${colors.button.warning}`}
              >
                🧪 Test Hex Grid
              </button>
              <button
                onClick={() => window.location.href = '?test=station'}
                className={`w-full rounded-md py-2 text-sm font-medium ${colors.button.warning}`}
              >
                🧪 Test Station System
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
