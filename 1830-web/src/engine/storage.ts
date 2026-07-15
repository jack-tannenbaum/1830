import type { StoragePort } from "./adapter-contracts";
import { SAVE_KEY } from "./constants";
import type { GameState } from "./model";
import { decodeSave, encodeSave } from "./save";

/** Read the persisted save through the port; return `null` for missing or invalid data. */
export function loadSavedGame(storage: StoragePort): GameState | null {
  const raw = storage.getItem(SAVE_KEY);
  if (raw === null) return null;
  try {
    return decodeSave(raw);
  } catch {
    return null;
  }
}

/** Encode `state` with `savedAt` and write it through the port under the v2 save key. */
export function saveGame(storage: StoragePort, state: GameState, savedAt: string): void {
  storage.setItem(SAVE_KEY, encodeSave(state, savedAt));
}

/** Remove the v2 save from the injected port. */
export function clearSavedGame(storage: StoragePort): void {
  storage.removeItem(SAVE_KEY);
}
