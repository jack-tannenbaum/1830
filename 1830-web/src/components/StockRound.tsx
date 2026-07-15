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
import { useColors } from '../styles/colors';
import { useThemeStore } from '../store/themeStore';

function corporationDisplayColor(color: string, darkMode: boolean): string {
  if (!darkMode || !/^#[0-9a-f]{6}$/i.test(color)) return color;
  const channels = [1, 3, 5].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16));
  const luminance = (0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]) / 255;
  if (luminance >= 0.14) return color;
  const brightened = channels.map((channel) => Math.round(channel + (255 - channel) * 0.4));
  return `#${brightened.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function readableTextColor(background: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(background)) return '#ffffff';
  const channels = [1, 3, 5].map((offset) => Number.parseInt(background.slice(offset, offset + 2), 16));
  const luminance = (0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]) / 255;
  return luminance > 0.58 ? '#111827' : '#ffffff';
}

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
  const colors = useColors();
  const theme = useThemeStore((state) => state.theme);

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
  const purchaseLimitReached = stock.turn.purchaseCount > 0;
  const purchaseLimitMessage = 'This turn already includes a purchase. Finish Turn before buying again.';

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

  const setSellGroupCount = (
    corporationId: CorporationId,
    groupCertificateIds: CertificateId[],
    count: number,
  ): void => {
    setSellSelectionByCorporation((previous) => {
      const current = previous[corporationId] ?? [];
      const outsideGroup = current.filter((id) => !groupCertificateIds.includes(id));
      const next = [...outsideGroup, ...groupCertificateIds.slice(0, count)];
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
          <h2 className={`text-xl font-semibold ${colors.text.primary}`}>Stock Round</h2>
          <div className={`mt-1 text-sm ${colors.text.secondary}`}>
            Current Player: <span className="font-medium">{currentPlayer.name}</span>
          </div>
          <div className={`text-sm ${colors.text.secondary}`}>
            Available Cash: <span className="font-medium">${currentPlayer.cash}</span>
          </div>
        </div>
        <div className="ui-actions">
          {view.mayFinishTurn && (
            <button
              type="button"
              onClick={handleFinishTurn}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${colors.button.success}`}
            >
              Finish Turn
            </button>
          )}
          {view.mayPass && (
            <button
              type="button"
              onClick={handlePass}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${colors.button.secondary}`}
            >
              Pass
            </button>
          )}
          <button
            type="button"
            onClick={handleUndo}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${colors.button.secondary}`}
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => setShowStockMarket((visible) => !visible)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              showStockMarket ? colors.button.success : colors.button.primary
            }`}
          >
            {showStockMarket ? '🏢 Corporations' : '📊 Stock Market'}
          </button>
        </div>
      </header>

      {game.isFirstStockRound && !showStockMarket && (
        <div className="ui-surface-warning mb-6 rounded-lg border p-3 text-sm">
          <span className="font-semibold">First Stock Round:</span>{' '}
          stock may be purchased, but it cannot be sold until the next Stock Round.
        </div>
      )}

      {purchaseLimitReached && !showStockMarket && (
        <div className="ui-surface-warning mb-6 rounded-lg border p-3 text-sm">
          <span className="font-semibold">Purchase complete:</span>{' '}
          finish this turn before buying another certificate. Brown-zone stock remains exempt
          from the one-certificate purchase limit.
        </div>
      )}

      {showStockMarket ? (
        <StockMarketDisplay className="mb-6 w-full" />
      ) : (
      <section className="mb-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {game.corporationOrder.map((corporationId) => {
            const corporation = game.corporations[corporationId];
            if (!corporation) return null;
            const isDarkNyc = theme === 'dark' && corporation.id === 'NYC';
            const displayColor = isDarkNyc
              ? '#f0f0f0'
              : corporationDisplayColor(corporation.color, theme === 'dark');
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
            const canStartCorporation = isUnstarted && !purchaseLimitReached;
            const sellableCertificateIds = sellableByCorporation.get(corporation.id) ?? [];
            const currentPlayerCertificateCount = Object.values(game.certificates).filter(
              (certificate) => certificate.corporationId === corporation.id
                && certificate.location.type === 'player'
                && certificate.location.playerId === currentActorId,
            ).length;
            const sellDisabledReason = game.isFirstStockRound
              ? 'Stock cannot be sold during the first Stock Round.'
              : currentPlayerCertificateCount === 0
                ? `${currentPlayer.name} does not own ${corporation.abbreviation} shares.`
                : pendingTrade
                  ? 'Resolve the pending private-company trade first.'
                  : 'These shares cannot currently be sold because of a stock-rule restriction.';

            return (
              <article
                key={corporation.id}
                className="rounded-lg border-2 p-4 shadow-md"
                style={{
                  backgroundColor: `${displayColor}08`,
                  borderColor: `${displayColor}50`,
                  boxShadow: `0 4px 6px -1px ${displayColor}20`,
                }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className={`font-semibold ${colors.text.primary}`}>{corporation.abbreviation}</div>
                    <div className={`text-xs ${colors.text.secondary}`}>{corporation.name}</div>
                  </div>
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full p-[2px] shadow-sm"
                    style={{
                      backgroundColor: corporation.color,
                    }}
                  >
                    <span
                      className="flex h-full w-full items-center justify-center rounded-full p-[2px]"
                      style={{
                        backgroundColor: readableTextColor(corporation.color),
                      }}
                    >
                      <span
                        className="flex h-full w-full items-center justify-center rounded-full text-[10px] font-bold leading-none"
                        style={{
                          backgroundColor: corporation.color,
                          color: readableTextColor(corporation.color),
                        }}
                      >
                        {corporation.abbreviation}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="mb-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className={colors.text.secondary}>IPO Pool</span>
                    <span className={`font-medium ${colors.text.primary}`}>{ipoShareUnits} shares</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={colors.text.secondary}>Bank Pool</span>
                    <span className={`font-medium ${colors.text.primary}`}>{poolShareUnits} shares</span>
                  </div>
                </div>

                <div className="mb-4 min-h-12 text-xs">
                  <div className={`mb-1 ${colors.text.secondary}`}>Ownership</div>
                  {ownership.holders.length === 0 ? (
                    <div className={colors.text.secondary}>No player shares</div>
                  ) : ownership.holders.map((holder) => (
                    <div key={holder.player.id} className="flex justify-between">
                      <span className={colors.text.secondary}>
                        {holder.player.name}
                        {ownership.presidentId === holder.player.id && (
                          <span className={`font-bold ${colors.text.warning}`}> P</span>
                        )}
                      </span>
                      <span className={`font-medium ${colors.text.primary}`}>{holder.percent}%</span>
                    </div>
                  ))}
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3 text-center">
                  <div>
                    <div className={`text-xs ${colors.text.secondary}`}>Par Value</div>
                    <div className={`text-sm font-semibold ${colors.text.primary}`}>
                      {corporation.parPrice === null ? 'Not set' : `$${corporation.parPrice}`}
                    </div>
                  </div>
                  <div>
                    <div className={`text-xs ${colors.text.secondary}`}>Market Price</div>
                    <div className={`text-sm font-semibold ${colors.text.primary}`}>
                      {marketPrice === null ? 'Not set' : `$${marketPrice}`}
                    </div>
                  </div>
                </div>

                <div className="ui-actions ui-actions-stretch">
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
                    disabled={isUnstarted ? !canStartCorporation : !ipoGroup}
                    title={isUnstarted && purchaseLimitReached
                      ? purchaseLimitMessage
                      : !isUnstarted && !ipoGroup && purchaseLimitReached
                        ? purchaseLimitMessage
                        : undefined}
                    className={`flex-1 rounded px-2 py-2 text-xs font-medium ${
                      canStartCorporation || ipoGroup
                        ? colors.button.success
                        : colors.button.disabled
                    }`}
                  >
                    Buy IPO
                  </button>
                  <button
                    type="button"
                    onClick={() => poolGroup?.certificateIds[0]
                      && handleBuy(poolGroup.certificateIds[0])}
                    disabled={!poolGroup}
                    title={!poolGroup && purchaseLimitReached ? purchaseLimitMessage : undefined}
                    className={`flex-1 rounded px-2 py-2 text-xs font-medium ${
                      poolGroup ? colors.button.primary : colors.button.disabled
                    }`}
                  >
                    Buy Bank
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSellCorporationId(corporation.id)}
                  disabled={sellableCertificateIds.length === 0}
                  title={sellableCertificateIds.length > 0 ? `Sell ${corporation.abbreviation} shares` : sellDisabledReason}
                  className={`w-full rounded px-3 py-2 text-xs font-medium ${
                    sellableCertificateIds.length > 0
                      ? colors.button.secondary
                      : colors.button.disabled
                  }`}
                  style={{ marginTop: 'var(--control-gap)' }}
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
          style={{ inset: 0, backgroundColor: 'rgb(0 0 0 / 0.6)' }}
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
            <div
              className="grid grid-cols-3 gap-2"
              style={{ marginBottom: 'calc(var(--control-gap) * 1.5)' }}
            >
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
                      selected ? colors.button.primary : colors.card.backgroundAlt
                    }`}
                    style={selected ? undefined : { borderColor: 'var(--border-color-alt, var(--border-color))' }}
                  >
                    ${parPrice}
                  </button>
                );
              })}
            </div>
            <div className="ui-actions justify-end">
              <button
                type="button"
                onClick={() => setSelectedStartCorporationId(null)}
                className={`rounded-md px-4 py-2 text-sm font-medium ${colors.button.secondary}`}
                style={{ minHeight: 42 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStart(selectedStartCorporation.id)}
                disabled={purchaseLimitReached}
                title={purchaseLimitReached ? purchaseLimitMessage : undefined}
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  purchaseLimitReached ? colors.button.disabled : colors.button.primary
                }`}
                style={{ minHeight: 42 }}
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
        const groupsByType = new Map<string, CertificateId[]>();
        for (const certificateId of certificateIds) {
          const certificate = game.certificates[certificateId];
          if (!certificate) continue;
          const key = `${certificate.percent}:${certificate.isPresident ? 'president' : 'ordinary'}`;
          groupsByType.set(key, [...(groupsByType.get(key) ?? []), certificateId]);
        }
        const sellGroups = Array.from(groupsByType.values());
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            style={{ inset: 0, backgroundColor: 'rgb(0 0 0 / 0.6)' }}
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
                Choose how many shares to place in the Bank Pool.
              </p>
              <ul
                className="space-y-2"
                style={{ marginBottom: 'calc(var(--control-gap) * 1.5)' }}
              >
                {sellGroups.map((groupCertificateIds) => {
                  const certificate = game.certificates[groupCertificateIds[0]];
                  if (!certificate) return null;
                  const selectedCount = groupCertificateIds.filter((id) => selection.includes(id)).length;
                  return (
                    <li
                      key={`${certificate.percent}:${certificate.isPresident ? 'president' : 'ordinary'}`}
                      className="flex items-center justify-between rounded-md border p-3"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <div className="text-sm">
                        <div className="font-medium">
                          {certificate.percent}% {certificate.isPresident ? "President's certificate" : 'shares'}
                        </div>
                        <div className={colors.text.secondary}>Available: {groupCertificateIds.length}</div>
                      </div>
                      <div className="ui-actions">
                        <button
                          type="button"
                          disabled={selectedCount === 0}
                          onClick={() => setSellGroupCount(corporation.id, groupCertificateIds, selectedCount - 1)}
                          className={`h-9 w-9 rounded ${selectedCount > 0 ? colors.button.secondary : colors.button.disabled}`}
                        >
                          −
                        </button>
                        <span className="min-w-8 text-center font-semibold">{selectedCount}</span>
                        <button
                          type="button"
                          disabled={selectedCount === groupCertificateIds.length}
                          onClick={() => setSellGroupCount(corporation.id, groupCertificateIds, selectedCount + 1)}
                          className={`h-9 w-9 rounded ${selectedCount < groupCertificateIds.length ? colors.button.secondary : colors.button.disabled}`}
                        >
                          +
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="ui-actions justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedSellCorporationId(null)}
                  className={`rounded-md px-4 py-2 text-sm font-medium ${colors.button.secondary}`}
                  style={{ minHeight: 42 }}
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
                  className={`rounded-md px-4 py-2 text-sm font-medium ${
                    selection.length > 0 ? colors.button.danger : colors.button.disabled
                  }`}
                  style={{ minHeight: 42 }}
                >
                  Sell selected
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <section className="mb-6">
        <h3 className={`mb-2 text-sm font-semibold uppercase tracking-wide ${colors.text.secondary}`}>
          Private Trade
        </h3>
        {pendingTrade ? (
          <div className="ui-surface-warning rounded border p-3 text-sm">
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
            <div className={`mt-1 text-xs ${colors.text.secondary}`}>
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
            className={`rounded-md px-3 py-1 text-sm font-medium ${colors.button.primary}`}
          >
            Propose private trade
          </button>
        ) : (
          <div className={`text-sm ${colors.text.secondary}`}>
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
