import { useState } from 'react';
import { GameSetup } from './components/GameSetup';
import { GameBoard } from './components/GameBoard';
import { useGameStore } from './store/gameStore';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const { players } = useGameStore();

  const handleGameStart = () => {
    setGameStarted(true);
  };



  // Show game board if game has started and has players
  if (gameStarted && players.length > 0) {
    return <GameBoard />;
  }

  // Show setup screen
  return <GameSetup onGameStart={handleGameStart} />;
}

export default App;
