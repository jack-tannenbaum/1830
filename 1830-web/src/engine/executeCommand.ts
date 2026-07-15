import type { AuctionCommand, GameCommand, StockCommand } from "./commands";
import { executeAuction } from "./auction";
import { assertGameInvariants } from "./invariants";
import type { GameState } from "./model";
import type { CommandResult, RuleErrorCode } from "./results";
import { endOperatingShellTurn } from "./rounds";
import { createGame } from "./setup";
import { executeStock } from "./stock";

function reject(code: RuleErrorCode, message: string): CommandResult {
  return { ok: false, code, message };
}

function finalizeAcceptedCommand(
  result: Extract<CommandResult, { ok: true }>,
  commandId: string,
): CommandResult {
  const state: GameState = {
    ...result.state,
    version: result.state.version + 1,
    appliedCommandIds: [...result.state.appliedCommandIds, commandId],
  };
  assertGameInvariants(state);
  return { ...result, state };
}

function executeCreate(command: GameCommand): CommandResult {
  if (command.type !== "game.create") {
    return reject("ACTION_NOT_ALLOWED_IN_ROUND", "Create a game before issuing game commands");
  }
  if (command.expectedVersion !== 0) {
    return reject("VERSION_CONFLICT", "A new game must start at version 0");
  }

  let state: GameState;
  try {
    state = createGame({
      gameId: command.gameId,
      playerNames: command.payload.playerNames,
      placeOrder: command.payload.placeOrder,
    });
  } catch (error) {
    return reject(
      "ACTION_NOT_ALLOWED_IN_ROUND",
      error instanceof Error ? error.message : "Invalid game setup",
    );
  }
  return finalizeAcceptedCommand({ ok: true, state, events: [] }, command.id);
}

function routeCommand(state: GameState, command: GameCommand): CommandResult {
  switch (command.type) {
    case "auction.buyOfferedPrivate":
    case "auction.placeAdvanceBid":
    case "auction.raiseBid":
    case "auction.pass":
    case "auction.setBOPar":
      return executeAuction(state, command as AuctionCommand);

    case "stock.startCorporation":
    case "stock.buyCertificate":
    case "stock.sellCertificates":
    case "stock.proposePrivateTrade":
    case "stock.respondPrivateTrade":
    case "stock.finishTurn":
    case "stock.pass":
      return executeStock(state, command as StockCommand);

    case "operatingShell.endCorporationTurn":
      if (command.payload.corporationId !== state.operatingShell?.currentCorporationId) {
        return reject("ACTION_NOT_ALLOWED_IN_ROUND", "The corporation is not currently operating");
      }
      return endOperatingShellTurn(state, command.actorId);

    case "game.create":
      return reject("ACTION_NOT_ALLOWED_IN_ROUND", "A game is already active");
  }
}

export function executeCommand(
  state: GameState | null,
  command: GameCommand,
): CommandResult {
  if (state === null) return executeCreate(command);
  if (command.gameId !== state.id) {
    return reject("ACTION_NOT_ALLOWED_IN_ROUND", "Wrong game");
  }
  if (state.appliedCommandIds.includes(command.id)) {
    return reject("DUPLICATE_COMMAND", "Command already applied");
  }
  if (command.expectedVersion !== state.version) {
    return reject("VERSION_CONFLICT", "State version changed");
  }

  const result = routeCommand(state, command);
  return result.ok ? finalizeAcceptedCommand(result, command.id) : result;
}
