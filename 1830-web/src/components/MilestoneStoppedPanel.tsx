import React from 'react';
import { useGameStore } from '../store/gameStore';
import type { BankObligation } from '../engine/model';
import { useColors } from '../styles/colors';

/**
 * MilestoneStoppedPanel is the terminal screen shown when the bank has been
 * exhausted and the game has stopped at the milestone integration point.
 *
 * The engine records outstanding bank obligations that were not fully paid;
 * these are placeholders for reporting only. No winner is declared here —
 * that computation belongs to a later milestone.
 */
export const MilestoneStoppedPanel: React.FC = () => {
  const game = useGameStore((s) => s.game);
  const newGame = useGameStore((s) => s.newGame);
  const colors = useColors();
  if (game === null || game.round !== 'milestoneStopped') return null;

  const describeRecipient = (obligation: BankObligation): string => {
    if (obligation.recipient.type === 'player') {
      return game.players[obligation.recipient.playerId]?.name ?? obligation.recipient.playerId;
    }
    const corp = game.corporations[obligation.recipient.corporationId];
    return corp ? `${corp.abbreviation} — ${corp.name}` : obligation.recipient.corporationId;
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Bank exhausted — milestone stopped.</h1>

      <p className="opacity-80">
        These obligations are non-spendable placeholders. No winner is declared
        at this milestone.
      </p>

      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-2">Unpaid obligations</h2>
        {game.bankObligations.length === 0 ? (
          <p className="opacity-70">No outstanding obligations were recorded.</p>
        ) : (
          <ul className="space-y-1">
            {game.bankObligations.map((obligation) => (
              <li key={obligation.id} className="flex justify-between gap-4">
                <span>{describeRecipient(obligation)}</span>
                <span className="opacity-80">reason: {obligation.reason}</span>
                <span className="font-semibold">${obligation.amount}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={() => newGame()}
        className={`rounded px-4 py-2 font-medium ${colors.button.primary}`}
      >
        New Game
      </button>
    </section>
  );
};
