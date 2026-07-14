import React from 'react';
import { useGameStore } from '../store/gameStore';
import { getStockMarketView, type StockMarketCellView } from '../engine/selectors';
import type { CorporationState, GameState } from '../engine/model';
import type { MarketZone } from '../engine/market';
import { useColors } from '../styles/colors';

interface StockMarketDisplayProps {
  className?: string;
}

const ZONE_STYLE: Record<MarketZone, React.CSSProperties> = {
  orange: { backgroundColor: 'var(--stock-orange)' },
  yellow: { backgroundColor: 'var(--stock-yellow)' },
  red: { backgroundColor: 'var(--stock-red)' },
  brown: { backgroundColor: 'var(--stock-brown)' },
  white: { backgroundColor: 'var(--stock-gray)' },
};

interface CellProps {
  cell: StockMarketCellView;
  corporations: Record<string, CorporationState>;
}

const StockMarketCell: React.FC<CellProps> = ({ cell, corporations }) => {
  const stackedCorporations = cell.corporationIds
    .map((id) => corporations[id])
    .filter((corporation): corporation is CorporationState => Boolean(corporation));

  const tooltip = stackedCorporations.length > 0
    ? `$${cell.price} - ${stackedCorporations
        .map((corporation) => `${corporation.name} (${corporation.abbreviation})`)
        .join(', ')}`
    : `$${cell.price}`;

  return (
    <div
      className={`stock-cell relative ${stackedCorporations.length > 0 ? 'group' : ''}`}
      style={ZONE_STYLE[cell.zone]}
      title={tooltip}
    >
      {cell.price}
      {stackedCorporations.length > 0 ? (
        <div className="absolute inset-0 flex items-center justify-center p-1">
          {stackedCorporations.map((corporation, index) => {
            const totalOffset = (stackedCorporations.length - 1) * 2;
            const centerOffset = totalOffset / 2;
            const totalHeightOffset = (stackedCorporations.length - 1) * 1;
            const centerHeightOffset = totalHeightOffset / 2;
            // stackIndex 0 (first in list) renders on top => highest z-index.
            const zIndex = stackedCorporations.length - index;
            return (
              <div
                key={corporation.id}
                className="flex-shrink-0 absolute"
                style={{
                  backgroundColor: corporation.color,
                  borderRadius: '3px',
                  padding: '2px 4px',
                  fontSize: '8px',
                  fontWeight: 'bold',
                  color: 'white',
                  textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
                  minWidth: '16px',
                  textAlign: 'center',
                  left: `calc(50% - 8px + ${(index * 2) - centerOffset}px)`,
                  top: `calc(50% - 6px + ${(index * 1) - centerHeightOffset}px)`,
                  zIndex,
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                {corporation.abbreviation}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

const selectGame = (state: { game: GameState | null }) => state.game;

export const StockMarketDisplay: React.FC<StockMarketDisplayProps> = ({ className = '' }) => {
  const game = useGameStore(selectGame);
  const colors = useColors();

  const view = React.useMemo(() => (game ? getStockMarketView(game) : null), [game]);

  if (!game || !view) return null;

  // Preserve the selector's cell order; derive grid extents so we can render
  // a rectangular table with blanks for missing cells.
  let maxRow = -1;
  let maxColumn = -1;
  const byPosition = new Map<string, StockMarketCellView>();
  for (const cell of view.cells) {
    if (cell.row > maxRow) maxRow = cell.row;
    if (cell.column > maxColumn) maxColumn = cell.column;
    byPosition.set(`${cell.row}-${cell.column}`, cell);
  }

  const cellNodes: React.ReactNode[] = [];
  for (let row = 0; row <= maxRow; row += 1) {
    for (let column = 0; column <= maxColumn; column += 1) {
      const cell = byPosition.get(`${row}-${column}`);
      cellNodes.push(
        cell ? (
          <StockMarketCell
            key={`${row}-${column}`}
            cell={cell}
            corporations={game.corporations}
          />
        ) : (
          <div key={`${row}-${column}`} className="stock-cell stock-cell-empty" />
        ),
      );
    }
  }

  const columnCount = maxColumn + 1;

  return (
    <div className={`${colors.gameBoard.stockMarket.background} p-4 rounded-lg ${className}`}>
      <div
        className="grid gap-1 text-xs"
        style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
      >
        {cellNodes}
      </div>
    </div>
  );
};
