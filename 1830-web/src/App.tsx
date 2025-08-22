import { useState, useEffect } from 'react';
import { GameSetup } from './components/GameSetup';
import { GameBoard } from './components/GameBoard';
import MapGraphTest from './components/MapGraphTest';
import HexGridTest from './components/HexGridTest';
import StationTest from './components/StationTest';
import { useGameStore } from './store/gameStore';
import { useThemeStore } from './store/themeStore';
import { useColors } from './styles/colors';
// Import to ensure Tailwind includes these classes
import './tailwind-safelist.css';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [showResumeMenu, setShowResumeMenu] = useState(false);
  const { players, hasActiveGame, newGame } = useGameStore();
  const { theme } = useThemeStore();
  const colors = useColors();

  // Check if we want to show the map test
  const isMapTest = window.location.search.includes('test=map');
  const isHexGridTest = window.location.search.includes('test=hexgrid');
  const isStationTest = window.location.search.includes('test=station');

  useEffect(() => {
    // Check if there's an active game when the app loads
    if (hasActiveGame() && !gameStarted) {
      setShowResumeMenu(true);
    }
  }, [hasActiveGame, gameStarted]);

  useEffect(() => {
    // Set theme attribute on document element
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
      <div className={`min-h-screen flex items-center justify-center p-4 ${colors.layout.background}`}>
        <div className={`rounded-lg shadow-2xl p-8 max-w-md w-full ${colors.card.background} ${colors.card.border}`}>
          <div className="text-center mb-8">
            <h1 className={`text-4xl font-bold mb-2 ${colors.text.primary}`}>1830</h1>
            <p className={colors.text.secondary}>Game in Progress</p>
          </div>

          <div className="space-y-4">
            <h2 className={`text-xl font-semibold mb-4 ${colors.text.primary}`}>Found saved game with {players.length} players</h2>
            
            <button
              onClick={handleResumeGame}
              className={`w-full py-3 font-semibold rounded-md transition-colors ${colors.button.success}`}
            >
              Resume Game
            </button>
            
            <button
              onClick={handleNewGame}
              className={`w-full py-3 font-semibold rounded-md transition-colors ${colors.button.danger}`}
            >
              Start New Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show map test if requested
  if (isMapTest) {
    return <MapGraphTest />;
  }

  // Show hex grid test if requested
  if (isHexGridTest) {
    return <HexGridTest />;
  }

  // Show station test if requested
  if (isStationTest) {
    return <StationTest />;
  }

  // Show game board if game has started and has players
  if (gameStarted && players.length > 0) {
    return <GameBoard />;
  }

  // Show setup screen
  return <GameSetup onGameStart={handleGameStart} />;
}

export default App;
