import React from 'react';
import { useGameStore } from '../store/gameStore';
import { getAuctionView } from '../engine/selectors';
import type {
  CorporationState,
  GameState,
  PlayerState,
  PrivateLocation,
  PrivateState,
} from '../engine/model';
import { useColors } from '../styles/colors';

type ThemeColors = ReturnType<typeof useColors>;

function describeLocation(
  location: PrivateLocation,
  players: Record<string, PlayerState>,
  corporations: Record<string, CorporationState>,
): string {
  switch (location.type) {
    case 'bank':
      return 'In bank';
    case 'player': {
      const player = players[location.playerId];
      return `Owned by ${player?.name ?? location.playerId}`;
    }
    case 'corporation': {
      const corporation = corporations[location.corporationId];
      return `Held by ${corporation?.name ?? location.corporationId}`;
    }
    case 'closed':
      return 'Closed';
  }
}

interface PrivateRowProps {
  privateCompany: PrivateState;
  lockedAmount: number;
  bids: Array<{ playerId: string; amount: number }>;
  players: Record<string, PlayerState>;
  corporations: Record<string, CorporationState>;
  colors: ThemeColors;
}

const PrivateRow: React.FC<PrivateRowProps> = ({
  privateCompany,
  lockedAmount,
  bids,
  players,
  corporations,
  colors,
}) => {
  const locationLabel = describeLocation(privateCompany.location, players, corporations);
  const highestBid = bids[0];
  return (
    <div
      className={`${colors.auctionSummary.companyCard.background} ${colors.auctionSummary.companyCard.border} rounded p-3 border`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <div className={`font-semibold ${colors.auctionSummary.companyCard.name}`}>
          {privateCompany.name}
        </div>
        <div className={`text-sm ${colors.auctionSummary.companyCard.price}`}>
          ${privateCompany.faceValue} face / ${privateCompany.revenue} rev
        </div>
      </div>
      <div className={`text-xs ${colors.text.secondary} mt-1`}>{locationLabel}</div>
      {highestBid ? (
        <div className={`text-xs ${colors.text.secondary} mt-1`}>
          Top bid: ${highestBid.amount} by{' '}
          {players[highestBid.playerId]?.name ?? highestBid.playerId}
          {bids.length > 1 ? ` (+${bids.length - 1} more)` : ''}
        </div>
      ) : null}
      {lockedAmount > 0 ? (
        <div className={`text-xs ${colors.text.secondary} mt-1`}>
          Locked by current actor: ${lockedAmount}
        </div>
      ) : null}
    </div>
  );
};

const selectGame = (state: { game: GameState | null }) => state.game;

export const AuctionSummary: React.FC = () => {
  const game = useGameStore(selectGame);
  const colors = useColors();

  const view = React.useMemo(() => {
    if (!game || game.round !== 'privateAuction') return null;
    return getAuctionView(game);
  }, [game]);

  if (!game || game.round !== 'privateAuction' || !view) {
    return null;
  }

  const bidOff = view.bidOff;
  const currentPrivate = view.currentPrivate;

  return (
    <div className={`${colors.card.background} rounded-lg shadow-lg p-6`}>
      <h2 className={`text-2xl font-bold text-center mb-4 ${colors.text.primary}`}>
        Private Company Auction
      </h2>

      <div className="mb-4 text-center">
        <div className={`text-sm ${colors.text.secondary}`}>Current actor</div>
        <div className={`text-lg font-semibold ${colors.text.primary}`}>
          {view.currentPlayer.name}
        </div>
        <div className={`text-xs ${colors.text.secondary} mt-1`}>
          Offered private: {currentPrivate.name} @ ${currentPrivate.offeredPrice}
        </div>
      </div>

      {bidOff ? (
        <div
          className={`${colors.auctionSummary.playerCard.background} ${colors.auctionSummary.playerCard.border} rounded p-3 border mb-4`}
        >
          <div className={`font-semibold ${colors.auctionSummary.playerCard.title}`}>
            Bid-off: {game.privates[bidOff.privateId]?.name ?? bidOff.privateId}
          </div>
          <div className={`text-sm ${colors.text.secondary} mt-1`}>
            Standing bid: ${bidOff.standingBid} by{' '}
            {game.players[bidOff.standingBidderId]?.name ?? bidOff.standingBidderId}
          </div>
          <div className={`text-xs ${colors.text.secondary} mt-1`}>
            Now bidding: {game.players[bidOff.currentActorId]?.name ?? bidOff.currentActorId}
          </div>
          <div className={`text-xs ${colors.text.secondary} mt-1`}>
            Participants:{' '}
            {bidOff.participantIds
              .map((id) => game.players[id]?.name ?? id)
              .join(', ') || '—'}
          </div>
          {bidOff.passedPlayerIds.length > 0 ? (
            <div className={`text-xs ${colors.text.secondary} mt-1`}>
              Passed:{' '}
              {bidOff.passedPlayerIds
                .map((id) => game.players[id]?.name ?? id)
                .join(', ')}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mb-2">
        <h3 className={`text-lg font-semibold ${colors.auctionSummary.title} mb-2`}>Privates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {view.privates.map(({ privateCompany, bids, lockedAmount }) => (
            <PrivateRow
              key={privateCompany.id}
              privateCompany={privateCompany}
              bids={bids}
              lockedAmount={lockedAmount}
              players={game.players}
              corporations={game.corporations}
              colors={colors}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
