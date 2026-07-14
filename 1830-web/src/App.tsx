import { useEffect, useRef } from 'react';

import { GameBoard } from './components/GameBoard';
import { GameSetup } from './components/GameSetup';
import { NotificationPopup } from './components/NotificationPopup';
import { useGameStore } from './store/gameStore';

function App() {
  const game = useGameStore((state) => state.game);
  const load = useGameStore((state) => state.load);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }
    hasLoadedRef.current = true;
    load();
  }, [load]);

  return (
    <>
      {game === null ? <GameSetup /> : <GameBoard />}
      <NotificationPopup />
    </>
  );
}

export default App;
