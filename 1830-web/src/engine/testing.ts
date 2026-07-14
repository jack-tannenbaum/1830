import type { GameCommand } from "./commands";
import type { GameState } from "./model";

type CommandOfType<T extends GameCommand["type"]> = Extract<GameCommand, { type: T }>;

export function commandFor<T extends GameCommand["type"]>(
  state: GameState,
  command: Omit<CommandOfType<T>, "gameId" | "expectedVersion">,
): CommandOfType<T> {
  return {
    ...command,
    gameId: state.id,
    expectedVersion: state.version,
  } as CommandOfType<T>;
}
