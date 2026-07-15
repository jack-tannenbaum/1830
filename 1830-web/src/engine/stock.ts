import type { StockCommand } from "./commands";
import { assertGameInvariants } from "./invariants";
import type { GameState, PlayerId, StockRoundState } from "./model";
import type { CommandResult, DomainEvent, RuleErrorCode } from "./results";
import { completeStockRound } from "./rounds";
import {
  executeProposePrivateTrade,
  executeRespondPrivateTrade,
} from "./stock-private-trades";
import {
  executeBuyCertificate,
  executeSellCertificates,
  executeStartCorporation,
} from "./stock-shares";

function reject(code: RuleErrorCode, message: string): CommandResult {
  return { ok: false, code, message };
}

function accepted(state: GameState, events: DomainEvent[] = []): CommandResult {
  assertGameInvariants(state);
  return { ok: true, state, events };
}

function checked(result: CommandResult): CommandResult {
  if (result.ok) assertGameInvariants(result.state);
  return result;
}

function nextPlayer(state: GameState, playerId: PlayerId): PlayerId {
  const index = state.playerOrder.indexOf(playerId);
  if (index < 0) throw new Error(`Unknown player ${playerId}`);
  return state.playerOrder[(index + 1) % state.playerOrder.length];
}

function correctionBlocksActions(stock: StockRoundState, playerId: PlayerId): boolean {
  const correction = stock.certificateLimitCorrectionByPlayer[playerId];
  return Boolean(correction?.active && correction.excessCount > 0);
}

/**
 * Starts a fresh turn and activates a presidency-loss correction only as its
 * affected player becomes the actor. An inactive correction is deliberately
 * left alone for the remainder of the turn in which it was created.
 */
function beginTurn(state: GameState, actorId: PlayerId, consecutivePasses: number): GameState {
  const stock = state.stock;
  if (!stock) throw new Error("Cannot begin a Stock Round turn without Stock Round state");
  const correction = stock.certificateLimitCorrectionByPlayer[actorId];
  const activatedCorrection = correction && correction.excessCount > 0
    ? { ...correction, active: true }
    : null;
  return {
    ...state,
    stock: {
      ...stock,
      currentActorId: actorId,
      consecutivePasses,
      turn: { actorId, hasTransaction: false, purchaseCount: 0 },
      certificateLimitCorrectionByPlayer: {
        ...stock.certificateLimitCorrectionByPlayer,
        [actorId]: activatedCorrection,
      },
    },
  };
}

function finishTurn(state: GameState): CommandResult {
  const stock = state.stock!;
  if (correctionBlocksActions(stock, stock.currentActorId)) {
    return reject(
      "CERTIFICATE_LIMIT_EXCEEDED",
      "The active certificate-limit correction must be completed before ending the turn",
    );
  }
  if (!stock.turn.hasTransaction) {
    return reject("STOCK_TURN_ALREADY_COMPLETE", "Use pass when no transaction was made");
  }
  const actorId = stock.currentActorId;
  const nextActorId = nextPlayer(state, actorId);
  return accepted(beginTurn(state, nextActorId, 0), [{
    type: "stock.turnFinished",
    message: `${state.players[actorId].name} finished their Stock Round turn`,
    data: { playerId: actorId, nextPlayerId: nextActorId },
  }]);
}

function pass(state: GameState): CommandResult {
  const stock = state.stock!;
  const actorId = stock.currentActorId;
  if (correctionBlocksActions(stock, actorId)) {
    return reject(
      "CERTIFICATE_LIMIT_EXCEEDED",
      "The active certificate-limit correction must be completed before passing",
    );
  }
  if (stock.turn.hasTransaction) {
    return reject("STOCK_TURN_ALREADY_COMPLETE", "Finish the transaction turn instead of passing");
  }

  const consecutivePasses = stock.consecutivePasses + 1;
  if (consecutivePasses >= state.playerOrder.length) {
    const completed = completeStockRound({
      ...state,
      stock: { ...stock, consecutivePasses },
    });
    return accepted(completed, [{
      type: "stock.roundCompleted",
      message: "The Stock Round ended after every player passed consecutively",
      data: { roundNumber: state.roundNumber },
    }]);
  }

  const nextActorId = nextPlayer(state, actorId);
  return accepted(beginTurn(state, nextActorId, consecutivePasses), [{
    type: "stock.playerPassed",
    message: `${state.players[actorId].name} passed`,
    data: { playerId: actorId, consecutivePasses },
  }]);
}

export function executeStock(state: GameState, command: StockCommand): CommandResult {
  if (state.round !== "stock" || !state.stock) {
    return reject("ACTION_NOT_ALLOWED_IN_ROUND", "No Stock Round is active");
  }
  if (command.gameId !== state.id) {
    return reject("ACTION_NOT_ALLOWED_IN_ROUND", "Command belongs to a different game");
  }

  const stock = state.stock;
  const pendingTrade = stock.pendingPrivateTrade;
  if (pendingTrade) {
    if (command.type !== "stock.respondPrivateTrade") {
      return reject(
        "PRIVATE_TRADE_NOT_PERMITTED",
        "The pending private-company trade must be answered first",
      );
    }
    if (command.actorId !== pendingTrade.responderId) {
      return reject("NOT_CURRENT_PLAYER", "Only the named trade responder may answer");
    }
    return checked(executeRespondPrivateTrade(state, command));
  }

  if (command.type === "stock.respondPrivateTrade") {
    return reject("PRIVATE_TRADE_NOT_PERMITTED", "No private-company trade is pending");
  }
  if (command.actorId !== stock.currentActorId) {
    return reject("NOT_CURRENT_PLAYER", "Only the current Stock Round player may act");
  }

  if (state.isFirstStockRound && (
    command.type === "stock.sellCertificates"
    || command.type === "stock.proposePrivateTrade"
  )) {
    return reject(
      "ACTION_NOT_ALLOWED_IN_ROUND",
      "Sales and private-company trades are not allowed in the first Stock Round",
    );
  }

  if (correctionBlocksActions(stock, command.actorId)
    && command.type !== "stock.sellCertificates") {
    return reject(
      "CERTIFICATE_LIMIT_EXCEEDED",
      "Only certificate sales are allowed until the certificate limit is restored",
    );
  }

  switch (command.type) {
    case "stock.startCorporation":
      return checked(executeStartCorporation(state, command));
    case "stock.buyCertificate":
      return checked(executeBuyCertificate(state, command));
    case "stock.sellCertificates":
      return checked(executeSellCertificates(state, command));
    case "stock.proposePrivateTrade":
      return checked(executeProposePrivateTrade(state, command));
    case "stock.finishTurn":
      return finishTurn(state);
    case "stock.pass":
      return pass(state);
  }
}
