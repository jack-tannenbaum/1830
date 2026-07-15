import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";

import type {
  GameAdapterState,
  StoragePort,
  UiNotification,
} from "../engine/adapter-contracts";
import type { GameCommand } from "../engine/commands";
import { executeCommand } from "../engine/executeCommand";
import type { GameState } from "../engine/model";
import { eventNotifications, rejectionNotification } from "../engine/notifications";
import type { CommandResult } from "../engine/results";
import { clearSavedGame, loadSavedGame, saveGame } from "../engine/storage";

export type { GameAdapterState } from "../engine/adapter-contracts";

/**
 * Build a Zustand vanilla store implementing `GameAdapterState`.
 *
 * The store is a thin adapter over `executeCommand`: it never inspects command
 * payloads or game rules, and every rule decision is delegated to the engine.
 * The injected `storage` port keeps the persistence layer testable and lets
 * server-side callers (Node, vitest scenarios) supply an in-memory stub.
 */
export function createGameAdapterStore(storage: StoragePort): StoreApi<GameAdapterState> {
  return createStore<GameAdapterState>((set, get) => ({
    game: null,
    undoStack: [],
    notifications: [],

    dispatch(command: GameCommand): CommandResult {
      const previous = get().game;
      const result = executeCommand(previous, command);

      if (!result.ok) {
        const rejection = rejectionNotification(command.id, result);
        set((current) => ({
          notifications: [...current.notifications, rejection],
        }));
        return result;
      }

      const emitted = eventNotifications(command.id, result.events);
      set((current) => {
        const nextUndoStack: GameState[] = previous
          ? [...current.undoStack, previous]
          : current.undoStack;
        return {
          game: result.state,
          undoStack: nextUndoStack,
          notifications: [...current.notifications, ...emitted],
        };
      });
      saveGame(storage, result.state, new Date().toISOString());
      return result;
    },

    undo(): boolean {
      const { undoStack } = get();
      if (undoStack.length === 0) return false;
      const restored = undoStack[undoStack.length - 1];
      const nextUndoStack = undoStack.slice(0, -1);
      set({ game: restored, undoStack: nextUndoStack });
      saveGame(storage, restored, new Date().toISOString());
      return true;
    },

    load(): boolean {
      const loaded = loadSavedGame(storage);
      if (loaded === null) return false;
      set({ game: loaded, undoStack: [] });
      return true;
    },

    newGame(): void {
      clearSavedGame(storage);
      set({ game: null, undoStack: [], notifications: [] });
    },

    dismissNotification(notificationId: string): void {
      set((current) => ({
        notifications: current.notifications.filter(
          (n: UiNotification) => n.id !== notificationId,
        ),
      }));
    },
  }));
}

const browserStorage: StoragePort =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined"
    ? window.localStorage
    : {
        getItem: () => null,
        setItem: () => undefined,
        removeItem: () => undefined,
      };

export const gameAdapterStore: StoreApi<GameAdapterState> =
  createGameAdapterStore(browserStorage);

export function useGameStore<T>(selector: (state: GameAdapterState) => T): T {
  return useStore(gameAdapterStore, selector);
}
