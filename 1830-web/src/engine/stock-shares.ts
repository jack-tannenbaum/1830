import type { StockCommand } from "./commands";
import { CERTIFICATE_LIMIT, PAR_VALUES, STOCK_MARKET_COLOR_GRID, STOCK_MARKET_GRID } from "./constants";
import {
  applyPresidencyTransfer,
  calculatePresident,
  updateFloatEligibility,
} from "./corporations";
import { assertGameInvariants } from "./invariants";
import { payFromBank } from "./ledger";
import { getMarketPrice, getMarketZone, moveMarketToken } from "./market";
import type {
  Certificate,
  CorporationId,
  GameState,
  PlayerId,
} from "./model";
import {
  certificatesForPlayer,
  countedCertificateTotal,
  ownershipPercent,
  poolPercent,
} from "./ownership";
import type { CommandResult, DomainEvent, RuleErrorCode } from "./results";

type StartCommand = Extract<StockCommand, { type: "stock.startCorporation" }>;
type BuyCommand = Extract<StockCommand, { type: "stock.buyCertificate" }>;
type SellCommand = Extract<StockCommand, { type: "stock.sellCertificates" }>;

function reject(code: RuleErrorCode, message: string): CommandResult {
  return { ok: false, code, message };
}

function accept(state: GameState, events: DomainEvent[]): CommandResult {
  assertGameInvariants(state);
  return { ok: true, state, events };
}

function validateShareAction(state: GameState, actorId: PlayerId): CommandResult | null {
  if (state.round !== "stock" || !state.stock) {
    return reject("ACTION_NOT_ALLOWED_IN_ROUND", "A Stock Round is not active");
  }
  if (!state.players[actorId]) {
    return reject("ACTION_NOT_ALLOWED_IN_ROUND", "Unknown player");
  }
  if (state.stock.currentActorId !== actorId || state.stock.turn.actorId !== actorId) {
    return reject("NOT_CURRENT_PLAYER", "Only the current Stock Round player may act");
  }
  if (state.stock.pendingPrivateTrade) {
    return reject("ACTION_NOT_ALLOWED_IN_ROUND", "The pending private trade must be resolved");
  }
  const correction = state.stock.certificateLimitCorrectionByPlayer[actorId];
  if (correction?.active && correction.excessCount > 0) {
    return reject("CERTIFICATE_LIMIT_EXCEEDED", "Excess certificates must be sold first");
  }
  return null;
}

function certificateLimit(state: GameState): number {
  const limit = CERTIFICATE_LIMIT[state.playerOrder.length as keyof typeof CERTIFICATE_LIMIT];
  if (!limit) throw new Error(`Unsupported player count ${state.playerOrder.length}`);
  return limit;
}

function certificatesHeld(
  state: GameState,
  corporationId: CorporationId,
  playerId: PlayerId,
): number {
  return certificatesForPlayer(state, playerId)
    .filter((certificate) => certificate.corporationId === corporationId)
    .length;
}

function redMarketPosition(
  state: GameState,
  parPrice: number,
): { row: number; column: number; stackIndex: number } {
  for (let row = 0; row < STOCK_MARKET_GRID.length; row += 1) {
    for (let column = 0; column < STOCK_MARKET_GRID[row].length; column += 1) {
      if (STOCK_MARKET_COLOR_GRID[row][column] !== "red"
        || Number(STOCK_MARKET_GRID[row][column]) !== parPrice) continue;
      const destinationTokens = Object.values(state.corporations).filter(
        (corporation) => corporation.market?.row === row && corporation.market.column === column,
      );
      const stackIndex = destinationTokens.length === 0
        ? 0
        : Math.max(...destinationTokens.map((corporation) => corporation.market!.stackIndex)) + 1;
      return { row, column, stackIndex };
    }
  }
  throw new Error(`No red market space for par ${parPrice}`);
}

function markPurchase(
  state: GameState,
  actorId: PlayerId,
  purchaseIncrement = 1,
): GameState {
  return {
    ...state,
    lastTransactionPlayerId: actorId,
    stock: {
      ...state.stock!,
      consecutivePasses: 0,
      turn: {
        ...state.stock!.turn,
        hasTransaction: true,
        purchaseCount: state.stock!.turn.purchaseCount + purchaseIncrement,
      },
    },
  };
}

function validateResultingLimits(
  state: GameState,
  actorId: PlayerId,
  corporationId: CorporationId,
): CommandResult | null {
  const zone = getMarketZone(state, corporationId);
  if (zone !== "orange" && zone !== "brown"
    && certificatesHeld(state, corporationId, actorId) > 5) {
    return reject(
      "CORPORATION_HOLDING_LIMIT_EXCEEDED",
      "A player may not hold more than five certificates in this corporation",
    );
  }
  if (countedCertificateTotal(state, actorId) > certificateLimit(state)) {
    return reject("CERTIFICATE_LIMIT_EXCEEDED", "The purchase exceeds the certificate limit");
  }
  return null;
}

export function executeStartCorporation(
  state: GameState,
  command: StartCommand,
): CommandResult {
  const invalidAction = validateShareAction(state, command.actorId);
  if (invalidAction) return invalidAction;
  const corporation = state.corporations[command.payload.corporationId];
  if (!corporation || corporation.lifecycle !== "unstarted") {
    return reject("ACTION_NOT_ALLOWED_IN_ROUND", "The corporation cannot be started");
  }
  if (!(PAR_VALUES as readonly number[]).includes(command.payload.parPrice)) {
    return reject("INVALID_PAR_PRICE", "Invalid par price");
  }
  if (state.stock!.turn.purchaseCount > 0) {
    return reject("STOCK_TURN_ALREADY_COMPLETE", "The turn already includes a purchase");
  }
  const president = Object.values(state.certificates).find(
    (certificate) => certificate.corporationId === corporation.id && certificate.isPresident,
  );
  if (!president || president.location.type !== "initialOffering") {
    return reject("ACTION_NOT_ALLOWED_IN_ROUND", "The president certificate is unavailable");
  }
  const cost = command.payload.parPrice * 2;
  const player = state.players[command.actorId];
  if (player.cash < cost) {
    return reject("INSUFFICIENT_AVAILABLE_CASH", "Insufficient cash to buy the presidency");
  }

  const market = redMarketPosition(state, command.payload.parPrice);
  const certificates = Object.fromEntries(
    Object.entries(state.certificates).map(([certificateId, certificate]) => [
      certificateId,
      certificate.id === president.id
        ? { ...certificate, location: { type: "player" as const, playerId: command.actorId } }
        : certificate.saleRestrictedUntilCorporationParred === corporation.id
          ? { ...certificate, saleRestrictedUntilCorporationParred: null }
          : certificate,
    ]),
  );
  let nextState: GameState = {
    ...state,
    players: {
      ...state.players,
      [command.actorId]: { ...player, cash: player.cash - cost },
    },
    bankCash: state.bankCash + cost,
    corporations: {
      ...state.corporations,
      [corporation.id]: {
        ...corporation,
        lifecycle: "parred",
        parPrice: command.payload.parPrice,
        market,
      },
    },
    certificates,
  };
  const limitError = validateResultingLimits(nextState, command.actorId, corporation.id);
  if (limitError) return limitError;
  nextState = updateFloatEligibility(nextState, corporation.id);
  nextState = markPurchase(nextState, command.actorId);
  return accept(nextState, [{
    type: "corporation.parred",
    message: `${corporation.name} was parred at $${command.payload.parPrice}`,
    data: {
      corporationId: corporation.id,
      playerId: command.actorId,
      parPrice: command.payload.parPrice,
    },
  }]);
}

export function executeBuyCertificate(
  state: GameState,
  command: BuyCommand,
): CommandResult {
  const invalidAction = validateShareAction(state, command.actorId);
  if (invalidAction) return invalidAction;
  const certificate = state.certificates[command.payload.certificateId];
  if (!certificate || certificate.isPresident
    || (certificate.location.type !== "initialOffering"
      && certificate.location.type !== "bankPool")) {
    return reject("ACTION_NOT_ALLOWED_IN_ROUND", "The requested certificate is unavailable");
  }
  const corporation = state.corporations[certificate.corporationId];
  if (!corporation || corporation.lifecycle === "unstarted" || corporation.parPrice === null) {
    return reject("ACTION_NOT_ALLOWED_IN_ROUND", "The corporation has not been started");
  }
  if (state.stock!.soldCorporationIdsByPlayer[command.actorId]?.includes(corporation.id)) {
    return reject("CANNOT_BUY_AFTER_SELLING", "Cannot buy a corporation sold this Stock Round");
  }
  const zone = getMarketZone(state, corporation.id);
  if (zone !== "brown" && state.stock!.turn.purchaseCount > 0) {
    return reject("STOCK_TURN_ALREADY_COMPLETE", "The turn already includes a purchase");
  }
  const price = certificate.location.type === "initialOffering"
    ? corporation.parPrice
    : getMarketPrice(state, corporation.id);
  if (price === null) {
    return reject("ACTION_NOT_ALLOWED_IN_ROUND", "The corporation has no market price");
  }
  const player = state.players[command.actorId];
  if (player.cash < price) {
    return reject("INSUFFICIENT_AVAILABLE_CASH", "Insufficient cash to buy the certificate");
  }

  let nextState: GameState = {
    ...state,
    players: {
      ...state.players,
      [command.actorId]: { ...player, cash: player.cash - price },
    },
    bankCash: state.bankCash + price,
    certificates: {
      ...state.certificates,
      [certificate.id]: {
        ...certificate,
        location: { type: "player", playerId: command.actorId },
      },
    },
  };
  const limitError = validateResultingLimits(nextState, command.actorId, corporation.id);
  if (limitError) return limitError;
  try {
    nextState = applyPresidencyTransfer(nextState, corporation.id);
  } catch (error) {
    return reject(
      "PRESIDENCY_CANNOT_TRANSFER",
      error instanceof Error ? error.message : "The presidency cannot transfer",
    );
  }
  nextState = updateFloatEligibility(nextState, corporation.id);
  nextState = markPurchase(nextState, command.actorId);
  return accept(nextState, [{
    type: "stock.certificatePurchased",
    message: `${player.name} bought ${certificate.id}`,
    data: {
      playerId: command.actorId,
      corporationId: corporation.id,
      certificateId: certificate.id,
      price,
    },
  }]);
}

function nextPlayersLeftOf(state: GameState, playerId: PlayerId): PlayerId[] {
  const start = state.playerOrder.indexOf(playerId);
  return Array.from(
    { length: state.playerOrder.length - 1 },
    (_, offset) => state.playerOrder[(start + offset + 1) % state.playerOrder.length],
  );
}

function applyPresidentCertificateSale(
  state: GameState,
  corporationId: CorporationId,
  outgoingPresidentId: PlayerId,
): GameState {
  const president = Object.values(state.certificates).find(
    (certificate) => certificate.corporationId === corporationId && certificate.isPresident,
  );
  if (!president || president.location.type !== "player"
    || president.location.playerId !== outgoingPresidentId) {
    throw new Error("The seller does not hold the president certificate");
  }
  const projectedOutgoingPercent = ownershipPercent(state, corporationId, outgoingPresidentId) - 20;
  const holdings = state.playerOrder
    .filter((playerId) => playerId !== outgoingPresidentId)
    .map((playerId) => ({ playerId, percent: ownershipPercent(state, corporationId, playerId) }));
  const highest = Math.max(0, ...holdings.map(({ percent }) => percent));
  if (highest <= projectedOutgoingPercent || highest < 20) {
    throw new Error("No eligible successor can accept the presidency");
  }
  const tied = new Set(
    holdings.filter(({ percent }) => percent === highest).map(({ playerId }) => playerId),
  );
  const incomingPresidentId = nextPlayersLeftOf(state, outgoingPresidentId)
    .find((playerId) => tied.has(playerId));
  if (!incomingPresidentId) throw new Error("No eligible successor can accept the presidency");
  const exchangeCertificates = certificatesForPlayer(state, incomingPresidentId)
    .filter((certificate) => certificate.corporationId === corporationId
      && !certificate.isPresident && certificate.percent === 10)
    .sort((left, right) => left.id.localeCompare(right.id));
  if (exchangeCertificates.length < 2) {
    throw new Error("The successor lacks two 10% certificates for the exchange");
  }
  const [first, second] = exchangeCertificates;
  return {
    ...state,
    certificates: {
      ...state.certificates,
      [president.id]: {
        ...president,
        location: { type: "player", playerId: incomingPresidentId },
      },
      [first.id]: { ...first, location: { type: "bankPool" } },
      [second.id]: { ...second, location: { type: "bankPool" } },
    },
  };
}

function recomputeCorrection(state: GameState, playerId: PlayerId): GameState {
  const correction = state.stock!.certificateLimitCorrectionByPlayer[playerId];
  if (!correction) return state;
  const excessCount = Math.max(0, countedCertificateTotal(state, playerId) - certificateLimit(state));
  return {
    ...state,
    stock: {
      ...state.stock!,
      certificateLimitCorrectionByPlayer: {
        ...state.stock!.certificateLimitCorrectionByPlayer,
        [playerId]: excessCount === 0 ? null : { ...correction, excessCount },
      },
    },
  };
}

export function executeSellCertificates(
  state: GameState,
  command: SellCommand,
): CommandResult {
  if (state.round !== "stock" || !state.stock) {
    return reject("ACTION_NOT_ALLOWED_IN_ROUND", "A Stock Round is not active");
  }
  if (state.stock.currentActorId !== command.actorId || state.stock.turn.actorId !== command.actorId) {
    return reject("NOT_CURRENT_PLAYER", "Only the current Stock Round player may act");
  }
  if (state.stock.pendingPrivateTrade) {
    return reject("ACTION_NOT_ALLOWED_IN_ROUND", "The pending private trade must be resolved");
  }
  if (state.isFirstStockRound) {
    return reject("ACTION_NOT_ALLOWED_IN_ROUND", "Stock may not be sold in the first Stock Round");
  }
  const certificateIds = command.payload.certificateIds;
  if (certificateIds.length === 0 || new Set(certificateIds).size !== certificateIds.length) {
    return reject("ACTION_NOT_ALLOWED_IN_ROUND", "The sale must identify unique certificates");
  }

  const certificates: Certificate[] = [];
  for (const certificateId of certificateIds) {
    const certificate = state.certificates[certificateId];
    if (!certificate || certificate.location.type !== "player"
      || certificate.location.playerId !== command.actorId) {
      return reject("ACTION_NOT_ALLOWED_IN_ROUND", "The seller does not own every certificate");
    }
    const restriction = certificate.saleRestrictedUntilCorporationParred;
    if (restriction && state.corporations[restriction]?.lifecycle === "unstarted") {
      return reject("ACTION_NOT_ALLOWED_IN_ROUND", "This certificate cannot yet be sold");
    }
    certificates.push(certificate);
  }

  const grouped = new Map<CorporationId, Certificate[]>();
  for (const certificate of certificates) {
    grouped.set(certificate.corporationId, [
      ...(grouped.get(certificate.corporationId) ?? []),
      certificate,
    ]);
  }
  let proceeds = 0;
  for (const [corporationId, corporationCertificates] of grouped) {
    const price = getMarketPrice(state, corporationId);
    if (price === null) {
      return reject("ACTION_NOT_ALLOWED_IN_ROUND", "A sold corporation has no market price");
    }
    const salePercent = corporationCertificates.reduce(
      (total, certificate) => total + certificate.percent,
      0,
    );
    if (poolPercent(state, corporationId) + salePercent > 50) {
      return reject("POOL_LIMIT_EXCEEDED", "The Bank Pool may not exceed 50%");
    }
    proceeds += price * (salePercent / 10);
  }

  let nextState = state;
  try {
    for (const [corporationId, corporationCertificates] of grouped) {
      const presidentSale = corporationCertificates.find((certificate) => certificate.isPresident);
      const ordinarySales = corporationCertificates.filter((certificate) => !certificate.isPresident);
      nextState = {
        ...nextState,
        certificates: {
          ...nextState.certificates,
          ...Object.fromEntries(ordinarySales.map((certificate) => [
            certificate.id,
            { ...nextState.certificates[certificate.id], location: { type: "bankPool" as const } },
          ])),
        },
      };
      if (presidentSale) {
        nextState = applyPresidentCertificateSale(nextState, corporationId, command.actorId);
      } else {
        const successorId = calculatePresident(nextState, corporationId);
        nextState = applyPresidencyTransfer(nextState, corporationId, successorId);
      }
    }
  } catch (error) {
    return reject(
      "PRESIDENCY_CANNOT_TRANSFER",
      error instanceof Error ? error.message : "The presidency cannot transfer",
    );
  }

  nextState = payFromBank(
    nextState,
    { type: "player", playerId: command.actorId },
    proceeds,
    "stockSale",
  );
  for (const corporationId of state.corporationOrder.filter((id) => grouped.has(id))) {
    const movementCount = grouped.get(corporationId)!
      .reduce((total, certificate) => total + certificate.percent / 10, 0);
    for (let movement = 0; movement < movementCount; movement += 1) {
      nextState = moveMarketToken(nextState, corporationId, "down");
    }
  }
  nextState = recomputeCorrection(nextState, command.actorId);
  nextState = {
    ...nextState,
    lastTransactionPlayerId: command.actorId,
    stock: {
      ...nextState.stock!,
      consecutivePasses: 0,
      soldCorporationIdsByPlayer: {
        ...nextState.stock!.soldCorporationIdsByPlayer,
        [command.actorId]: Array.from(new Set([
          ...(nextState.stock!.soldCorporationIdsByPlayer[command.actorId] ?? []),
          ...grouped.keys(),
        ])),
      },
      turn: { ...nextState.stock!.turn, hasTransaction: true },
    },
  };
  return accept(nextState, [{
    type: "stock.certificatesSold",
    message: `${state.players[command.actorId].name} sold ${certificates.length} certificate(s)`,
    data: { playerId: command.actorId, certificateCount: certificates.length, proceeds },
  }]);
}
