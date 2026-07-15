import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  getCorporationOwnership,
  getOperatingShellView,
  getStockMarketView,
} from '../engine/selectors';
import type { CorporationState } from '../engine/model';
import { useColors } from '../styles/colors';

function readableTextColor(color: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return '#ffffff';
  const channels = [1, 3, 5].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16));
  const luminance = (0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]) / 255;
  return luminance > 0.58 ? '#111827' : '#ffffff';
}

function CorporationToken({ corporation }: { corporation: CorporationState }) {
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full p-[2px] shadow-sm"
      style={{ backgroundColor: corporation.color }}
    >
      <span
        className="flex h-full w-full items-center justify-center rounded-full p-[2px]"
        style={{ backgroundColor: readableTextColor(corporation.color) }}
      >
        <span
          className="flex h-full w-full items-center justify-center rounded-full text-[11px] font-bold"
          style={{
            backgroundColor: corporation.color,
            color: readableTextColor(corporation.color),
          }}
        >
          {corporation.abbreviation}
        </span>
      </span>
    </div>
  );
}

/**
 * Financial Operating Round shell. The tabbed railroad workspace exposes only
 * state already owned by the engine; track, trains, routes, and dividends stay
 * absent until their engines exist.
 */
export const OperatingShell: React.FC = () => {
  const game = useGameStore((state) => state.game);
  const colors = useColors();
  const [selectedCorporationId, setSelectedCorporationId] = useState<string | null>(null);

  const currentCorporationId = game?.round === 'operatingShell'
    ? game.operatingShell?.currentCorporationId ?? null
    : null;

  useEffect(() => {
    if (currentCorporationId) setSelectedCorporationId(currentCorporationId);
  }, [currentCorporationId]);

  if (game === null || game.round !== 'operatingShell') return null;

  const view = getOperatingShellView(game);
  const current = view.currentCorporation;
  const selected = view.operatingOrder.find(({ id }) => id === selectedCorporationId)
    ?? current
    ?? view.operatingOrder[0]
    ?? null;
  const selectedOwnership = selected ? getCorporationOwnership(game, selected.id) : null;
  const selectedPresidentId = selectedOwnership?.presidentId ?? null;
  const selectedPresident = selectedPresidentId ? game.players[selectedPresidentId] ?? null : null;
  const marketCells = getStockMarketView(game).cells;
  const selectedMarketPrice = selected?.market
    ? marketCells.find((cell) => cell.row === selected.market!.row
      && cell.column === selected.market!.column)?.price ?? null
    : null;
  const corporationPrivates = selected
    ? Object.values(game.privates)
      .filter((privateCompany) => privateCompany.location.type === 'corporation'
        && privateCompany.location.corporationId === selected.id)
    : [];

  return (
    <section className="space-y-4">
      <div role="alert" className="ui-surface-warning rounded-lg border-2 p-4 font-semibold">
        Integration harness: trains, routes, dividends, and legal operating market movement are not implemented.
      </div>

      <div className={`overflow-hidden rounded-lg border ${colors.card.background} ${colors.card.border} ${colors.card.shadow}`}>
        <div
          role="tablist"
          aria-label="Railroads"
          className="flex overflow-x-auto border-b"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card-alt, var(--bg-card))' }}
        >
          {view.operatingOrder.map((corporation, index) => {
            const isSelected = selected?.id === corporation.id;
            const isCurrent = current?.id === corporation.id;
            return (
              <button
                key={corporation.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCorporationId(corporation.id)}
                className={`relative min-w-36 border-r px-5 py-4 text-left transition-colors ${
                  isSelected ? colors.text.primary : colors.text.secondary
                }`}
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: isSelected ? 'var(--bg-card)' : 'transparent',
                  boxShadow: isSelected ? `inset 0 -3px 0 ${corporation.color}` : undefined,
                }}
              >
                <span className="block text-xs font-semibold uppercase tracking-wide">
                  {index + 1}. {corporation.abbreviation}
                </span>
                <span className="mt-1 block whitespace-nowrap text-xs">
                  {isCurrent ? 'Now operating' : 'Inspect'}
                </span>
              </button>
            );
          })}
        </div>

        {selected && selectedOwnership && (
          <div role="tabpanel" className="p-4">
            <div className="operating-corp-header">
              <div className="flex items-center gap-4">
                <CorporationToken corporation={selected} />
                <div>
                  <h2 className={`text-2xl font-semibold ${colors.text.primary}`}>{selected.name}</h2>
                  <p className={`mt-1 text-sm ${colors.text.secondary}`}>
                    President: {selectedPresident?.name ?? 'None'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2" aria-label="Operating actions">
                {['Lay Track', 'Place Station', 'Run Trains', 'Buy Train'].map((action) => (
                  <button
                    key={action}
                    type="button"
                    disabled
                    title={`${action} is not implemented yet`}
                    className={`rounded px-3 py-2 text-sm font-medium ${colors.button.disabled}`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="operating-details-grid mt-3 border-t pt-3"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <th className={`py-0.5 pr-3 text-left text-xs font-semibold uppercase tracking-wide ${colors.text.tertiary}`}>
                        Treasury
                      </th>
                      <td className={`py-0.5 text-right font-semibold ${colors.text.primary}`}>
                        ${selected.treasury}
                      </td>
                    </tr>
                    <tr>
                      <th className={`py-0.5 pr-3 text-left text-xs font-semibold uppercase tracking-wide ${colors.text.tertiary}`}>
                        Market
                      </th>
                      <td className={`py-0.5 text-right font-semibold ${colors.text.primary}`}>
                        {selectedMarketPrice === null ? '—' : `$${selectedMarketPrice}`}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-2 border-t pt-2" style={{ borderColor: 'var(--border-color)' }}>
                  <h3 className={`mb-1 text-xs font-semibold uppercase tracking-wide ${colors.text.tertiary}`}>
                    Player ownership
                  </h3>
                  {selectedOwnership.holders.length > 0 ? (
                    <table className="w-full text-sm">
                      <tbody>
                        {[...selectedOwnership.holders]
                          .sort((left, right) => {
                            if (left.player.id === selectedOwnership.presidentId) return -1;
                            if (right.player.id === selectedOwnership.presidentId) return 1;
                            return left.player.seat - right.player.seat;
                          })
                          .map((holder) => (
                            <tr key={holder.player.id}>
                              <td className={`py-0.5 pr-4 ${colors.text.secondary}`}>
                                {holder.player.name}
                                {selectedOwnership.presidentId === holder.player.id && (
                                  <span className="ml-1 font-bold" style={{ color: '#FFD700' }}>P</span>
                                )}
                              </td>
                              <td className={`py-0.5 text-right font-semibold ${colors.text.primary}`}>
                                {holder.percent}%
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  ) : (
                    <span className={`text-sm ${colors.text.tertiary}`}>No player shares</span>
                  )}
                </div>
              </div>

              <div>
                {corporationPrivates.length > 0 && (
                  <section>
                    <h3 className={`mb-1 text-xs font-semibold uppercase tracking-wide ${colors.text.tertiary}`}>
                      Private companies
                    </h3>
                    <table className="w-full text-sm">
                      <tbody>
                        {corporationPrivates.map((privateCompany) => (
                          <tr key={privateCompany.id}>
                            <td className={`py-0.5 pr-4 ${colors.text.secondary}`}>{privateCompany.name}</td>
                            <td className={`py-0.5 text-right font-semibold ${colors.text.primary}`}>
                              ${privateCompany.revenue}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
