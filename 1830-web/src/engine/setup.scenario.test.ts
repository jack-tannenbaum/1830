import { describe, expect, it } from "vitest";
import { createGame } from "./setup";

describe("financial engine scenarios", () => {
  it("1. distributes exactly $2,400 for every supported player count", () => {
    for (const count of [3, 4, 5, 6] as const) {
      const names = Array.from({ length: count }, (_, i) => `P${i + 1}`);
      const state = createGame({
        gameId: `g-${count}`,
        playerNames: names,
        placeOrder: names.map((_, i) => i),
      });
      expect(Object.values(state.players).map((player) => player.cash)).toEqual(
        Array(count).fill(2_400 / count),
      );
      expect(state.bankCash).toBe(9_600);
      expect(state.priorityDealPlayerId).toBe(state.playerOrder[0]);
      expect(Object.values(state.certificates)).toHaveLength(72);
      expect(Object.values(state.certificates).filter((certificate) => certificate.isPresident)).toHaveLength(8);
      expect(Object.values(state.privates).every((privateCompany) => privateCompany.location.type === "bank")).toBe(true);
      expect(JSON.parse(JSON.stringify(state))).toEqual(state);
    }
  });
});
