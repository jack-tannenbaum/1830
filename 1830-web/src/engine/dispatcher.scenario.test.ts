import { describe, expect, it } from "vitest";
import type { GameCommand } from "./commands";
import { executeCommand } from "./executeCommand";
import { createGame } from "./setup";

describe("command dispatcher scenario", () => {
  it("dispatches accepted commands and rejects invalid envelopes without changing state", () => {
    const initialState = createGame({
      gameId: "dispatcher-game",
      playerNames: ["P1", "P2", "P3"],
      placeOrder: [0, 1, 2],
    });
    const initialSnapshot = structuredClone(initialState);
    const acceptedCommand: GameCommand = {
      id: "dispatcher-accepted",
      gameId: initialState.id,
      actorId: initialState.auction!.currentActorId,
      expectedVersion: initialState.version,
      type: "auction.buyOfferedPrivate",
      payload: {},
    };

    const accepted = executeCommand(initialState, acceptedCommand);

    expect(accepted.ok).toBe(true);
    if (!accepted.ok) throw new Error(accepted.message);
    expect(accepted.state.version).toBe(initialState.version + 1);
    expect(accepted.state.appliedCommandIds).toEqual([acceptedCommand.id]);
    expect(accepted.state.privates.SVN.location).toEqual({
      type: "player",
      playerId: acceptedCommand.actorId,
    });
    expect(initialState).toEqual(initialSnapshot);

    const acceptedSnapshot = structuredClone(accepted.state);
    const staleVersion = executeCommand(accepted.state, {
      ...acceptedCommand,
      id: "dispatcher-stale",
    });
    expect(staleVersion).toMatchObject({ ok: false, code: "VERSION_CONFLICT" });
    expect(accepted.state).toEqual(acceptedSnapshot);

    const duplicate = executeCommand(accepted.state, acceptedCommand);
    expect(duplicate).toMatchObject({ ok: false, code: "DUPLICATE_COMMAND" });
    expect(accepted.state).toEqual(acceptedSnapshot);

    const wrongGame = executeCommand(accepted.state, {
      ...acceptedCommand,
      id: "dispatcher-wrong-game",
      gameId: "another-game",
      expectedVersion: accepted.state.version,
    });
    expect(wrongGame).toMatchObject({
      ok: false,
      code: "ACTION_NOT_ALLOWED_IN_ROUND",
    });
    expect(accepted.state).toEqual(acceptedSnapshot);
  });
});
