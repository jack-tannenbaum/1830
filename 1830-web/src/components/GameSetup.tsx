import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';

interface GameSetupProps {
  onGameStart: () => void;
}

export const GameSetup: React.FC<GameSetupProps> = ({ onGameStart }) => {
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '', '']);
  const { initializeGame } = useGameStore();

  const defaultNames = ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6'];

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
    if (validNames.length >= 3) {
      initializeGame(validNames);
      onGameStart();
    }
  };

  const isValidSetup = () => {
    const validNames = playerNames.filter(name => name.trim() !== '');
    return validNames.length >= 3 && validNames.length <= 6;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full border border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">1830</h1>
          <p className="text-gray-600">Railways & Robber Barons</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Player Setup</h2>
          
          <div className="flex gap-2 mb-4">
            <button
              onClick={fillDefaultNames}
              className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors text-sm"
            >
              Fill Default Names
            </button>
          </div>
          
          {playerNames.map((name, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                placeholder={`Player ${index + 1} Name`}
                value={name}
                onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <button
                onClick={() => handlePlayerNameChange(index, defaultNames[index])}
                className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors text-sm"
                title={`Fill ${defaultNames[index]}`}
              >
                {defaultNames[index].split(' ')[1]}
              </button>
              {playerNames.length > 3 && (
                <button
                  onClick={() => removePlayer(index)}
                  className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {playerNames.length < 6 && (
            <button
              onClick={addPlayer}
              className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-md transition-colors hover:border-green-500 hover:text-green-600"
            >
              + Add Player
            </button>
          )}

          <div className="pt-4">
            <p className="text-sm text-gray-500 mb-4">
              3-6 players required. Each player starts with $600.
            </p>
            
            <button
              onClick={handleStartGame}
              disabled={!isValidSetup()}
              className={`w-full py-3 font-semibold rounded-md transition-colors ${
                isValidSetup() 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Start Game
            </button>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-3 text-center">
                Developer Tools
              </p>
              <button
                onClick={() => window.location.href = '?test=map'}
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-md transition-colors text-sm"
              >
                🧪 Test Map System
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
