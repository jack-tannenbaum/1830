import React from 'react';
import { useGameStore } from '../store/gameStore';
import { PrivateAuction } from './PrivateAuction';
import { AuctionSummary } from './AuctionSummary';
import StockRound from './StockRound';
import { OperatingShell } from './OperatingShell';
import { MilestoneStoppedPanel } from './MilestoneStoppedPanel';
import { useThemeStore } from '../store/themeStore';

/**
 * GameBoard is a thin router keyed on the canonical `game.round` field.
 *
 * It owns no rule state, computes no view models, and never dispatches
 * commands. Each round has a dedicated panel component that reads whatever
 * it needs from the adapter store directly. The stock market and the
 * notification popup are mounted alongside every round panel because both
 * are always visible in-game.
 *
 * When no game is present, the component renders nothing; the setup screen
 * is owned by App.tsx.
 */
export const GameBoard: React.FC = () => {
  const game = useGameStore((s) => s.game);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  if (game === null) return null;
  const placeCardOrder = game.playerOrder
    .map((playerId) => game.players[playerId]?.name ?? playerId)
    .join(' → ');

  return (
    <div className="min-h-screen">
      <header
        className="border-b shadow-sm"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold">1830: Railways &amp; Robber Barons</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {game.round} • Place-card order: {placeCardOrder}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="rounded-lg px-3 py-2 text-lg"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
            }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4">
        {game.round === 'privateAuction' && (
          <>
            <PrivateAuction />
            <AuctionSummary />
          </>
        )}
        {game.round === 'stock' && <StockRound />}
        {game.round === 'operatingShell' && <OperatingShell />}
        {game.round === 'milestoneStopped' && <MilestoneStoppedPanel />}
      </main>
    </div>
  );
};
