import {
  CERTIFICATE_LIMIT,
  PAR_VALUES,
  STOCK_MARKET_COLOR_GRID,
  STOCK_MARKET_GRID,
} from "./constants";
import { getMarketPrice, getMarketZone, type MarketZone } from "./market";
import type {
  CertificateId,
  BidOffState,
  CorporationId,
  CorporationState,
  GameState,
  PendingPrivateTrade,
  PlayerId,
  PlayerState,
  PrivateId,
  PrivateState,
} from "./model";
import {
  certificatesForPlayer,
  countedCertificateTotal,
  ownershipPercent,
  poolPercent,
  soldCertificateCount,
} from "./ownership";

export interface AvailablePrivateActions {
  availableCash: number;
  mayBuyOfferedPrivate: boolean;
  advanceBidPrivateIds: PrivateId[];
  mayRaiseBid: boolean;
  mayPass: boolean;
  mustSetBOPar: boolean;
  availableBOParPrices: number[];
}

export interface AuctionPrivateView {
  privateCompany: PrivateState;
  bids: Array<{ playerId: PlayerId; amount: number }>;
  lockedAmount: number;
}

export interface AuctionView {
  currentPlayer: PlayerState;
  currentPrivate: PrivateState;
  privates: AuctionPrivateView[];
  actions: AvailablePrivateActions;
  bidOff: BidOffState | null;
}

export interface StockRoundView {
  currentPlayer: PlayerState;
  mayPass: boolean;
  mayFinishTurn: boolean;
  purchasableCertificateIds: CertificateId[];
  sellableCertificateIds: CertificateId[];
  pendingPrivateTrade: PendingPrivateTrade | null;
}

export interface CorporationOwnershipView {
  corporationId: CorporationId;
  presidentId: PlayerId | null;
  holders: Array<{
    player: PlayerState;
    percent: number;
    certificateIds: CertificateId[];
  }>;
  poolPercent: number;
  soldCertificateCount: number;
}

export interface CertificateLimitStatus {
  playerId: PlayerId;
  count: number;
  limit: number;
  remaining: number;
  overLimit: boolean;
}

export interface StockMarketCellView {
  row: number;
  column: number;
  price: number;
  zone: MarketZone;
  corporationIds: CorporationId[];
}

export interface StockMarketView {
  cells: StockMarketCellView[];
}

export interface OperatingShellView {
  operatingOrder: CorporationState[];
  currentCorporation: CorporationState | null;
  currentIndex: number;
  stopAfterShell: boolean;
}

function bySeat(left: PlayerState, right: PlayerState): number {
  return left.seat - right.seat || left.id.localeCompare(right.id);
}

function sortedPrivates(state: GameState): PrivateState[] {
  return Object.values(state.privates)
    .sort((left, right) => left.faceValue - right.faceValue || left.id.localeCompare(right.id));
}

function corporationDefinitionIndex(state: GameState, corporationId: CorporationId): number {
  const index = state.corporationOrder.indexOf(corporationId);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function availableAuctionCash(
  state: GameState,
  playerId: PlayerId,
  excludingPrivateId?: PrivateId,
): number {
  const locked = Object.entries(state.auction?.lockedByPlayer[playerId] ?? {})
    .filter(([privateId]) => privateId !== excludingPrivateId)
    .reduce((total, [, amount]) => total + amount, 0);
  return (state.players[playerId]?.cash ?? 0) - locked;
}

function requirePlayer(state: GameState, playerId: PlayerId | undefined): PlayerState {
  const player = playerId ? state.players[playerId] : undefined;
  if (!player) throw new Error("Selector requires a current player");
  return player;
}

export function getCurrentActor(state: GameState): PlayerState | null {
  const playerId = state.round === "privateAuction"
    ? state.auction?.bidOff?.currentActorId ?? state.auction?.currentActorId
    : state.round === "stock"
      ? state.stock?.currentActorId
      : undefined;
  return playerId ? state.players[playerId] ?? null : null;
}

export function getAvailablePrivateActions(state: GameState): AvailablePrivateActions {
  const auction = state.auction;
  if (state.round !== "privateAuction" || !auction) {
    return {
      availableCash: 0,
      mayBuyOfferedPrivate: false,
      advanceBidPrivateIds: [],
      mayRaiseBid: false,
      mayPass: false,
      mustSetBOPar: false,
      availableBOParPrices: [],
    };
  }

  const actorId = auction.bidOff?.currentActorId ?? auction.currentActorId;
  const availableCash = availableAuctionCash(state, actorId);
  const mustSetBOPar = auction.pendingBOParPlayerId === actorId;
  const currentPrivate = state.privates[auction.currentPrivateId];
  const privateOrder = sortedPrivates(state);
  const currentIndex = privateOrder.findIndex(({ id }) => id === auction.currentPrivateId);
  const advanceBidPrivateIds = mustSetBOPar || auction.bidOff
    ? []
    : privateOrder
      .slice(currentIndex + 1)
      .filter((privateCompany) => {
        if (privateCompany.location.type !== "bank") return false;
        const bids = auction.bidsByPrivate[privateCompany.id] ?? [];
        if (bids.some((bid) => bid.playerId === actorId)) return false;
        const minimum = Math.max(privateCompany.faceValue, ...bids.map(({ amount }) => amount)) + 5;
        return availableCash >= minimum;
      })
      .map(({ id }) => id);
  const bidOffParticipant = auction.bidOff?.participantIds.includes(actorId) ?? false;
  const bidOffPassed = auction.bidOff?.passedPlayerIds.includes(actorId) ?? false;

  return {
    availableCash,
    mayBuyOfferedPrivate: !mustSetBOPar
      && !auction.bidOff
      && currentPrivate?.location.type === "bank"
      && availableCash >= currentPrivate.offeredPrice,
    advanceBidPrivateIds,
    mayRaiseBid: !mustSetBOPar
      && Boolean(auction.bidOff)
      && bidOffParticipant
      && !bidOffPassed
      && availableAuctionCash(state, actorId, auction.bidOff?.privateId)
        >= (auction.bidOff?.standingBid ?? 0) + 5,
    mayPass: !mustSetBOPar && (!auction.bidOff || (bidOffParticipant && !bidOffPassed)),
    mustSetBOPar,
    availableBOParPrices: mustSetBOPar ? [...PAR_VALUES] : [],
  };
}

export function getAuctionView(state: GameState): AuctionView {
  if (state.round !== "privateAuction" || !state.auction) {
    throw new Error("Auction view requested outside the private auction");
  }
  const actorId = state.auction.bidOff?.currentActorId ?? state.auction.currentActorId;
  return {
    currentPlayer: requirePlayer(state, actorId),
    currentPrivate: state.privates[state.auction.currentPrivateId],
    privates: sortedPrivates(state).map((privateCompany) => ({
      privateCompany,
      bids: [...(state.auction?.bidsByPrivate[privateCompany.id] ?? [])]
        .sort((left, right) => right.amount - left.amount || left.playerId.localeCompare(right.playerId))
        .map(({ playerId, amount }) => ({ playerId, amount })),
      lockedAmount: state.auction?.lockedByPlayer[actorId]?.[privateCompany.id] ?? 0,
    })),
    actions: getAvailablePrivateActions(state),
    bidOff: state.auction.bidOff ? {
      ...state.auction.bidOff,
      participantIds: [...state.auction.bidOff.participantIds],
      passedPlayerIds: [...state.auction.bidOff.passedPlayerIds],
    } : null,
  };
}

export function getCorporationPresident(
  state: GameState,
  corporationId: CorporationId,
): PlayerId | null {
  const president = Object.values(state.certificates)
    .filter((certificate) => certificate.corporationId === corporationId && certificate.isPresident)
    .sort((left, right) => left.id.localeCompare(right.id))[0];
  return president?.location.type === "player" ? president.location.playerId : null;
}

export function getCorporationOwnership(
  state: GameState,
  corporationId: CorporationId,
): CorporationOwnershipView {
  const holders = Object.values(state.players)
    .sort(bySeat)
    .map((player) => {
      const certificateIds = certificatesForPlayer(state, player.id)
        .filter((certificate) => certificate.corporationId === corporationId)
        .map(({ id }) => id)
        .sort((left, right) => left.localeCompare(right));
      return {
        player,
        percent: ownershipPercent(state, corporationId, player.id),
        certificateIds,
      };
    })
    .filter(({ percent }) => percent > 0);

  return {
    corporationId,
    presidentId: getCorporationPresident(state, corporationId),
    holders,
    poolPercent: poolPercent(state, corporationId),
    soldCertificateCount: soldCertificateCount(state, corporationId),
  };
}

export function getPlayerCertificateCount(state: GameState, playerId: PlayerId): number {
  return countedCertificateTotal(state, playerId);
}

export function getCertificateLimitStatus(
  state: GameState,
  playerId: PlayerId,
): CertificateLimitStatus {
  const count = getPlayerCertificateCount(state, playerId);
  const playerCount = state.playerOrder.length as keyof typeof CERTIFICATE_LIMIT;
  const limit = CERTIFICATE_LIMIT[playerCount];
  if (limit === undefined) throw new Error("Certificate limits require three to six players");
  return {
    playerId,
    count,
    limit,
    remaining: Math.max(0, limit - count),
    overLimit: count > limit,
  };
}

function canBuyCertificate(state: GameState, certificateId: CertificateId): boolean {
  const stock = state.stock;
  const certificate = state.certificates[certificateId];
  if (state.round !== "stock" || !stock || !certificate || stock.pendingPrivateTrade) return false;
  const correction = stock.certificateLimitCorrectionByPlayer[stock.currentActorId];
  if (correction?.active && correction.excessCount > 0) return false;
  if (certificate.location.type !== "initialOffering" && certificate.location.type !== "bankPool") {
    return false;
  }
  const corporation = state.corporations[certificate.corporationId];
  if (!corporation || corporation.lifecycle === "unstarted") return false;
  if (stock.soldCorporationIdsByPlayer[stock.currentActorId]?.includes(corporation.id)) return false;
  const price = certificate.location.type === "initialOffering"
    ? corporation.parPrice
    : getMarketPrice(state, corporation.id);
  if (price === null || state.players[stock.currentActorId].cash < price) return false;

  const zone = getMarketZone(state, corporation.id);
  if (stock.turn.purchaseCount > 0 && zone !== "brown") return false;
  const corporationCertificates = certificatesForPlayer(state, stock.currentActorId)
    .filter((owned) => owned.corporationId === corporation.id).length;
  if (corporationCertificates >= 5 && zone !== "orange" && zone !== "brown") return false;
  if (zone !== "yellow" && zone !== "brown") {
    const { count, limit } = getCertificateLimitStatus(state, stock.currentActorId);
    if (count >= limit) return false;
  }
  return true;
}

export function getPurchasableCertificates(state: GameState): CertificateId[] {
  return Object.keys(state.certificates)
    .filter((certificateId) => canBuyCertificate(state, certificateId))
    .sort((left, right) => left.localeCompare(right));
}

function canSellCertificate(state: GameState, certificateId: CertificateId): boolean {
  const stock = state.stock;
  const certificate = state.certificates[certificateId];
  if (state.round !== "stock" || !stock || !certificate || state.isFirstStockRound) return false;
  if (stock.pendingPrivateTrade) return false;
  if (certificate.location.type !== "player"
    || certificate.location.playerId !== stock.currentActorId) return false;
  const restriction = certificate.saleRestrictedUntilCorporationParred;
  if (restriction && state.corporations[restriction]?.lifecycle === "unstarted") return false;
  return poolPercent(state, certificate.corporationId) + certificate.percent <= 50;
}

export function getSellableCertificates(state: GameState): CertificateId[] {
  return Object.keys(state.certificates)
    .filter((certificateId) => canSellCertificate(state, certificateId))
    .sort((left, right) => left.localeCompare(right));
}

export function getStockRoundView(state: GameState): StockRoundView {
  if (state.round !== "stock" || !state.stock) {
    throw new Error("Stock Round view requested outside a Stock Round");
  }
  const correction = state.stock.certificateLimitCorrectionByPlayer[state.stock.currentActorId];
  const correctionBlocksTurn = Boolean(correction?.active && correction.excessCount > 0);
  const tradePending = Boolean(state.stock.pendingPrivateTrade);
  return {
    currentPlayer: requirePlayer(state, state.stock.currentActorId),
    mayPass: !tradePending && !correctionBlocksTurn && !state.stock.turn.hasTransaction,
    mayFinishTurn: !tradePending && !correctionBlocksTurn && state.stock.turn.hasTransaction,
    purchasableCertificateIds: getPurchasableCertificates(state),
    sellableCertificateIds: getSellableCertificates(state),
    pendingPrivateTrade: state.stock.pendingPrivateTrade
      ? { ...state.stock.pendingPrivateTrade }
      : null,
  };
}

export function getStockMarketView(state: GameState): StockMarketView {
  const cells: StockMarketCellView[] = [];
  for (let row = 0; row < STOCK_MARKET_GRID.length; row += 1) {
    for (let column = 0; column < STOCK_MARKET_GRID[row].length; column += 1) {
      const value = STOCK_MARKET_GRID[row][column];
      const zone = STOCK_MARKET_COLOR_GRID[row][column];
      if (value === null || zone === null) continue;
      const corporationIds = Object.values(state.corporations)
        .filter((corporation) => corporation.market?.row === row
          && corporation.market.column === column)
        .sort((left, right) => (left.market?.stackIndex ?? 0) - (right.market?.stackIndex ?? 0)
          || corporationDefinitionIndex(state, left.id) - corporationDefinitionIndex(state, right.id))
        .map(({ id }) => id);
      cells.push({ row, column, price: Number(value), zone: zone as MarketZone, corporationIds });
    }
  }
  return { cells };
}

export function getOperatingOrder(state: GameState): CorporationId[] {
  return Object.values(state.corporations)
    .filter((corporation) => corporation.lifecycle === "operating" && corporation.market !== null)
    .sort((left, right) => {
      const priceDifference = (getMarketPrice(state, right.id) ?? 0)
        - (getMarketPrice(state, left.id) ?? 0);
      if (priceDifference !== 0) return priceDifference;
      const columnDifference = (right.market?.column ?? 0) - (left.market?.column ?? 0);
      if (columnDifference !== 0) return columnDifference;
      const stackDifference = (left.market?.stackIndex ?? 0) - (right.market?.stackIndex ?? 0);
      if (stackDifference !== 0) return stackDifference;
      return corporationDefinitionIndex(state, left.id) - corporationDefinitionIndex(state, right.id);
    })
    .map(({ id }) => id);
}

export function getOperatingShellView(state: GameState): OperatingShellView {
  const shell = state.operatingShell;
  const operatingOrderIds = shell?.operatingOrder ?? getOperatingOrder(state);
  return {
    operatingOrder: operatingOrderIds
      .map((corporationId) => state.corporations[corporationId])
      .filter((corporation): corporation is CorporationState => Boolean(corporation)),
    currentCorporation: shell?.currentCorporationId
      ? state.corporations[shell.currentCorporationId] ?? null
      : null,
    currentIndex: shell?.currentIndex ?? -1,
    stopAfterShell: shell?.stopAfterShell ?? state.bankBroken,
  };
}
