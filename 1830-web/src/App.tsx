import { useEffect, useRef, useState } from 'react';

import { GameBoard } from './components/GameBoard';
import { GameSetup } from './components/GameSetup';
import { NotificationPopup } from './components/NotificationPopup';
import { useGameStore } from './store/gameStore';
import { useThemeStore } from './store/themeStore';
import { useColors } from './styles/colors';

type AppScreen = 'loading' | 'setup' | 'resume' | 'game';

function App() {
  const game = useGameStore((state) => state.game);
  const load = useGameStore((state) => state.load);
  const newGame = useGameStore((state) => state.newGame);
  const theme = useThemeStore((state) => state.theme);
  const colors = useColors();
  const [screen, setScreen] = useState<AppScreen>('loading');
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }
    hasLoadedRef.current = true;
    setScreen(load() ? 'resume' : 'setup');
  }, [load]);

  const startNewGame = () => {
    newGame();
    setScreen('setup');
  };

  const resumeMenu = game === null ? null : (
    <div className={`flex min-h-screen items-center justify-center p-4 ${colors.layout.background}`}>
      <div className={`w-full max-w-md rounded-lg border p-8 shadow-2xl ${colors.card.background} ${colors.card.border}`}>
        <div className="mb-8 text-center">
          <h1 className={`mb-2 text-4xl font-bold ${colors.text.primary}`}>1830</h1>
          <p className={colors.text.secondary}>Game in Progress</p>
        </div>
        <div className="space-y-4">
          <div className={`rounded-lg border p-4 ${colors.card.border}`}>
            <p className={`font-semibold ${colors.text.primary}`}>
              {game.playerOrder.length} players · {game.round === 'privateAuction' ? 'Private Company Auction' : game.round === 'stock' ? 'Stock Round' : game.round === 'operatingShell' ? 'Operating Round' : 'Milestone Complete'}
            </p>
            <p className={`mt-1 text-sm ${colors.text.secondary}`}>
              {game.playerOrder.map((id) => game.players[id]?.name ?? id).join(' · ')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setScreen('game')}
            className={`w-full rounded-md py-3 font-semibold ${colors.button.success}`}
          >
            Resume Game
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Start a new game? This will permanently delete the current saved game.')) {
                startNewGame();
              }
            }}
            className={`w-full rounded-md py-3 font-semibold ${colors.button.danger}`}
          >
            Start New Game
          </button>
        </div>
      </div>
    </div>
  );

  let content = null;
  if (screen === 'setup') {
    content = <GameSetup onGameStart={() => setScreen('game')} />;
  } else if (screen === 'resume') {
    content = resumeMenu;
  } else if (screen === 'game' && game !== null) {
    content = <GameBoard onReturnToMenu={() => setScreen('resume')} />;
  }

  return (
    <>
      {content}
      <NotificationPopup />
    </>
  );
}

export default App;
