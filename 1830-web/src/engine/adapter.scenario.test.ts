import { describe, expect, it } from "vitest";
import type { StoreApi } from "zustand";
import type { GameAdapterState, StoragePort, UiNotification } from "./adapter-contracts";
import type { GameCommand } from "./commands";
import { ENGINE_VERSION, SAVE_KEY, SAVE_SCHEMA_VERSION } from "./constants";
import { createGameAdapterStore } from "../store/gameStore";

const GAME_ID = "adapter-game";
const PLAYER_NAMES = ["P1", "P2", "P3", "P4"] as const;
const PLACE_ORDER = [0, 1, 2, 3] as const;

type MemoryStorage = StoragePort & { snapshot(): Record<string, string> };

function createMemoryStorage(seed?: Record<string, string>): MemoryStorage {
  const map = new Map<string, string>(Object.entries(seed ?? {}));
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
    snapshot: () => Object.fromEntries(map),
  };
}

function createGameCommand(commandId: string): GameCommand {
  return {
    id: commandId,
    gameId: GAME_ID,
    actorId: "system",
    expectedVersion: 0,
    type: "game.create",
    payload: {
      playerNames: [...PLAYER_NAMES],
      placeOrder: [...PLACE_ORDER],
    },
  };
}

function dispatchCreate(
  store: StoreApi<GameAdapterState>,
  commandId = "cmd-1",
): void {
  const result = store.getState().dispatch(createGameCommand(commandId));
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.message);
}

function currentAuctionActor(store: StoreApi<GameAdapterState>): string {
  const { game } = store.getState();
  if (!game || !game.auction) throw new Error("Expected an active auction");
  return game.auction.currentActorId;
}

function passCommand(store: StoreApi<GameAdapterState>, commandId: string): GameCommand {
  const { game } = store.getState();
  if (!game) throw new Error("Expected a live game");
  return {
    id: commandId,
    gameId: game.id,
    actorId: currentAuctionActor(store),
    expectedVersion: game.version,
    type: "auction.pass",
    payload: {},
  };
}

describe("adapter scenario", () => {
  it("1. dispatches game.create, records no snapshot, and persists the initial state", () => {
    const storage = createMemoryStorage();
    const store = createGameAdapterStore(storage);

    const command = createGameCommand("cmd-create");
    const result = store.getState().dispatch(command);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);

    const state = store.getState();
    expect(state.game).not.toBeNull();
    expect(state.game?.id).toBe(GAME_ID);
    expect(state.game?.version).toBe(1);
    expect(state.undoStack).toEqual([]);
    expect(state.notifications.length).toBe(result.events.length);

    const savedRaw = storage.snapshot()[SAVE_KEY];
    expect(typeof savedRaw).toBe("string");
    const envelope = JSON.parse(savedRaw) as {
      schemaVersion: number;
      engineVersion: string;
    };
    expect(envelope.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(envelope.engineVersion).toBe(ENGINE_VERSION);
  });

  it("2. accepted command pushes exactly one undo snapshot; undo restores prior state", () => {
    const storage = createMemoryStorage();
    const store = createGameAdapterStore(storage);
    dispatchCreate(store, "cmd-create");

    const preCommandGame = store.getState().game;
    expect(preCommandGame).not.toBeNull();

    const follow = passCommand(store, "cmd-pass");
    const followResult = store.getState().dispatch(follow);
    expect(followResult.ok).toBe(true);
    if (!followResult.ok) throw new Error(followResult.message);

    const afterDispatch = store.getState();
    expect(afterDispatch.undoStack).toHaveLength(1);
    expect(afterDispatch.undoStack[0]).toEqual(preCommandGame);
    expect(afterDispatch.game?.version).toBe((preCommandGame?.version ?? 0) + 1);

    const undone = store.getState().undo();
    expect(undone).toBe(true);

    const afterUndo = store.getState();
    expect(afterUndo.game).toEqual(preCommandGame);
    expect(afterUndo.undoStack).toEqual([]);

    const persistedRaw = storage.snapshot()[SAVE_KEY];
    expect(typeof persistedRaw).toBe("string");
    const persisted = JSON.parse(persistedRaw) as { game: { version: number } };
    expect(persisted.game.version).toBe(preCommandGame?.version);
  });

  it("3. rejected command does not push a snapshot and appends one error notification", () => {
    const storage = createMemoryStorage();
    const store = createGameAdapterStore(storage);
    dispatchCreate(store, "cmd-create");

    const beforeReject = store.getState();
    const undoLengthBefore = beforeReject.undoStack.length;
    const notificationsBefore = beforeReject.notifications.length;
    const gameBefore = beforeReject.game;

    const staleCommand: GameCommand = {
      id: "cmd-stale",
      gameId: GAME_ID,
      actorId: currentAuctionActor(store),
      expectedVersion: 0,
      type: "auction.pass",
      payload: {},
    };

    const rejected = store.getState().dispatch(staleCommand);
    expect(rejected.ok).toBe(false);
    if (rejected.ok) throw new Error("expected rejection");
    expect(rejected.code).toBe("VERSION_CONFLICT");

    const afterReject = store.getState();
    expect(afterReject.undoStack).toHaveLength(undoLengthBefore);
    expect(afterReject.game).toEqual(gameBefore);
    expect(afterReject.notifications).toHaveLength(notificationsBefore + 1);

    const appended = afterReject.notifications[afterReject.notifications.length - 1];
    expect(appended.type).toBe("error");
    expect(appended.id).toContain("cmd-stale");
    expect(appended.id).toContain("VERSION_CONFLICT");
  });

  it("4. load rehydrates from storage without touching notifications", () => {
    const storage = createMemoryStorage();
    const primary = createGameAdapterStore(storage);
    dispatchCreate(primary, "cmd-create");
    const persistedGame = primary.getState().game;
    expect(persistedGame).not.toBeNull();

    const rehydrated = createGameAdapterStore(storage);
    const loaded = rehydrated.getState().load();
    expect(loaded).toBe(true);

    const state = rehydrated.getState();
    expect(state.game).toEqual(persistedGame);
    expect(state.undoStack).toEqual([]);
  });

  it("5. load rejects an invalid or legacy save without replacing live state", () => {
    const legacyPayload = JSON.stringify({
      schemaVersion: 1,
      engineVersion: "legacy",
      savedAt: "x",
      game: {},
    });
    const storage = createMemoryStorage({ [SAVE_KEY]: legacyPayload });
    const store = createGameAdapterStore(storage);

    dispatchCreate(store, "cmd-create");
    const liveGameAfterCreate = store.getState().game;
    expect(liveGameAfterCreate).not.toBeNull();

    // Overwrite the freshly-persisted valid v2 payload back to the legacy shape
    // so that load() must decide whether to replace live state with garbage.
    storage.setItem(SAVE_KEY, legacyPayload);

    const loaded = store.getState().load();
    expect(loaded).toBe(false);
    expect(store.getState().game).toEqual(liveGameAfterCreate);
  });

  it("6. newGame clears live state, undo history, notifications, and the v2 save", () => {
    const storage = createMemoryStorage();
    const store = createGameAdapterStore(storage);
    dispatchCreate(store, "cmd-create");

    const follow = passCommand(store, "cmd-pass");
    const followResult = store.getState().dispatch(follow);
    expect(followResult.ok).toBe(true);
    if (!followResult.ok) throw new Error(followResult.message);

    // Force a notification via a rejected command so newGame has something to clear.
    const staleCommand: GameCommand = {
      id: "cmd-stale",
      gameId: GAME_ID,
      actorId: currentAuctionActor(store),
      expectedVersion: 0,
      type: "auction.pass",
      payload: {},
    };
    const rejected = store.getState().dispatch(staleCommand);
    expect(rejected.ok).toBe(false);

    const beforeNewGame = store.getState();
    expect(beforeNewGame.undoStack.length).toBeGreaterThan(0);
    expect(beforeNewGame.notifications.length).toBeGreaterThan(0);
    expect(storage.snapshot()[SAVE_KEY]).toBeDefined();

    store.getState().newGame();

    const after = store.getState();
    expect(after.game).toBeNull();
    expect(after.undoStack).toEqual([]);
    expect(after.notifications).toEqual([]);
    expect(SAVE_KEY in storage.snapshot()).toBe(false);
  });

  it("7. dismissNotification removes the given id and no other", () => {
    const storage = createMemoryStorage();
    const store = createGameAdapterStore(storage);
    dispatchCreate(store, "cmd-create");

    const staleActor = currentAuctionActor(store);
    const firstStale: GameCommand = {
      id: "cmd-stale-1",
      gameId: GAME_ID,
      actorId: staleActor,
      expectedVersion: 0,
      type: "auction.pass",
      payload: {},
    };
    const secondStale: GameCommand = {
      id: "cmd-stale-2",
      gameId: GAME_ID,
      actorId: staleActor,
      expectedVersion: 0,
      type: "auction.pass",
      payload: {},
    };

    const firstResult = store.getState().dispatch(firstStale);
    expect(firstResult.ok).toBe(false);
    const secondResult = store.getState().dispatch(secondStale);
    expect(secondResult.ok).toBe(false);

    const notifications = store.getState().notifications;
    expect(notifications.length).toBeGreaterThanOrEqual(2);

    const staleOne = notifications.find((n) => n.id.includes("cmd-stale-1")) as UiNotification;
    const staleTwo = notifications.find((n) => n.id.includes("cmd-stale-2")) as UiNotification;
    expect(staleOne).toBeDefined();
    expect(staleTwo).toBeDefined();

    store.getState().dismissNotification(staleOne.id);

    const remaining = store.getState().notifications;
    expect(remaining.some((n) => n.id === staleOne.id)).toBe(false);
    expect(remaining.some((n) => n.id === staleTwo.id)).toBe(true);
  });
});
