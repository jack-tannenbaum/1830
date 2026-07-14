import type { GameCommand } from "./commands";
import type { GameState } from "./model";
import type { CommandResult, DomainEvent } from "./results";

/**
 * Minimal Storage port — the subset of the browser Storage interface that the
 * persistence layer requires. Every implementation (localStorage, an in-memory
 * stub for tests, or a future networked backend) must satisfy this shape.
 *
 * Persistence code must never reach for a browser global at module load; the
 * caller injects the port so tests can supply an in-memory stub.
 */
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Persistence surface implemented by `src/engine/storage.ts`. Implementations
 * must export the three named functions with these exact signatures around the
 * save codec from `src/engine/save.ts` and the injected storage port.
 *
 * `loadSavedGame` returns `null` when the storage has no valid v2 save; it must
 * never mutate storage or throw. Callers use `null` to trigger a fresh game.
 * `saveGame` encodes a validated state with a caller-supplied ISO timestamp.
 * `clearSavedGame` removes only the v2 save key.
 */
export interface PersistenceApi {
  loadSavedGame(storage: StoragePort): GameState | null;
  saveGame(storage: StoragePort, state: GameState, savedAt: string): void;
  clearSavedGame(storage: StoragePort): void;
}

/**
 * Severity for a UI notification. `error` is used for rejected commands;
 * `success`, `info`, and `warning` are used for accepted domain events.
 */
export type NotificationLevel = "info" | "success" | "warning" | "error";

/**
 * Serializable UI notification produced by the notification projection.
 * Every notification carries a stable, deterministic `id` so React lists can
 * key on it and callers can dismiss individual entries.
 */
export interface UiNotification {
  id: string;
  type: NotificationLevel;
  message: string;
}

/**
 * Notification projection surface implemented by `src/engine/notifications.ts`.
 *
 * `rejectionNotification` maps a rejected `CommandResult` to a single stable
 * `UiNotification` whose id encodes the command id and rule code.
 *
 * `eventNotifications` projects a sequence of accepted domain events to zero
 * or more `UiNotification`s whose ids encode the command id and each event's
 * position. Implementations must never mutate their inputs.
 */
export interface NotificationProjection {
  rejectionNotification(
    commandId: string,
    result: Extract<CommandResult, { ok: false }>,
  ): UiNotification;
  eventNotifications(commandId: string, events: DomainEvent[]): UiNotification[];
}

/**
 * Read half of the adapter store. Components must observe only these fields.
 *
 * `game` is `null` before setup or after `newGame`. `undoStack` holds the
 * pre-command snapshots of accepted commands in dispatch order; the last entry
 * is the state to restore on `undo`. `notifications` is the current list of
 * live UI notifications in the order they were emitted.
 */
export interface GameAdapterSnapshot {
  game: GameState | null;
  undoStack: GameState[];
  notifications: UiNotification[];
}

/**
 * Public adapter write surface exposed to React components. Components must
 * dispatch commands and mutate state through these actions rather than via a
 * hidden `.getState()` on the underlying Zustand store.
 *
 * `dispatch` runs `executeCommand`, appends the pre-command state to the undo
 * stack on acceptance, appends a notification on rejection, and persists the
 * new state through the injected storage port on acceptance.
 *
 * `undo` pops and restores the last snapshot, persists the restored state,
 * and returns `true` iff a snapshot was consumed.
 *
 * `load` reads the persisted save through the storage port, replaces `game`
 * only when the save decodes cleanly, clears the undo stack, and returns
 * `true` iff a save was loaded. It must not throw on invalid data.
 *
 * `newGame` clears `game`, `undoStack`, the current notifications, and the
 * persisted v2 save.
 *
 * `dismissNotification` removes the notification with the given id, if any.
 */
export interface GameAdapterActions {
  dispatch(command: GameCommand): CommandResult;
  undo(): boolean;
  load(): boolean;
  newGame(): void;
  dismissNotification(notificationId: string): void;
}

/**
 * Complete adapter state surfaced to React and to tests. `createGameAdapterStore`
 * in `src/store/gameStore.ts` returns a Zustand store whose state satisfies
 * this shape.
 */
export interface GameAdapterState extends GameAdapterSnapshot, GameAdapterActions {}
