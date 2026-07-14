import React from 'react';
import { useGameStore } from '../store/gameStore';
import {
  getCorporationPresident,
  getOperatingShellView,
  getStockMarketView,
} from '../engine/selectors';

/**
 * OperatingShell renders the integration harness for the Operating Round.
 *
 * The full Operating Round rules (track, tokens, trains, dividends, and
 * legal stock-market movement) are intentionally not implemented here. This
 * component exists so the outer round loop can turn over: it shows who is
 * operating and lets the current corporation's president advance to the
 * next corporation via a single explicit command.
 */
export const OperatingShell: React.FC = () => {
  const game = useGameStore((s) => s.game);
  const dispatch = useGameStore((s) => s.dispatch);
  if (game === null || game.round !== 'operatingShell') return null;

  const view = getOperatingShellView(game);
  const current = view.currentCorporation;
  const presidentId = current ? getCorporationPresident(game, current.id) : null;
  const marketPrice = current && current.market
    ? getStockMarketView(game).cells.find(
        (cell) =>
          cell.row === current.market!.row && cell.column === current.market!.column,
      )?.price ?? null
    : null;

  const handleEndCorporationTurn = () => {
    if (!current || !presidentId) return;
    dispatch({
      id: crypto.randomUUID(),
      gameId: game.id,
      actorId: presidentId,
      expectedVersion: game.version,
      type: 'operatingShell.endCorporationTurn',
      payload: { corporationId: current.id },
    });
  };

  return (
    <section className="space-y-4">
      <div
        role="alert"
        className="rounded-lg border-2 border-yellow-500 bg-yellow-100 text-yellow-900 p-4 font-semibold"
      >
        Integration harness: trains, routes, dividends, and legal operating
        market movement are not implemented.
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-2">Operating Order</h2>
        <ol className="space-y-1">
          {view.operatingOrder.map((corporation, index) => {
            const isCurrent = index === view.currentIndex;
            return (
              <li
                key={corporation.id}
                aria-current={isCurrent ? 'step' : undefined}
                className={
                  isCurrent
                    ? 'font-bold px-2 py-1 rounded bg-blue-100 text-blue-900'
                    : 'px-2 py-1'
                }
              >
                {index + 1}. {corporation.abbreviation} — {corporation.name}
              </li>
            );
          })}
        </ol>
      </div>

      {current && (
        <div className="rounded-lg border p-4 space-y-2">
          <h2 className="text-lg font-semibold">
            Now operating: {current.abbreviation} — {current.name}
          </h2>
          <p>Treasury: ${current.treasury}</p>
          <p>
            Market price:{' '}
            {current.market === null || marketPrice === null
              ? 'off market'
              : `$${marketPrice}`}
          </p>
          <button
            type="button"
            onClick={handleEndCorporationTurn}
            disabled={!presidentId}
            className="mt-2 px-4 py-2 rounded bg-blue-600 text-white font-medium disabled:opacity-50"
          >
            End Corporation Turn
          </button>
        </div>
      )}
    </section>
  );
};
