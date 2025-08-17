import { useState, useEffect } from 'react';
import { GameSetup } from './components/GameSetup';
import { GameBoard } from './components/GameBoard';
import { useGameStore } from './store/gameStore';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [showResumeMenu, setShowResumeMenu] = useState(false);
  const { players, hasActiveGame, newGame } = useGameStore();

  useEffect(() => {
    // Check if there's an active game when the app loads
    if (hasActiveGame() && !gameStarted) {
      setShowResumeMenu(true);
    }
  }, [hasActiveGame, gameStarted]);

  const handleGameStart = () => {
    setGameStarted(true);
    setShowResumeMenu(false);
  };

  const handleResumeGame = () => {
    setGameStarted(true);
    setShowResumeMenu(false);
  };

  const handleNewGame = () => {
    newGame();
    setGameStarted(false);
    setShowResumeMenu(false);
  };

  // Show resume/new game menu if there's a saved game
  if (showResumeMenu) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">1830</h1>
            <p className="text-gray-600">Game in Progress</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Found saved game with {players.length} players</h2>
            
            <button
              onClick={handleResumeGame}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
            >
              Resume Game
            </button>
            
            <button
              onClick={handleNewGame}
              className="w-full py-3 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors"
            >
              Start New Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show game board if game has started and has players
  if (gameStarted && players.length > 0) {
    return <GameBoard />;
  }

  // Show setup screen
  return <GameSetup onGameStart={handleGameStart} />;
}

export default App;
