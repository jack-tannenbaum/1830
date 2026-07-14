import { describe, expect, it } from "vitest";
import {
  applyPresidencyTransfer,
  calculatePresident,
  capitalizeCorporation,
  updateFloatEligibility,
} from "./corporations";
import type { GameState, PlayerId, StockRoundState } from "./model";
import { ownershipPercent } from "./ownership";
import { completeStockRound, endOperatingShellTurn } from "./rounds";
import { createGame } from "./setup";

function game(id: string): GameState {
  return createGame({ gameId: id, playerNames: ["P1", "P2", "P3"], placeOrder: [0, 1, 2] });
}

function stockState(state: GameState, actorId: PlayerId = "player-1"): GameState {
  const stock: StockRoundState = {
    currentActorId: actorId,
    consecutivePasses: 0,
    turn: { actorId, hasTransaction: false, purchaseCount: 0 },
    soldCorporationIdsByPlayer: Object.fromEntries(
      state.playerOrder.map((playerId) => [playerId, []]),
    ),
    certificateLimitCorrectionByPlayer: Object.fromEntries(
      state.playerOrder.map((playerId) => [playerId, null]),
    ),
    pendingPrivateTrade: null,
  };
  return { ...state, round: "stock", auction: null, stock };
}

function giveCertificate(
  state: GameState,
  certificateId: string,
  playerId: PlayerId,
): GameState {
  const certificate = state.certificates[certificateId];
  return {
    ...state,
    certificates: {
      ...state.certificates,
      [certificateId]: { ...certificate, location: { type: "player", playerId } },
    },
  };
}

function setOperating(
  state: GameState,
  corporationId: string,
  playerId: PlayerId,
  market: { row: number; column: number; stackIndex: number },
): GameState {
  state = giveCertificate(state, `${corporationId}-president`, playerId);
  return {
    ...state,
    corporations: {
      ...state.corporations,
      [corporationId]: {
        ...state.corporations[corporationId],
        lifecycle: "operating",
        parPrice: 100,
        market,
      },
    },
  };
}

function endCurrentShellTurn(state: GameState): GameState {
  const corporationId = state.operatingShell!.currentCorporationId!;
  const president = Object.values(state.certificates).find(
    (certificate) => certificate.corporationId === corporationId && certificate.isPresident,
  )!;
  if (president.location.type !== "player") throw new Error("Missing shell president");
  const result = endOperatingShellTurn(state, president.location.playerId);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("message" in result ? result.message : "Shell turn failed");
  return result.state;
}

describe("corporation and round scenarios", () => {
  it("5. transfers presidency, floats at five sold certificates, and capitalizes once", () => {
    let state = stockState(game("corporation-lifecycle"));
    state = giveCertificate(state, "PRR-president", "player-1");
    for (const id of ["PRR-10-1", "PRR-10-2", "PRR-10-3"]) {
      state = giveCertificate(state, id, "player-2");
    }
    state = giveCertificate(state, "PRR-10-4", "player-3");

    const unrelated = Object.values(state.certificates)
      .filter((certificate) => certificate.corporationId !== "PRR" && !certificate.isPresident)
      .slice(0, 19);
    for (const certificate of unrelated) {
      state = giveCertificate(state, certificate.id, "player-1");
    }
    state = {
      ...state,
      corporations: {
        ...state.corporations,
        PRR: {
          ...state.corporations.PRR,
          lifecycle: "parred",
          parPrice: 100,
          market: { row: 0, column: 6, stackIndex: 0 },
        },
      },
    };

    expect(calculatePresident(state, "PRR")).toBe("player-2");
    const beforePercentages = [
      ownershipPercent(state, "PRR", "player-1"),
      ownershipPercent(state, "PRR", "player-2"),
    ];
    state = applyPresidencyTransfer(state, "PRR");
    expect([
      ownershipPercent(state, "PRR", "player-1"),
      ownershipPercent(state, "PRR", "player-2"),
    ]).toEqual(beforePercentages);
    expect(state.certificates["PRR-president"].location).toEqual({
      type: "player",
      playerId: "player-2",
    });
    expect(state.stock?.certificateLimitCorrectionByPlayer["player-1"]).toEqual({
      excessCount: 1,
      active: false,
    });

    state = updateFloatEligibility(state, "PRR");
    expect(state.corporations.PRR.lifecycle).toBe("floatEligible");
    expect(state.bankCash).toBe(9_600);
    state = completeStockRound(state);
    expect(state.round).toBe("operatingShell");
    expect(state.corporations.PRR).toMatchObject({ lifecycle: "operating", treasury: 1_000 });
    expect(state.bankCash).toBe(8_600);

    state = capitalizeCorporation(state, "PRR");
    expect(state.corporations.PRR.treasury).toBe(1_000);
    state = endCurrentShellTurn(state);
    expect(state.round).toBe("stock");
    state = completeStockRound(state);
    expect(state.corporations.PRR.treasury).toBe(1_000);
  });

  it("6. cycles empty and ordered shells, then finishes a Bank-breaking shell before stopping", () => {
    let state = stockState(game("shell-cycles"));
    state = completeStockRound(state);
    expect(state.round).toBe("stock");
    expect(state.roundNumber).toBe(2);

    state = setOperating(state, "PRR", "player-1", { row: 0, column: 6, stackIndex: 0 });
    state = setOperating(state, "B&O", "player-2", { row: 0, column: 6, stackIndex: 1 });
    state = setOperating(state, "NYC", "player-3", { row: 3, column: 9, stackIndex: 0 });
    state = {
      ...state,
      privates: {
        ...state.privates,
        SVN: { ...state.privates.SVN, location: { type: "player", playerId: "player-1" } },
      },
    };
    state = completeStockRound(state);
    expect(state.operatingShell?.operatingOrder).toEqual(["NYC", "PRR", "B&O"]);
    expect(state.players["player-1"].cash).toBe(805);
    while (state.round === "operatingShell") state = endCurrentShellTurn(state);
    expect(state.round).toBe("stock");

    state = {
      ...state,
      bankCash: 7,
      corporations: {
        ...state.corporations,
        "C&O": { ...state.corporations["C&O"], treasury: 9_588 },
      },
      privates: {
        ...state.privates,
        CSL: { ...state.privates.CSL, location: { type: "player", playerId: "player-2" } },
      },
    };
    state = completeStockRound(state);
    expect(state.round).toBe("operatingShell");
    expect(state.bankCash).toBe(0);
    expect(state.bankBroken).toBe(true);
    expect(state.bankObligations).toEqual([
      expect.objectContaining({
        recipient: { type: "player", playerId: "player-2" },
        amount: 8,
        reason: "privateIncome",
      }),
    ]);
    expect(state.operatingShell?.stopAfterShell).toBe(true);

    const orderLength = state.operatingShell!.operatingOrder.length;
    for (let index = 0; index < orderLength - 1; index += 1) {
      state = endCurrentShellTurn(state);
      expect(state.round).toBe("operatingShell");
    }
    state = endCurrentShellTurn(state);
    expect(state.round).toBe("milestoneStopped");
    expect(state.operatingShell).toBeNull();
  });
});
