import type { GameState } from '../engine/model';
import {
  getAuctionView,
  getCorporationPresident,
  getOperatingShellView,
  getStockRoundView,
} from '../engine/selectors';
import { useGameStore } from '../store/gameStore';
import { useColors } from '../styles/colors';

interface TurnDisplayProps {
  game: GameState;
}

function turnDetails(game: GameState): {
  actor: string | null;
  round: string;
  actions: string[];
} {
  if (game.round === 'privateAuction' && game.auction) {
    const view = getAuctionView(game);
    const actions: string[] = [];
    if (view.actions.mustSetBOPar) actions.push('Set B&O Par Value');
    if (view.actions.mayBuyOfferedPrivate) actions.push('Buy Cheapest Private');
    if (view.actions.advanceBidPrivateIds.length > 0) actions.push('Bid on Private');
    if (view.actions.mayRaiseBid) actions.push('Raise Bid');
    if (view.actions.mayPass) actions.push('Pass Auction');
    return {
      actor: view.currentPlayer.name,
      round: view.bidOff ? 'Auction bid-off' : 'Private auction',
      actions,
    };
  }

  if (game.round === 'stock' && game.stock) {
    const view = getStockRoundView(game);
    const actions: string[] = [];
    if (view.purchasableCertificateIds.length > 0 || game.stock.turn.purchaseCount === 0) {
      actions.push('Buy Certificate');
    }
    if (view.sellableCertificateIds.length > 0) actions.push('Sell Certificate');
    if (!game.isFirstStockRound) actions.push('Trade Private Company');
    if (view.mayFinishTurn) actions.push('Finish Turn');
    if (view.mayPass) actions.push('Pass Stock Round');
    return {
      actor: view.currentPlayer.name,
      round: 'Stock round',
      actions,
    };
  }

  if (game.round === 'operatingShell') {
    const corporation = getOperatingShellView(game).currentCorporation;
    return {
      actor: corporation ? corporation.abbreviation : null,
      round: 'Operating',
      actions: corporation ? [`End ${corporation.abbreviation} turn`] : [],
    };
  }

  return { actor: null, round: 'Game', actions: [] };
}

export function TurnDisplay({ game }: TurnDisplayProps) {
  const colors = useColors();
  const dispatch = useGameStore((state) => state.dispatch);
  const details = turnDetails(game);
  if (!details.actor) return null;

  const currentCorporation = game.round === 'operatingShell'
    ? getOperatingShellView(game).currentCorporation
    : null;
  const currentPresidentId = currentCorporation
    ? getCorporationPresident(game, currentCorporation.id)
    : null;

  const handleEndCorporationTurn = () => {
    if (!currentCorporation || !currentPresidentId) return;
    dispatch({
      id: crypto.randomUUID(),
      gameId: game.id,
      actorId: currentPresidentId,
      expectedVersion: game.version,
      type: 'operatingShell.endCorporationTurn',
      payload: { corporationId: currentCorporation.id },
    });
  };

  return (
    <div
      aria-label="Current turn"
      className={`flex items-center overflow-hidden rounded-lg border ${colors.card.background} ${colors.card.border}`}
      title={details.actions.length > 0 ? `Available actions: ${details.actions.join(', ')}` : undefined}
    >
      <div className="px-3 py-1.5 text-right leading-tight">
        <div className={`text-[11px] uppercase tracking-wide ${colors.text.tertiary}`}>{details.round}</div>
        <div className={`text-sm font-semibold ${colors.text.accent}`}>{details.actor}</div>
      </div>
      {currentCorporation && (
        <button
          type="button"
          onClick={handleEndCorporationTurn}
          disabled={!currentPresidentId}
          className={`self-stretch border-l px-3 text-sm font-medium ${
            currentPresidentId ? colors.button.primary : colors.button.disabled
          }`}
          style={{ borderColor: 'var(--border-color)' }}
        >
          End Turn
        </button>
      )}
    </div>
  );
}
