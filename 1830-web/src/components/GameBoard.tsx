import React from 'react';
import { useGameStore } from '../store/gameStore';
import { PrivateAuction } from './PrivateAuction';
import { AuctionSummary } from './AuctionSummary';
import StockRound from './StockRound';
import { StockMarketDisplay } from './StockMarketDisplay';
import { NotificationPopup } from './NotificationPopup';
import { OperatingShell } from './OperatingShell';
import { MilestoneStoppedPanel } from './MilestoneStoppedPanel';

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
  if (game === null) return null;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-4">
        <header className="mb-4">
          <h1 className="text-2xl font-bold">1830: Railways &amp; Robber Barons</h1>
          <p className="text-sm opacity-80">Round: {game.round}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {game.round === 'privateAuction' && (
              <>
                <PrivateAuction />
                <AuctionSummary />
              </>
            )}
            {game.round === 'stock' && <StockRound />}
            {game.round === 'operatingShell' && <OperatingShell />}
            {game.round === 'milestoneStopped' && <MilestoneStoppedPanel />}
          </div>

          <aside className="lg:col-span-1">
            <StockMarketDisplay />
          </aside>
        </div>
      </div>

      <NotificationPopup />
    </div>
  );
};
