import React, { useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useColors } from '../styles/colors';
import { getAuctionView } from '../engine/selectors';
import type { GameCommand } from '../engine/commands';

export const PrivateAuction: React.FC = () => {
  const game = useGameStore((s) => s.game);
  const dispatch = useGameStore((s) => s.dispatch);
  const colors = useColors();

  const [advanceBidAmounts, setAdvanceBidAmounts] = useState<Record<string, number>>({});
  const [raiseAmount, setRaiseAmount] = useState<number | null>(null);

  const view = useMemo(() => {
    if (!game || game.round !== 'privateAuction' || !game.auction) return null;
    return getAuctionView(game);
  }, [game]);

  if (!game || game.round !== 'privateAuction' || !view || !game.auction) {
    return null;
  }

  const { currentPlayer, currentPrivate, privates, actions, bidOff } = view;
  const players = game.players;
  const playerOrder = game.playerOrder;
  const pendingBOParPlayerId = game.auction.pendingBOParPlayerId;

  const send = (
    actorId: string,
    envelope:
      | { type: 'auction.buyOfferedPrivate'; payload: Record<string, never> }
      | { type: 'auction.placeAdvanceBid'; payload: { privateId: string; amount: number } }
      | { type: 'auction.raiseBid'; payload: { amount: number } }
      | { type: 'auction.pass'; payload: Record<string, never> }
      | { type: 'auction.setBOPar'; payload: { parPrice: number } },
  ) => {
    dispatch({
      id: crypto.randomUUID(),
      gameId: game.id,
      actorId,
      expectedVersion: game.version,
      type: envelope.type,
      payload: envelope.payload,
    } as GameCommand);
  };

  const minAdvanceBidFor = (privateId: string): number => {
    const entry = privates.find((p) => p.privateCompany.id === privateId);
    if (!entry) return 0;
    const highest = entry.bids.reduce(
      (max, bid) => Math.max(max, bid.amount),
      entry.privateCompany.faceValue,
    );
    return highest + 5;
  };

  const handleBuyOffered = () => {
    send(currentPlayer.id, { type: 'auction.buyOfferedPrivate', payload: {} });
  };

  const handlePlaceAdvanceBid = (privateId: string) => {
    const minimum = minAdvanceBidFor(privateId);
    const amount = Math.max(advanceBidAmounts[privateId] ?? minimum, minimum);
    send(currentPlayer.id, {
      type: 'auction.placeAdvanceBid',
      payload: { privateId, amount },
    });
    setAdvanceBidAmounts((prev) => {
      const next = { ...prev };
      delete next[privateId];
      return next;
    });
  };

  const handleRaiseBid = () => {
    if (!bidOff) return;
    const minimum = bidOff.standingBid + 5;
    const amount = Math.max(raiseAmount ?? minimum, minimum);
    send(currentPlayer.id, { type: 'auction.raiseBid', payload: { amount } });
    setRaiseAmount(null);
  };

  const handlePass = () => {
    send(currentPlayer.id, { type: 'auction.pass', payload: {} });
    setRaiseAmount(null);
  };

  const handleSetBOPar = (parPrice: number) => {
    if (!pendingBOParPlayerId) return;
    send(pendingBOParPlayerId, { type: 'auction.setBOPar', payload: { parPrice } });
  };

  const adjustAdvanceBid = (privateId: string, delta: number) => {
    const minimum = minAdvanceBidFor(privateId);
    const current = advanceBidAmounts[privateId] ?? minimum;
    const next = Math.max(minimum, current + delta);
    setAdvanceBidAmounts((prev) => ({ ...prev, [privateId]: next }));
  };

  const adjustRaiseAmount = (delta: number) => {
    if (!bidOff) return;
    const minimum = bidOff.standingBid + 5;
    const current = raiseAmount ?? minimum;
    const next = Math.max(minimum, current + delta);
    setRaiseAmount(next);
  };

  const unownedPrivates = privates.filter(
    (entry) => entry.privateCompany.location.type === 'bank',
  );

  const currentPlayerBids = privates.flatMap((entry) =>
    entry.bids
      .filter((bid) => bid.playerId === currentPlayer.id)
      .map((bid) => ({ privateId: entry.privateCompany.id, name: entry.privateCompany.name, amount: bid.amount })),
  );

  const soldCount = Object.values(game.privates).filter(
    (pc) => pc.location.type !== 'bank',
  ).length;
  const totalPrivates = Object.values(game.privates).length;

  if (actions.mustSetBOPar && pendingBOParPlayerId) {
    const parPlayer = players[pendingBOParPlayerId];
    return (
      <div className={`${colors.card.background} rounded-lg shadow-lg p-6`}>
        <h2 className={`text-2xl font-bold text-center mb-6 ${colors.text.primary}`}>
          Set B&amp;O Par Price
        </h2>
        <div className={`${colors.auction.currentPlayer.background} ${colors.auction.currentPlayer.border} rounded-lg p-4 mb-6`}>
          <div className="text-center">
            <h3 className={`text-lg font-semibold ${colors.auction.currentPlayer.title}`}>
              {parPlayer?.name ?? 'Player'} must choose a par price for the B&amp;O
            </h3>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
          {actions.availableBOParPrices.map((par) => (
            <button
              key={par}
              onClick={() => handleSetBOPar(par)}
              className={`py-3 ${colors.button.primary} font-semibold rounded-md`}
            >
              ${par}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (bidOff) {
    const activeEntry = privates.find((p) => p.privateCompany.id === bidOff.privateId);
    const standingBidder = players[bidOff.standingBidderId];
    const minimum = bidOff.standingBid + 5;
    const currentRaise = Math.max(raiseAmount ?? minimum, minimum);

    return (
      <div className={`${colors.card.background} rounded-lg shadow-lg p-6`}>
        <h2 className={`text-2xl font-bold text-center mb-6 ${colors.text.danger}`}>
          Bid-Off in Progress!
        </h2>

        <div className={`${colors.notification.warning.background} ${colors.notification.warning.border} rounded-lg p-4 mb-6`}>
          <div className="text-center">
            <h3 className={`text-xl font-semibold mb-2 ${colors.notification.warning.title}`}>
              {activeEntry?.privateCompany.name}
            </h3>
            <div className={`text-lg ${colors.notification.warning.text}`}>
              Current High Bid: <span className="font-bold">${bidOff.standingBid}</span>
              {standingBidder ? ` by ${standingBidder.name}` : ''}
            </div>
            <div className={`text-sm mt-2 ${colors.notification.warning.text}`}>
              Participants:{' '}
              {bidOff.participantIds
                .map((id) => {
                  const name = players[id]?.name ?? id;
                  const passed = bidOff.passedPlayerIds.includes(id);
                  return passed ? `${name} (passed)` : name;
                })
                .join(' vs ')}
            </div>
          </div>
        </div>

        <div className={`${colors.auction.currentPlayer.background} ${colors.auction.currentPlayer.border} rounded-lg p-4 mb-6`}>
          <div className="text-center">
            <h3 className={`text-lg font-semibold ${colors.auction.currentPlayer.title}`}>
              {currentPlayer.name}'s Turn
            </h3>
            <div className={`text-sm mt-1 ${colors.auction.currentPlayer.text}`}>
              Available Cash: ${actions.availableCash}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 max-w-md mx-auto">
          <div className="ui-actions">
            <button
              onClick={() => adjustRaiseAmount(-5)}
              disabled={!actions.mayRaiseBid || currentRaise <= minimum}
              className={`w-12 h-12 ${colors.button.primary} rounded ${
                !actions.mayRaiseBid || currentRaise <= minimum ? colors.button.disabled : ''
              }`}
            >
              -
            </button>
            <div
              className={`flex-1 text-center py-2 ${colors.auction.bidInput.background} ${colors.auction.bidInput.border} rounded font-semibold ${colors.auction.bidInput.text}`}
            >
              ${currentRaise}
            </div>
            <button
              onClick={() => adjustRaiseAmount(5)}
              disabled={!actions.mayRaiseBid}
              className={`w-12 h-12 ${colors.button.primary} rounded ${
                !actions.mayRaiseBid ? colors.button.disabled : ''
              }`}
            >
              +
            </button>
          </div>

          {actions.mayRaiseBid && (
            <button
              onClick={handleRaiseBid}
              className={`w-full py-3 font-semibold rounded-md ${colors.button.success}`}
            >
              Bid ${currentRaise}
            </button>
          )}

          {actions.mayPass && (
            <button
              onClick={handlePass}
              className={`w-full py-3 font-semibold rounded-md ${colors.button.danger}`}
            >
              Pass
            </button>
          )}
        </div>

        <div className={`mt-6 text-center text-sm ${colors.text.tertiary}`}>
          <p>Minimum bid: ${minimum}</p>
          <p>Original bidders must raise or pass. Last bidder wins!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${colors.card.background} rounded-lg shadow-lg p-6`}>
      <h2 className={`text-2xl font-bold text-center mb-6 ${colors.text.primary}`}>
        Private Company Auction
      </h2>

      {/* Current Player Turn */}
      <div
        className={`${colors.auction.currentPlayer.background} ${colors.auction.currentPlayer.border} rounded-lg p-4 mb-6`}
      >
        <div className="text-center">
          <h3 className={`text-lg font-semibold ${colors.auction.currentPlayer.title}`}>
            {currentPlayer.name}'s Turn
          </h3>
          <div className={`text-sm ${colors.auction.currentPlayer.text} mt-1`}>
            <span>Available Cash: ${actions.availableCash}</span>
            {currentPlayerBids.length > 0 && (
              <div className={`ml-4 ${colors.text.warning}`}>
                <div className="font-medium">Current Bids:</div>
                {currentPlayerBids.map((bid) => (
                  <div key={bid.privateId} className="text-sm">
                    ${bid.amount} on {bid.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Private Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {unownedPrivates.map((entry) => {
          const pc = entry.privateCompany;
          const isCurrent = pc.id === currentPrivate.id;
          const highestBid = entry.bids.reduce(
            (max, bid) => Math.max(max, bid.amount),
            pc.faceValue,
          );
          const highestBidderId = entry.bids.find((b) => b.amount === highestBid)?.playerId;
          const highestBidderName = highestBidderId ? players[highestBidderId]?.name ?? 'Unknown' : 'None';
          const minimum = highestBid + 5;
          const canAdvanceBid = actions.advanceBidPrivateIds.includes(pc.id);
          const currentBidAmount = Math.max(advanceBidAmounts[pc.id] ?? minimum, minimum);

          return (
            <div
              key={pc.id}
              className={`border-2 rounded-lg p-4 ${
                isCurrent
                  ? `${colors.auction.companyCard.cheapest.border} ${colors.auction.companyCard.cheapest.background}`
                  : `${colors.auction.companyCard.border} ${colors.auction.companyCard.background}`
              }`}
            >
              {/* Company Header */}
              <div className="text-center mb-3">
                <h4 className={`font-bold ${colors.auction.companyCard.title}`}>{pc.name}</h4>
                {isCurrent && (
                  <div className={`text-xs ${colors.auction.companyCard.cheapest.label} font-semibold`}>
                    CHEAPEST
                  </div>
                )}
              </div>

              {/* Company Details */}
              <div className="text-center mb-3">
                <div className={`text-sm ${colors.auction.companyCard.text}`}>
                  <div>Face Value: ${pc.faceValue}</div>
                  <div>Revenue: ${pc.revenue}</div>
                  {!isCurrent && (
                    <>
                      <div>
                        High Bid: ${highestBid} ({highestBidderName})
                      </div>
                      <div>Min Bid: ${minimum}</div>
                    </>
                  )}
                  {isCurrent && pc.offeredPrice < pc.faceValue && (
                    <div className={`${colors.private.reduced} font-semibold`}>
                      Reduced from ${pc.faceValue}!
                    </div>
                  )}
                  {isCurrent && (
                    <div>Offered Price: ${pc.offeredPrice}</div>
                  )}
                </div>
              </div>

              {/* Current Bids */}
              {!isCurrent && entry.bids.length > 0 && (
                <div className={`text-xs ${colors.private.name} italic mb-2`}>
                  Bids:{' '}
                  {entry.bids
                    .map((bid) => `${players[bid.playerId]?.name ?? bid.playerId}: $${bid.amount}`)
                    .join(', ')}
                </div>
              )}

              {/* Action Section */}
              <div className="border-t pt-3">
                {isCurrent ? (
                  <button
                    onClick={handleBuyOffered}
                    disabled={!actions.mayBuyOfferedPrivate}
                    className={`w-full py-2 ${colors.button.success} font-semibold rounded-md ${
                      !actions.mayBuyOfferedPrivate ? colors.button.disabled : ''
                    }`}
                  >
                    Buy ${pc.offeredPrice}
                  </button>
                ) : (
                  <div>
                    <div className="ui-actions mb-2">
                      <button
                        onClick={() => adjustAdvanceBid(pc.id, -5)}
                        disabled={!canAdvanceBid || currentBidAmount <= minimum}
                        className={`w-8 h-8 ${colors.button.primary} rounded ${
                          !canAdvanceBid || currentBidAmount <= minimum ? colors.button.disabled : ''
                        }`}
                      >
                        -
                      </button>
                      <div
                        className={`flex-1 text-center py-1 ${colors.auction.bidInput.background} ${colors.auction.bidInput.border} rounded font-semibold ${colors.auction.bidInput.text}`}
                      >
                        ${currentBidAmount}
                      </div>
                      <button
                        onClick={() => adjustAdvanceBid(pc.id, 5)}
                        disabled={!canAdvanceBid}
                        className={`w-8 h-8 ${colors.button.primary} rounded ${
                          !canAdvanceBid ? colors.button.disabled : ''
                        }`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => handlePlaceAdvanceBid(pc.id)}
                      disabled={!canAdvanceBid}
                      className={`w-full py-2 font-semibold rounded-md ${colors.button.warning} ${
                        !canAdvanceBid ? colors.button.disabled : ''
                      }`}
                    >
                      Bid ${currentBidAmount}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pass Button */}
      {actions.mayPass && (
        <div className="mb-6">
          <button
            onClick={handlePass}
            className={`w-full py-3 ${colors.button.danger} font-semibold rounded-md`}
          >
            Pass Turn
          </button>
        </div>
      )}

      {/* Player Status */}
      <div className="mt-6">
        <h4 className={`font-semibold mb-2 ${colors.text.primary}`}>Player Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {playerOrder.map((playerId) => {
            const player = players[playerId];
            if (!player) return null;
            const lockedAmount = Object.values(
              game.auction?.lockedByPlayer[playerId] ?? {},
            ).reduce((total, amount) => total + amount, 0);
            const availableCash = player.cash - lockedAmount;
            const playerBids = privates.flatMap((entry) =>
              entry.bids
                .filter((bid) => bid.playerId === playerId)
                .map((bid) => ({ privateId: entry.privateCompany.id, name: entry.privateCompany.name, amount: bid.amount })),
            );
            const ownedPrivates = Object.values(game.privates).filter(
              (pc) => pc.location.type === 'player' && pc.location.playerId === playerId,
            );

            return (
              <div
                key={player.id}
                className={`flex justify-between items-center p-2 rounded ${
                  player.id === currentPlayer.id ? colors.player.current : colors.player.inactive
                }`}
              >
                <div>
                  <span className={`font-medium ${colors.player.name}`}>
                    {player.name}
                    {player.id === currentPlayer.id && ' (Current)'}
                  </span>

                  {ownedPrivates.length > 0 && (
                    <div className={`text-xs ${colors.text.success}`}>
                      {ownedPrivates.map((pc) => (
                        <div key={pc.id}>
                          Bought {pc.name} for ${pc.offeredPrice}
                        </div>
                      ))}
                    </div>
                  )}

                  {playerBids.length > 0 && (
                    <div className={`text-xs ${colors.text.warning}`}>
                      {playerBids.map((bid) => (
                        <div key={bid.privateId}>
                          ${bid.amount} on {bid.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-sm text-right">
                  <div className={colors.text.secondary}>Available: ${availableCash}</div>
                  {lockedAmount > 0 && (
                    <div className={`${colors.player.locked} text-xs`}>Locked: ${lockedAmount}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Auction Summary */}
      <div className={`mt-4 p-3 ${colors.auction.progress.background} rounded`}>
        <h5 className={`font-semibold text-sm mb-1 ${colors.auction.progress.title}`}>
          Auction Progress
        </h5>
        <p className={`text-xs ${colors.auction.progress.text}`}>
          {soldCount} of {totalPrivates} companies sold • Consecutive passes:{' '}
          {game.auction.consecutivePasses}
        </p>
      </div>
    </div>
  );
};
