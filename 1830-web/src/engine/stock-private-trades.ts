import type { StockCommand } from "./commands";
import { CERTIFICATE_LIMIT } from "./constants";
import type { GameState, PendingPrivateTrade, PlayerId } from "./model";
import { countedCertificateTotal } from "./ownership";
import type { CommandResult, DomainEvent, RuleErrorCode } from "./results";

type ProposePrivateTradeCommand = Extract<
  StockCommand,
  { type: "stock.proposePrivateTrade" }
>;
type RespondPrivateTradeCommand = Extract<
  StockCommand,
  { type: "stock.respondPrivateTrade" }
>;

function accepted(state: GameState, events: DomainEvent[]): CommandResult {
  return { ok: true, state, events };
}

function rejected(code: RuleErrorCode, message: string): CommandResult {
  return { ok: false, code, message };
}

function certificateLimit(state: GameState): number {
  const limit = CERTIFICATE_LIMIT[state.playerOrder.length as keyof typeof CERTIFICATE_LIMIT];
  if (!limit) throw new Error(`Unsupported player count ${state.playerOrder.length}`);
  return limit;
}

function validateTradeParties(
  state: GameState,
  actorId: PlayerId,
  trade: Pick<PendingPrivateTrade, "buyerId" | "sellerId" | "privateId" | "price">,
): CommandResult | null {
  const { buyerId, sellerId, privateId, price } = trade;
  if (!state.players[buyerId] || !state.players[sellerId] || buyerId === sellerId) {
    return rejected("PRIVATE_TRADE_NOT_PERMITTED", "A private trade requires two different players");
  }
  if (actorId !== buyerId && actorId !== sellerId) {
    return rejected(
      "PRIVATE_TRADE_NOT_PERMITTED",
      "The active player must be the buyer or seller",
    );
  }
  const privateCompany = state.privates[privateId];
  if (!privateCompany || privateCompany.location.type !== "player"
    || privateCompany.location.playerId !== sellerId) {
    return rejected("PRIVATE_TRADE_NOT_PERMITTED", "The seller does not own that private company");
  }
  if (!Number.isFinite(price) || !Number.isInteger(price) || price < 0) {
    return rejected("PRIVATE_TRADE_NOT_PERMITTED", "Private trade prices must be whole-dollar amounts");
  }
  if (state.players[buyerId].cash < price) {
    return rejected("INSUFFICIENT_AVAILABLE_CASH", "The buyer cannot afford this private trade");
  }
  if (countedCertificateTotal(state, buyerId) + 1 > certificateLimit(state)) {
    return rejected("CERTIFICATE_LIMIT_EXCEEDED", "The buyer would exceed the certificate limit");
  }
  return null;
}

function validateStockTradeState(state: GameState): CommandResult | null {
  if (state.round !== "stock" || !state.stock || state.isFirstStockRound) {
    return rejected(
      "PRIVATE_TRADE_NOT_PERMITTED",
      "Player-to-player private trades are allowed only in later Stock Rounds",
    );
  }
  return null;
}

export function executeProposePrivateTrade(
  state: GameState,
  command: ProposePrivateTradeCommand,
): CommandResult {
  const stateError = validateStockTradeState(state);
  if (stateError) return stateError;
  const stock = state.stock!;
  if (command.actorId !== stock.currentActorId) {
    return rejected("NOT_CURRENT_PLAYER", "Only the active player may propose a private trade");
  }
  if (stock.pendingPrivateTrade) {
    return rejected("PRIVATE_TRADE_NOT_PERMITTED", "A private trade response is already pending");
  }
  if (stock.certificateLimitCorrectionByPlayer[command.actorId]?.active) {
    return rejected(
      "CERTIFICATE_LIMIT_EXCEEDED",
      "The active player must correct their certificate limit first",
    );
  }

  const trade = command.payload;
  const tradeError = validateTradeParties(state, command.actorId, trade);
  if (tradeError) return tradeError;
  const responderId = command.actorId === trade.buyerId ? trade.sellerId : trade.buyerId;
  const pendingPrivateTrade: PendingPrivateTrade = {
    proposedByPlayerId: command.actorId,
    responderId,
    privateId: trade.privateId,
    buyerId: trade.buyerId,
    sellerId: trade.sellerId,
    price: trade.price,
  };

  return accepted({
    ...state,
    stock: { ...stock, pendingPrivateTrade },
  }, [{
    type: "stock.privateTradeProposed",
    message: `${state.players[command.actorId].name} proposed a private-company trade`,
    data: {
      proposedByPlayerId: command.actorId,
      responderId,
      privateId: trade.privateId,
      buyerId: trade.buyerId,
      sellerId: trade.sellerId,
      price: trade.price,
    },
  }]);
}

export function executeRespondPrivateTrade(
  state: GameState,
  command: RespondPrivateTradeCommand,
): CommandResult {
  const stateError = validateStockTradeState(state);
  if (stateError) return stateError;
  const stock = state.stock!;
  const pending = stock.pendingPrivateTrade;
  if (!pending) {
    return rejected("PRIVATE_TRADE_NOT_PERMITTED", "No private trade response is pending");
  }
  if (command.actorId !== pending.responderId) {
    return rejected("NOT_CURRENT_PLAYER", "Only the named counterparty may respond");
  }

  if (!command.payload.accepted) {
    return accepted({
      ...state,
      stock: { ...stock, pendingPrivateTrade: null },
    }, [{
      type: "stock.privateTradeRejected",
      message: `${state.players[command.actorId].name} rejected the private-company trade`,
      data: {
        responderId: command.actorId,
        privateId: pending.privateId,
      },
    }]);
  }

  const tradeError = validateTradeParties(
    state,
    stock.currentActorId,
    pending,
  );
  if (tradeError) return tradeError;
  const buyer = state.players[pending.buyerId];
  const seller = state.players[pending.sellerId];
  const privateCompany = state.privates[pending.privateId];

  return accepted({
    ...state,
    players: {
      ...state.players,
      [buyer.id]: { ...buyer, cash: buyer.cash - pending.price },
      [seller.id]: { ...seller, cash: seller.cash + pending.price },
    },
    privates: {
      ...state.privates,
      [privateCompany.id]: {
        ...privateCompany,
        purchasePrice: pending.price,
        location: { type: "player", playerId: buyer.id },
      },
    },
    lastTransactionPlayerId: stock.currentActorId,
    stock: {
      ...stock,
      consecutivePasses: 0,
      turn: { ...stock.turn, hasTransaction: true },
      pendingPrivateTrade: null,
    },
  }, [{
    type: "stock.privateTradeAccepted",
    message: `${buyer.name} bought ${privateCompany.name} from ${seller.name}`,
    data: {
      responderId: command.actorId,
      privateId: pending.privateId,
      buyerId: buyer.id,
      sellerId: seller.id,
      price: pending.price,
    },
  }]);
}
