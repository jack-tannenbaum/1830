import { STARTING_CASH } from "./constants";
import type {
  AuctionBid,
  Certificate,
  CorporationState,
  GameState,
  PlayerId,
  PlayerState,
  PrivateState,
} from "./model";

export interface CreateGameInput {
  gameId: string;
  playerNames: string[];
  placeOrder: number[];
}

const CORPORATION_SEEDS = [
  { id: "PRR", name: "Pennsylvania Railroad", abbreviation: "PRR", color: "#008000" },
  { id: "NYC", name: "New York Central", abbreviation: "NYC", color: "#1f2937" },
  { id: "CPR", name: "Canadian Pacific", abbreviation: "CPR", color: "#ff0000" },
  { id: "B&O", name: "Baltimore & Ohio", abbreviation: "B&O", color: "#800080" },
  { id: "C&O", name: "Chesapeake & Ohio", abbreviation: "C&O", color: "#0000ff" },
  { id: "ERIE", name: "Erie Railroad", abbreviation: "ERIE", color: "#ffff00" },
  { id: "NNH", name: "New York, New Haven & Hartford", abbreviation: "NNH", color: "#ffa500" },
  { id: "B&M", name: "Boston & Maine", abbreviation: "B&M", color: "#8b4513" },
] as const;

const PRIVATE_SEEDS = [
  { id: "SVN", name: "Schuylkill Valley", faceValue: 20, revenue: 5 },
  { id: "CSL", name: "Champlain & St. Lawrence", faceValue: 40, revenue: 10 },
  { id: "DH", name: "Delaware & Hudson", faceValue: 70, revenue: 15 },
  { id: "MH", name: "Mohawk & Hudson", faceValue: 110, revenue: 20 },
  { id: "CA", name: "Camden & Amboy", faceValue: 160, revenue: 25 },
  { id: "BO", name: "Baltimore & Ohio", faceValue: 220, revenue: 30 },
] as const;

function assertValidPlaceOrder(playerCount: number, placeOrder: number[]): void {
  const expected = Array.from({ length: playerCount }, (_, index) => index);
  const actual = [...placeOrder].sort((left, right) => left - right);
  if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    throw new Error("Place order must contain every player index exactly once");
  }
}

function createPlayers(
  playerNames: string[],
  playerOrder: PlayerId[],
  cash: number,
): Record<PlayerId, PlayerState> {
  const seatByPlayer = new Map(playerOrder.map((playerId, seat) => [playerId, seat]));
  return Object.fromEntries(
    playerNames.map((name, index) => {
      const id = `player-${index + 1}`;
      return [id, { id, name, cash, seat: seatByPlayer.get(id) ?? index }];
    }),
  );
}

function createCorporations(): Record<string, CorporationState> {
  return Object.fromEntries(
    CORPORATION_SEEDS.map((seed) => [
      seed.id,
      {
        ...seed,
        lifecycle: "unstarted" as const,
        parPrice: null,
        market: null,
        treasury: 0,
      },
    ]),
  );
}

function createCertificates(): Record<string, Certificate> {
  const certificates: Array<[string, Certificate]> = [];
  for (const corporation of CORPORATION_SEEDS) {
    const presidentId = `${corporation.id}-president`;
    certificates.push([
      presidentId,
      {
        id: presidentId,
        corporationId: corporation.id,
        percent: 20,
        isPresident: true,
        saleRestrictedUntilCorporationParred: null,
        location: { type: "initialOffering" },
      },
    ]);
    for (let index = 1; index <= 8; index += 1) {
      const id = `${corporation.id}-10-${index}`;
      certificates.push([
        id,
        {
          id,
          corporationId: corporation.id,
          percent: 10,
          isPresident: false,
          saleRestrictedUntilCorporationParred: null,
          location: { type: "initialOffering" },
        },
      ]);
    }
  }
  return Object.fromEntries(certificates);
}

function createPrivates(): Record<string, PrivateState> {
  return Object.fromEntries(
    PRIVATE_SEEDS.map((seed) => [
      seed.id,
      {
        ...seed,
        offeredPrice: seed.faceValue,
        location: { type: "bank" as const },
      },
    ]),
  );
}

function emptyBidsByPrivate(): Record<string, AuctionBid[]> {
  return Object.fromEntries(PRIVATE_SEEDS.map(({ id }) => [id, []]));
}

function buildInitialState(
  input: CreateGameInput,
  playerOrder: PlayerId[],
  cash: number,
): GameState {
  const firstPlayerId = playerOrder[0];
  return {
    id: input.gameId,
    version: 0,
    round: "privateAuction",
    roundNumber: 1,
    isFirstStockRound: true,
    playerOrder,
    corporationOrder: CORPORATION_SEEDS.map(({ id }) => id),
    players: createPlayers(input.playerNames, playerOrder, cash),
    corporations: createCorporations(),
    certificates: createCertificates(),
    privates: createPrivates(),
    bankCash: 9_600,
    priorityDealPlayerId: firstPlayerId,
    lastTransactionPlayerId: null,
    auction: {
      currentActorId: firstPlayerId,
      currentPrivateId: PRIVATE_SEEDS[0].id,
      consecutivePasses: 0,
      bidsByPrivate: emptyBidsByPrivate(),
      lockedByPlayer: Object.fromEntries(playerOrder.map((playerId) => [playerId, {}])),
      bidOff: null,
      pendingBOParPlayerId: null,
    },
    stock: null,
    operatingShell: null,
    bankBroken: false,
    bankObligations: [],
    appliedCommandIds: [],
  };
}

export function createGame(input: CreateGameInput): GameState {
  if (input.playerNames.length < 3 || input.playerNames.length > 6) {
    throw new Error("1830 requires 3-6 players");
  }
  assertValidPlaceOrder(input.playerNames.length, input.placeOrder);
  const playerOrder = input.placeOrder.map((index) => `player-${index + 1}`);
  const cash = STARTING_CASH[input.playerNames.length as 3 | 4 | 5 | 6];
  return buildInitialState(input, playerOrder, cash);
}
