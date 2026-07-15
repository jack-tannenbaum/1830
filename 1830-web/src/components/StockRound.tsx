import React, { useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  getCorporationOwnership,
  getStockRoundView,
} from '../engine/selectors';
import { PAR_VALUES, STOCK_MARKET_GRID } from '../engine/constants';
import type {
  CertificateId,
  CorporationId,
  GameState,
} from '../engine/model';
import type { StockCommand } from '../engine/commands';
import { PrivateTradeDialog } from './PrivateTradeDialog';
import { StockMarketDisplay } from './StockMarketDisplay';

function makeCommandId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function certificatePrice(
  game: GameState,
  certificateId: CertificateId,
): number | null {
  const certificate = game.certificates[certificateId];
  if (!certificate) return null;
  const corporation = game.corporations[certificate.corporationId];
  if (!corporation) return null;
  if (certificate.location.type === 'initialOffering') {
    return corporation.parPrice;
  }
  if (certificate.location.type === 'bankPool') {
    const position = corporation.market;
    if (!position) return null;
    const value = STOCK_MARKET_GRID[position.row]?.[position.column];
    return value === null || value === undefined ? null : Number(value);
  }
  return null;
}

function certificateSource(game: GameState, certificateId: CertificateId): string {
  const certificate = game.certificates[certificateId];
  if (!certificate) return 'Unknown';
  if (certificate.location.type === 'initialOffering') return 'IPO';
  if (certificate.location.type === 'bankPool') return 'Bank Pool';
  return 'Player';
}

const StockRound: React.FC = () => {
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const undo = useGameStore((state) => state.undo);

  const [parByCorporation, setParByCorporation] = useState<
    Record<CorporationId, number>
  >({});
  const [sellSelectionByCorporation, setSellSelectionByCorporation] = useState<
    Record<CorporationId, CertificateId[]>
  >({});
  const [selectedStartCorporationId, setSelectedStartCorporationId] = useState<CorporationId | null>(null);
  const [selectedSellCorporationId, setSelectedSellCorporationId] = useState<CorporationId | null>(null);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [showStockMarket, setShowStockMarket] = useState(false);

  const view = useMemo(
    () =>
      game && game.round === 'stock' && game.stock
        ? getStockRoundView(game)
        : null,
    [game],
  );

  if (!game || game.round !== 'stock' || !game.stock || !view) {
    return null;
  }

  const stock = game.stock;
  const currentActorId = stock.currentActorId;
  const currentPlayer = view.currentPlayer;

  const send = (
    type: StockCommand['type'],
    payload: Record<string, unknown>,
  ): void => {
    dispatch({
      id: makeCommandId(),
      gameId: game.id,
      actorId: currentActorId,
      expectedVersion: game.version,
      type,
      payload,
    } as StockCommand);
  };

  const purchasableRows = view.purchasableCertificateIds
    .map((certificateId) => {
      const certificate = game.certificates[certificateId];
      const corporation = certificate
        ? game.corporations[certificate.corporationId]
        : undefined;
      if (!certificate || !corporation) return null;
      return {
        certificateId,
        corporation,
        percent: certificate.percent,
        price: certificatePrice(game, certificateId),
        source: certificateSource(game, certificateId),
        isPresident: certificate.isPresident,
      };
    })
    .filter(
      (row): row is NonNullable<typeof row> => row !== null,
    );
  const rowsByBuyGroup = new Map<string, typeof purchasableRows>();
  for (const row of purchasableRows) {
    const groupKey = [
      row.corporation.id,
      row.source,
      row.percent,
      row.isPresident ? 'president' : 'ordinary',
      row.price ?? 'unpriced',
    ].join(':');
    rowsByBuyGroup.set(groupKey, [...(rowsByBuyGroup.get(groupKey) ?? []), row]);
  }
  const purchasableGroups = Array.from(rowsByBuyGroup.entries()).map(([groupKey, rows]) => ({
    ...rows[0],
    groupKey,
    certificateIds: rows.map((row) => row.certificateId),
  }));

  const sellableByCorporation = new Map<CorporationId, CertificateId[]>();
  for (const certificateId of view.sellableCertificateIds) {
    const certificate = game.certificates[certificateId];
    if (!certificate) continue;
    const list = sellableByCorporation.get(certificate.corporationId) ?? [];
    list.push(certificateId);
    sellableByCorporation.set(certificate.corporationId, list);
  }

  const anyPlayerHoldsOpenPrivate = Object.values(game.privates).some(
    (privateCompany) =>
      privateCompany.location.type === 'player',
  );

  const handleStart = (corporationId: CorporationId): void => {
    const parPrice = parByCorporation[corporationId] ?? 100;
    send('stock.startCorporation', { corporationId, parPrice });
    setSelectedStartCorporationId(null);
  };

  const handleBuy = (certificateId: CertificateId): void => {
    send('stock.buyCertificate', { certificateId });
  };

  const toggleSellSelection = (
    corporationId: CorporationId,
    certificateId: CertificateId,
  ): void => {
    setSellSelectionByCorporation((previous) => {
      const current = previous[corporationId] ?? [];
      const next = current.includes(certificateId)
        ? current.filter((id) => id !== certificateId)
        : [...current, certificateId];
      return { ...previous, [corporationId]: next };
    });
  };

  const handleSell = (corporationId: CorporationId): void => {
    const selection = sellSelectionByCorporation[corporationId] ?? [];
    if (selection.length === 0) return;
    send('stock.sellCertificates', { certificateIds: selection });
    setSellSelectionByCorporation((previous) => ({
      ...previous,
      [corporationId]: [],
    }));
  };

  const handleFinishTurn = (): void => {
    send('stock.finishTurn', {});
  };

  const handlePass = (): void => {
    send('stock.pass', {});
  };

  const handleUndo = (): void => {
    undo();
  };

  const pendingTrade = view.pendingPrivateTrade;
  const tradeDialogVisible = tradeDialogOpen || pendingTrade !== null;
  const selectedStartCorporation = selectedStartCorporationId
    ? game.corporations[selectedStartCorporationId] ?? null
    : null;

  return (
    <div className="stock-round-panel rounded-lg p-6 shadow">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Stock Round</h2>
          <div className="mt-1 text-sm text-gray-600">
            Current Player: <span className="font-medium">{currentPlayer.name}</span>
          </div>
          <div className="text-sm text-gray-600">
            Available Cash: <span className="font-medium">${currentPlayer.cash}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {view.mayFinishTurn && (
            <button
              type="button"
              onClick={handleFinishTurn}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Finish Turn
            </button>
          )}
          {view.mayPass && (
            <button
              type="button"
              onClick={handlePass}
              className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Pass
            </button>
          )}
          <button
            type="button"
            onClick={handleUndo}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => setShowStockMarket((visible) => !visible)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {showStockMarket ? '🏢 Corporations' : '📊 Stock Market'}
          </button>
        </div>
      </header>

      {showStockMarket ? (
        <StockMarketDisplay className="mb-6 w-full" />
      ) : (
      <section className="mb-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {game.corporationOrder.map((corporationId) => {
            const corporation = game.corporations[corporationId];
            if (!corporation) return null;
            const ownership = getCorporationOwnership(game, corporation.id);
            const ipoGroup = purchasableGroups.find(
              (group) => group.corporation.id === corporation.id && group.source === 'IPO',
            );
            const poolGroup = purchasableGroups.find(
              (group) => group.corporation.id === corporation.id && group.source === 'Bank Pool',
            );
            const ipoShareUnits = Object.values(game.certificates)
              .filter((certificate) => certificate.corporationId === corporation.id
                && certificate.location.type === 'initialOffering')
              .reduce((total, certificate) => total + certificate.percent / 10, 0);
            const poolShareUnits = Object.values(game.certificates)
              .filter((certificate) => certificate.corporationId === corporation.id
                && certificate.location.type === 'bankPool')
              .reduce((total, certificate) => total + certificate.percent / 10, 0);
            const marketPrice = corporation.market
              ? STOCK_MARKET_GRID[corporation.market.row]?.[corporation.market.column] ?? null
              : null;
            const isUnstarted = corporation.lifecycle === 'unstarted';
            const sellableCertificateIds = sellableByCorporation.get(corporation.id) ?? [];

            return (
              <article
                key={corporation.id}
                className="rounded-lg border-2 p-4 shadow-md"
                style={{
                  backgroundColor: `${corporation.color}12`,
                  borderColor: `${corporation.color}55`,
                  boxShadow: `0 4px 6px -1px ${corporation.color}20`,
                }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{corporation.abbreviation}</div>
                    <div className="text-xs text-gray-500">{corporation.name}</div>
                  </div>
                  <div
                    className="flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: corporation.color }}
                  >
                    {corporation.abbreviation}
                  </div>
                </div>

                <div className="mb-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">IPO Pool</span>
                    <span className="font-medium text-gray-900">{ipoShareUnits} shares</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bank Pool</span>
                    <span className="font-medium text-gray-900">{poolShareUnits} shares</span>
                  </div>
                </div>

                <div className="mb-4 min-h-12 text-xs">
                  <div className="mb-1 text-gray-500">Ownership</div>
                  {ownership.holders.length === 0 ? (
                    <div className="text-gray-500">No player shares</div>
                  ) : ownership.holders.map((holder) => (
                    <div key={holder.player.id} className="flex justify-between">
                      <span className="text-gray-500">
                        {holder.player.name}
                        {ownership.presidentId === holder.player.id && (
                          <span className="ml-1 font-bold text-yellow-500">P</span>
                        )}
                      </span>
                      <span className="font-medium text-gray-900">{holder.percent}%</span>
                    </div>
                  ))}
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3 text-center">
                  <div>
                    <div className="text-xs text-gray-500">Par Value</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {corporation.parPrice === null ? 'Not set' : `$${corporation.parPrice}`}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Market Price</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {marketPrice === null ? 'Not set' : `$${marketPrice}`}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isUnstarted) {
                        setParByCorporation((previous) => ({
                          ...previous,
                          [corporation.id]: previous[corporation.id] ?? 100,
                        }));
                        setSelectedStartCorporationId(corporation.id);
                      } else if (ipoGroup?.certificateIds[0]) {
                        handleBuy(ipoGroup.certificateIds[0]);
                      }
                    }}
                    disabled={!isUnstarted && !ipoGroup}
                    className={`flex-1 rounded px-2 py-2 text-xs font-medium text-white ${
                      isUnstarted || ipoGroup
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-gray-300'
                    }`}
                  >
                    Buy IPO
                  </button>
                  <button
                    type="button"
                    onClick={() => poolGroup?.certificateIds[0]
                      && handleBuy(poolGroup.certificateIds[0])}
                    disabled={!poolGroup}
                    className={`flex-1 rounded px-2 py-2 text-xs font-medium text-white ${
                      poolGroup ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300'
                    }`}
                  >
                    Buy Bank
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSellCorporationId(corporation.id)}
                  disabled={sellableCertificateIds.length === 0}
                  className={`mt-2 w-full rounded px-3 py-2 text-xs font-medium text-white ${
                    sellableCertificateIds.length > 0
                      ? 'bg-gray-600 hover:bg-gray-700'
                      : 'bg-gray-300'
                  }`}
                >
                  Sell
                </button>
              </article>
            );
          })}
        </div>
      </section>
      )}

      {selectedStartCorporation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="par-value-title"
        >
          <div
            className="w-full max-w-md rounded-lg border p-6 shadow-2xl"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color-alt, var(--border-color))',
              color: 'var(--text-primary)',
            }}
          >
            <h3 id="par-value-title" className="mb-2 text-xl font-semibold">
              Set Par Value for {selectedStartCorporation.name}
            </h3>
            <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Choose the initial share price. Starting the corporation buys its
              20% president certificate at twice this value.
            </p>
            <div className="mb-5 grid grid-cols-3 gap-2">
              {PAR_VALUES.map((parPrice) => {
                const selected = (parByCorporation[selectedStartCorporation.id] ?? 100) === parPrice;
                return (
                  <button
                    key={parPrice}
                    type="button"
                    onClick={() => setParByCorporation((previous) => ({
                      ...previous,
                      [selectedStartCorporation.id]: parPrice,
                    }))}
                    className={`rounded-md border px-3 py-3 text-sm font-medium ${
                      selected ? 'bg-blue-600 text-white' : ''
                    }`}
                    style={selected ? undefined : { borderColor: 'var(--border-color-alt, var(--border-color))' }}
                  >
                    ${parPrice}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedStartCorporationId(null)}
                className="rounded-md border px-4 py-2 text-sm font-medium"
                style={{ borderColor: 'var(--border-color-alt, var(--border-color))' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStart(selectedStartCorporation.id)}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Start Corporation
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedSellCorporationId && (() => {
        const corporation = game.corporations[selectedSellCorporationId];
        const certificateIds = sellableByCorporation.get(selectedSellCorporationId) ?? [];
        const selection = sellSelectionByCorporation[selectedSellCorporationId] ?? [];
        if (!corporation || certificateIds.length === 0) return null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sell-certificate-title"
          >
            <div
              className="w-full max-w-md rounded-lg border p-6 shadow-2xl"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color-alt, var(--border-color))',
                color: 'var(--text-primary)',
              }}
            >
              <h3 id="sell-certificate-title" className="mb-2 text-xl font-semibold">
                Sell {corporation.abbreviation} certificates
              </h3>
              <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Select the exact certificates to place in the Bank Pool.
              </p>
              <ul className="mb-5 space-y-2">
                {certificateIds.map((certificateId) => {
                  const certificate = game.certificates[certificateId];
                  return (
                    <li key={certificateId}>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selection.includes(certificateId)}
                          onChange={() => toggleSellSelection(corporation.id, certificateId)}
                        />
                        <span>
                          {certificateId} — {certificate?.percent ?? 0}%
                          {certificate?.isPresident ? ' (president)' : ''}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSellCorporationId(null)}
                  className="rounded-md border px-4 py-2 text-sm font-medium"
                  style={{ borderColor: 'var(--border-color-alt, var(--border-color))' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selection.length === 0}
                  onClick={() => {
                    handleSell(corporation.id);
                    setSelectedSellCorporationId(null);
                  }}
                  className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
                    selection.length > 0 ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  Sell selected
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <section className="mb-6">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Private Trade
        </h3>
        {pendingTrade ? (
          <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <div>
              <span className="font-medium">Pending trade:</span>{' '}
              {pendingTrade.privateId}
            </div>
            <div>
              Seller: {game.players[pendingTrade.sellerId]?.name ??
                pendingTrade.sellerId}{' '}
              — Buyer:{' '}
              {game.players[pendingTrade.buyerId]?.name ??
                pendingTrade.buyerId}
            </div>
            <div>Price: ${pendingTrade.price}</div>
            <div className="mt-1 text-xs text-amber-800">
              Awaiting response from{' '}
              {game.players[pendingTrade.responderId]?.name ??
                pendingTrade.responderId}
              .
            </div>
          </div>
        ) : anyPlayerHoldsOpenPrivate ? (
          <button
            type="button"
            onClick={() => setTradeDialogOpen(true)}
            className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Propose private trade
          </button>
        ) : (
          <div className="text-sm text-gray-500">
            No open privates available to trade.
          </div>
        )}
      </section>

      {tradeDialogVisible && (
        <PrivateTradeDialog onClose={() => setTradeDialogOpen(false)} />
      )}
    </div>
  );
};

export default StockRound;
