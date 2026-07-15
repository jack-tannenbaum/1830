import { STOCK_MARKET_COLOR_GRID, STOCK_MARKET_GRID } from "./constants";
import type { CorporationId, GameState } from "./model";

export type MarketDirection = "up" | "down" | "left" | "right";
export type MarketZone = "white" | "red" | "orange" | "yellow" | "brown";

type MarketPosition = NonNullable<GameState["corporations"][CorporationId]["market"]>;

function isMarketCell(row: number, column: number): boolean {
  return row >= 0
    && row < STOCK_MARKET_GRID.length
    && column >= 0
    && column < STOCK_MARKET_GRID[row].length
    && STOCK_MARKET_GRID[row][column] !== null;
}

function destinationFor(position: MarketPosition, direction: MarketDirection): Pick<MarketPosition, "row" | "column"> {
  const direct = {
    up: { row: position.row - 1, column: position.column },
    down: { row: position.row + 1, column: position.column },
    left: { row: position.row, column: position.column - 1 },
    right: { row: position.row, column: position.column + 1 },
  }[direction];

  if (isMarketCell(direct.row, direct.column)) return direct;

  // Dividend movement at the right edge moves up; withholding at the left edge
  // moves down. Vertical movement has no secondary fallback.
  if (direction === "right") {
    const fallback = { row: position.row - 1, column: position.column };
    return isMarketCell(fallback.row, fallback.column) ? fallback : position;
  }
  if (direction === "left") {
    const fallback = { row: position.row + 1, column: position.column };
    return isMarketCell(fallback.row, fallback.column) ? fallback : position;
  }
  return position;
}

export function getMarketPrice(state: GameState, corporationId: CorporationId): number | null {
  const position = state.corporations[corporationId]?.market;
  if (!position || !isMarketCell(position.row, position.column)) return null;
  return Number(STOCK_MARKET_GRID[position.row][position.column]);
}

export function getMarketZone(state: GameState, corporationId: CorporationId): MarketZone | null {
  const position = state.corporations[corporationId]?.market;
  if (!position || !isMarketCell(position.row, position.column)) return null;
  return STOCK_MARKET_COLOR_GRID[position.row][position.column] as MarketZone;
}

export function moveMarketToken(
  state: GameState,
  corporationId: CorporationId,
  direction: MarketDirection,
): GameState {
  const corporation = state.corporations[corporationId];
  if (!corporation) throw new Error(`Unknown corporation ${corporationId}`);
  if (!corporation.market) return state;

  const source = corporation.market;
  const destination = destinationFor(source, direction);
  if (destination.row === source.row && destination.column === source.column) return state;

  const corporations = { ...state.corporations };

  const sourceTokens = Object.values(state.corporations)
    .filter((candidate) => candidate.id !== corporationId
      && candidate.market?.row === source.row
      && candidate.market.column === source.column)
    .sort((a, b) => (a.market?.stackIndex ?? 0) - (b.market?.stackIndex ?? 0));

  sourceTokens.forEach((candidate, stackIndex) => {
    corporations[candidate.id] = {
      ...candidate,
      market: { ...candidate.market!, stackIndex },
    };
  });

  const destinationTokens = Object.values(state.corporations)
    .filter((candidate) => candidate.id !== corporationId
      && candidate.market?.row === destination.row
      && candidate.market.column === destination.column);
  const destinationStackIndex = destinationTokens.length === 0
    ? 0
    : Math.max(...destinationTokens.map((candidate) => candidate.market!.stackIndex)) + 1;

  corporations[corporationId] = {
    ...corporation,
    market: { ...destination, stackIndex: destinationStackIndex },
  };

  return { ...state, corporations };
}
