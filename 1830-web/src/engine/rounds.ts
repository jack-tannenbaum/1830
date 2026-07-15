import { capitalizeCorporation, updateFloatEligibility } from "./corporations";
import { payFromBank } from "./ledger";
import { getMarketPrice, moveMarketToken } from "./market";
import type {
  CorporationId,
  GameState,
  PlayerId,
  StockRoundState,
} from "./model";
import type { CommandResult, DomainEvent, RuleErrorCode } from "./results";

function accepted(state: GameState, events: DomainEvent[] = []): CommandResult {
  return { ok: true, state, events };
}

function rejected(code: RuleErrorCode, message: string): CommandResult {
  return { ok: false, code, message };
}

function nextPlayer(state: GameState, playerId: PlayerId): PlayerId {
  const index = state.playerOrder.indexOf(playerId);
  if (index < 0) throw new Error(`Unknown player ${playerId}`);
  return state.playerOrder[(index + 1) % state.playerOrder.length];
}

function newStockRound(state: GameState): StockRoundState {
  const actorId = state.priorityDealPlayerId;
  const previousCorrections = state.stock?.certificateLimitCorrectionByPlayer ?? {};
  const certificateLimitCorrectionByPlayer = Object.fromEntries(
    state.playerOrder.map((playerId) => {
      const correction = previousCorrections[playerId] ?? null;
      return [
        playerId,
        playerId === actorId && correction
          ? { ...correction, active: true }
          : correction,
      ];
    }),
  );
  return {
    currentActorId: actorId,
    consecutivePasses: 0,
    turn: { actorId, hasTransaction: false, purchaseCount: 0 },
    soldCorporationIdsByPlayer: Object.fromEntries(
      state.playerOrder.map((playerId) => [playerId, []]),
    ),
    certificateLimitCorrectionByPlayer,
    pendingPrivateTrade: null,
  };
}

function beginNextStockRound(state: GameState): GameState {
  return {
    ...state,
    round: "stock",
    roundNumber: state.roundNumber + 1,
    isFirstStockRound: false,
    lastTransactionPlayerId: null,
    stock: newStockRound(state),
    operatingShell: null,
  };
}

function operatingOrder(state: GameState): CorporationId[] {
  const definitionIndex = new Map(
    state.corporationOrder.map((corporationId, index) => [corporationId, index]),
  );
  return Object.values(state.corporations)
    .filter((corporation) => corporation.lifecycle === "floatEligible"
      || corporation.lifecycle === "operating")
    .sort((left, right) => {
      const priceDifference = (getMarketPrice(state, right.id) ?? -1)
        - (getMarketPrice(state, left.id) ?? -1);
      if (priceDifference !== 0) return priceDifference;
      const columnDifference = (right.market?.column ?? -1) - (left.market?.column ?? -1);
      if (columnDifference !== 0) return columnDifference;
      const stackDifference = (left.market?.stackIndex ?? Number.MAX_SAFE_INTEGER)
        - (right.market?.stackIndex ?? Number.MAX_SAFE_INTEGER);
      if (stackDifference !== 0) return stackDifference;
      return (definitionIndex.get(left.id) ?? Number.MAX_SAFE_INTEGER)
        - (definitionIndex.get(right.id) ?? Number.MAX_SAFE_INTEGER);
    })
    .map(({ id }) => id);
}

function isFullySubscribed(state: GameState, corporationId: CorporationId): boolean {
  const certificates = Object.values(state.certificates)
    .filter((certificate) => certificate.corporationId === corporationId);
  return certificates.length > 0 && certificates.every(
    (certificate) => certificate.location.type === "player",
  );
}

function payPrivateIncome(state: GameState): GameState {
  const openPrivates = Object.values(state.privates)
    .filter((privateCompany) => privateCompany.location.type === "player"
      || privateCompany.location.type === "corporation")
    .sort((left, right) => left.faceValue - right.faceValue || left.id.localeCompare(right.id));
  return openPrivates.reduce((current, privateCompany) => {
    const location = privateCompany.location;
    if (location.type !== "player" && location.type !== "corporation") return current;
    const recipient = location.type === "player"
      ? { type: "player" as const, playerId: location.playerId }
      : { type: "corporation" as const, corporationId: location.corporationId };
    return payFromBank(current, recipient, privateCompany.revenue, "privateIncome");
  }, state);
}

function presidentId(state: GameState, corporationId: CorporationId): PlayerId | null {
  const president = Object.values(state.certificates).find(
    (certificate) => certificate.corporationId === corporationId && certificate.isPresident,
  );
  return president?.location.type === "player" ? president.location.playerId : null;
}

export function completeStockRound(state: GameState): GameState {
  if (state.round !== "stock" || !state.stock) {
    throw new Error("Cannot complete a Stock Round outside a Stock Round");
  }

  const priorityDealPlayerId = state.lastTransactionPlayerId
    ? nextPlayer(state, state.lastTransactionPlayerId)
    : state.priorityDealPlayerId;
  let nextState: GameState = {
    ...state,
    priorityDealPlayerId,
    isFirstStockRound: false,
    lastTransactionPlayerId: null,
  };

  for (const corporationId of nextState.corporationOrder) {
    nextState = updateFloatEligibility(nextState, corporationId);
    if (isFullySubscribed(nextState, corporationId)) {
      nextState = moveMarketToken(nextState, corporationId, "up");
    }
  }

  const order = operatingOrder(nextState);
  for (const corporationId of order) {
    nextState = capitalizeCorporation(nextState, corporationId);
  }
  nextState = payPrivateIncome(nextState);

  const stopAfterShell = nextState.bankBroken;
  if (order.length === 0) {
    if (stopAfterShell) {
      return {
        ...nextState,
        round: "milestoneStopped",
        stock: null,
        operatingShell: null,
      };
    }
    return beginNextStockRound(nextState);
  }

  return {
    ...nextState,
    round: "operatingShell",
    stock: null,
    operatingShell: {
      operatingOrder: order,
      currentIndex: 0,
      currentCorporationId: order[0],
      stopAfterShell,
    },
  };
}

export function endOperatingShellTurn(state: GameState, actorId: string): CommandResult {
  if (state.round !== "operatingShell" || !state.operatingShell) {
    return rejected("ACTION_NOT_ALLOWED_IN_ROUND", "No Operating Round shell is active");
  }
  const shell = state.operatingShell;
  const corporationId = shell.currentCorporationId;
  if (!corporationId) {
    return rejected("ACTION_NOT_ALLOWED_IN_ROUND", "No corporation is active");
  }
  if (presidentId(state, corporationId) !== actorId) {
    return rejected("NOT_CURRENT_PLAYER", "Only the active corporation's president may end its turn");
  }

  const nextIndex = shell.currentIndex + 1;
  if (nextIndex < shell.operatingOrder.length) {
    const nextCorporationId = shell.operatingOrder[nextIndex];
    return accepted({
      ...state,
      operatingShell: {
        ...shell,
        currentIndex: nextIndex,
        currentCorporationId: nextCorporationId,
      },
    }, [{
      type: "operatingShell.turnEnded",
      message: `${state.corporations[corporationId].name} ended its shell turn`,
      data: { corporationId },
    }]);
  }

  const nextState = shell.stopAfterShell || state.bankBroken
    ? {
      ...state,
      round: "milestoneStopped" as const,
      operatingShell: null,
    }
    : beginNextStockRound(state);
  return accepted(nextState, [{
    type: "operatingShell.completed",
    message: "Operating Round shell completed",
    data: { bankBroken: nextState.bankBroken },
  }]);
}
