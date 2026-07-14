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
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);

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

  const unstartedCorporations = Object.values(game.corporations)
    .filter((corporation) => corporation.lifecycle === 'unstarted')
    .sort((left, right) => left.abbreviation.localeCompare(right.abbreviation));

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
    const parPrice = parByCorporation[corporationId] ?? PAR_VALUES[0];
    send('stock.startCorporation', { corporationId, parPrice });
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

  return (
    <div className="rounded-lg bg-white p-6 shadow">
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
        </div>
      </header>

      <section className="mb-6">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Start Corporation
        </h3>
        {unstartedCorporations.length === 0 ? (
          <div className="text-sm text-gray-500">
            No unparred corporations remain.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {unstartedCorporations.map((corporation) => {
              const selected =
                parByCorporation[corporation.id] ?? PAR_VALUES[0];
              return (
                <div
                  key={corporation.id}
                  className="rounded border border-gray-200 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {corporation.abbreviation}
                      </div>
                      <div className="text-xs text-gray-500">
                        {corporation.name}
                      </div>
                    </div>
                    <span
                      className="inline-block h-4 w-4 rounded"
                      style={{ backgroundColor: corporation.color }}
                    />
                  </div>
                  <label className="block text-xs text-gray-500">
                    Par Price
                  </label>
                  <select
                    value={selected}
                    onChange={(event) =>
                      setParByCorporation((previous) => ({
                        ...previous,
                        [corporation.id]: Number(event.target.value),
                      }))
                    }
                    className="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                  >
                    {PAR_VALUES.map((par) => (
                      <option key={par} value={par}>
                        ${par}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleStart(corporation.id)}
                    className="w-full rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Start {corporation.abbreviation}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mb-6">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Buy Certificates
        </h3>
        {purchasableRows.length === 0 ? (
          <div className="text-sm text-gray-500">
            No certificates are purchasable right now.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {purchasableRows.map((row) => (
              <li
                key={row.certificateId}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {row.corporation.abbreviation}{' '}
                    <span className="text-gray-500">
                      ({row.percent}%
                      {row.isPresident ? ', president' : ''})
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {row.source}
                    {row.price !== null ? ` — $${row.price}` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleBuy(row.certificateId)}
                  className="rounded-md bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Buy
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-6">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Sell Certificates
        </h3>
        {sellableByCorporation.size === 0 ? (
          <div className="text-sm text-gray-500">
            No certificates are sellable right now.
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from(sellableByCorporation.entries())
              .sort(([leftId], [rightId]) => leftId.localeCompare(rightId))
              .map(([corporationId, certificateIds]) => {
                const corporation = game.corporations[corporationId];
                const ownership = getCorporationOwnership(game, corporationId);
                const selection =
                  sellSelectionByCorporation[corporationId] ?? [];
                return (
                  <div
                    key={corporationId}
                    className="rounded border border-gray-200 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {corporation?.abbreviation ?? corporationId}
                        </div>
                        <div className="text-xs text-gray-500">
                          Pool: {ownership.poolPercent}% • Sold this round:{' '}
                          {ownership.soldCertificateCount}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSell(corporationId)}
                        disabled={selection.length === 0}
                        className={`rounded-md px-3 py-1 text-sm font-medium text-white ${
                          selection.length === 0
                            ? 'bg-gray-300'
                            : 'bg-rose-600 hover:bg-rose-700'
                        }`}
                      >
                        Sell {selection.length > 0 ? `(${selection.length})` : ''}
                      </button>
                    </div>
                    <ul className="space-y-1">
                      {certificateIds.map((certificateId) => {
                        const certificate = game.certificates[certificateId];
                        const checked = selection.includes(certificateId);
                        return (
                          <li key={certificateId}>
                            <label className="flex items-center space-x-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  toggleSellSelection(
                                    corporationId,
                                    certificateId,
                                  )
                                }
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
                  </div>
                );
              })}
          </div>
        )}
      </section>

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
