import { describe, expect, it } from "vitest";
import type { StockCommand } from "./commands";
import type { CertificateId, CorporationId, GameState, PlayerId } from "./model";
import { createGame } from "./setup";
import { executeStock } from "./stock";

function command(
  state: GameState,
  id: string,
  actorId: PlayerId,
  type: StockCommand["type"],
  payload: StockCommand["payload"],
): StockCommand {
  return { id, gameId: state.id, actorId, expectedVersion: state.version, type, payload } as StockCommand;
}

function accept(state: GameState, nextCommand: StockCommand): GameState {
  const result = executeStock(state, nextCommand);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.message);
  return result.state;
}

function expectRejected(
  state: GameState,
  nextCommand: StockCommand,
  code: string,
): void {
  expect(executeStock(state, nextCommand)).toMatchObject({ ok: false, code });
}

function stockRoundState(state: GameState, actorId: PlayerId): NonNullable<GameState["stock"]> {
  return {
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
}

function laterStockGame(id: string): GameState {
  const initial = createGame({
    gameId: id,
    playerNames: ["P1", "P2", "P3"],
    placeOrder: [0, 1, 2],
  });
  const actorId = "player-1";
  return {
    ...initial,
    round: "stock",
    roundNumber: 2,
    isFirstStockRound: false,
    auction: null,
    stock: stockRoundState(initial, actorId),
    privates: {
      ...initial.privates,
      SVN: { ...initial.privates.SVN, location: { type: "player", playerId: "player-1" } },
      CSL: { ...initial.privates.CSL, location: { type: "player", playerId: "player-2" } },
      DH: { ...initial.privates.DH, location: { type: "player", playerId: "player-3" } },
      MH: { ...initial.privates.MH, location: { type: "player", playerId: "player-1" } },
      CA: { ...initial.privates.CA, location: { type: "player", playerId: "player-1" } },
      BO: { ...initial.privates.BO, location: { type: "player", playerId: "player-2" } },
    },
    certificates: {
      ...initial.certificates,
      "PRR-10-1": {
        ...initial.certificates["PRR-10-1"],
        location: { type: "player", playerId: "player-1" },
        saleRestrictedUntilCorporationParred: "PRR",
      },
    },
    corporations: {
      ...initial.corporations,
      CPR: {
        ...initial.corporations.CPR,
        lifecycle: "parred",
        parPrice: 67,
        market: { row: 6, column: 6, stackIndex: 0 },
      },
    },
  };
}

function giveCertificates(
  state: GameState,
  playerId: PlayerId,
  certificateIds: CertificateId[],
): GameState {
  return {
    ...state,
    certificates: {
      ...state.certificates,
      ...Object.fromEntries(certificateIds.map((certificateId) => [
        certificateId,
        {
          ...state.certificates[certificateId],
          location: { type: "player" as const, playerId },
        },
      ])),
    },
  };
}

function setCorporationMarket(
  state: GameState,
  corporationId: CorporationId,
  row: number,
  column: number,
): GameState {
  return {
    ...state,
    corporations: {
      ...state.corporations,
      [corporationId]: {
        ...state.corporations[corporationId],
        lifecycle: "parred",
        parPrice: 67,
        market: { row, column, stackIndex: 0 },
      },
    },
  };
}

function limitFixture(id: string): GameState {
  let state = laterStockGame(id);
  state = {
    ...state,
    privates: Object.fromEntries(
      Object.values(state.privates).map((privateCompany) => [
        privateCompany.id,
        { ...privateCompany, location: { type: "closed" as const } },
      ]),
    ),
    certificates: Object.fromEntries(
      Object.values(state.certificates).map((certificate) => [
        certificate.id,
        {
          ...certificate,
          saleRestrictedUntilCorporationParred: null,
          location: { type: "initialOffering" as const },
        },
      ]),
    ),
  };
  state = {
    ...state,
    stock: stockRoundState(state, "player-1"),
    players: {
      ...state.players,
      "player-1": { ...state.players["player-1"], cash: 5_000 },
    },
    bankCash: 5_400,
  };
  return state;
}

function firstFive(corporationId: CorporationId): CertificateId[] {
  return [
    `${corporationId}-president`,
    `${corporationId}-10-1`,
    `${corporationId}-10-2`,
    `${corporationId}-10-3`,
    `${corporationId}-10-4`,
  ];
}

describe("financial engine scenarios", () => {
  it("4. enforces complete later Stock Round behavior", () => {
    let state = laterStockGame("stock-flow");

    expectRejected(
      state,
      command(state, "restricted", "player-1", "stock.sellCertificates", {
        certificateIds: ["PRR-10-1"],
      }),
      "ACTION_NOT_ALLOWED_IN_ROUND",
    );

    state = accept(state, command(state, "start-prr", "player-1", "stock.startCorporation", {
      corporationId: "PRR",
      parPrice: 67,
    }));
    expect(state.certificates["PRR-president"].location).toEqual({
      type: "player",
      playerId: "player-1",
    });
    expect(state.certificates["PRR-10-1"].saleRestrictedUntilCorporationParred).toBeNull();
    state = accept(state, command(state, "finish-start", "player-1", "stock.finishTurn", {}));
    expect(state.stock?.consecutivePasses).toBe(0);

    state = accept(state, command(state, "buy-ipo", "player-2", "stock.buyCertificate", {
      certificateId: "PRR-10-2",
    }));
    expect(state.certificates["PRR-10-2"].location).toEqual({
      type: "player",
      playerId: "player-2",
    });
    state = accept(state, command(state, "finish-ipo", "player-2", "stock.finishTurn", {}));
    state = accept(state, command(state, "p3-pass", "player-3", "stock.pass", {}));
    state = accept(state, command(state, "p1-pass", "player-1", "stock.pass", {}));

    state = accept(state, command(state, "sell-prr", "player-2", "stock.sellCertificates", {
      certificateIds: ["PRR-10-2"],
    }));
    expect(state.stock?.currentActorId).toBe("player-2");
    expect(state.certificates["PRR-10-2"].location).toEqual({ type: "bankPool" });
    expect(state.corporations.PRR.market).toMatchObject({ row: 6, column: 6, stackIndex: 1 });

    state = accept(state, command(state, "start-nyc", "player-2", "stock.startCorporation", {
      corporationId: "NYC",
      parPrice: 67,
    }));
    expectRejected(
      state,
      command(state, "rebuy-sold", "player-2", "stock.buyCertificate", {
        certificateId: "PRR-10-2",
      }),
      "CANNOT_BUY_AFTER_SELLING",
    );
    state = accept(state, command(state, "finish-sale-buy", "player-2", "stock.finishTurn", {}));

    state = accept(state, command(state, "buy-pool", "player-3", "stock.buyCertificate", {
      certificateId: "PRR-10-2",
    }));
    expect(state.certificates["PRR-10-2"].location).toEqual({
      type: "player",
      playerId: "player-3",
    });

    state = accept(state, command(state, "trade-proposal", "player-3", "stock.proposePrivateTrade", {
      privateId: "SVN",
      buyerId: "player-3",
      sellerId: "player-1",
      price: 40,
    }));
    expect(state.stock?.pendingPrivateTrade?.responderId).toBe("player-1");
    state = accept(state, command(state, "trade-accept", "player-1", "stock.respondPrivateTrade", {
      accepted: true,
    }));
    expect(state.privates.SVN.location).toEqual({ type: "player", playerId: "player-3" });
    expect(state.stock?.currentActorId).toBe("player-3");
    state = accept(state, command(state, "finish-p3", "player-3", "stock.finishTurn", {}));

    state = accept(state, command(state, "final-pass-1", "player-1", "stock.pass", {}));
    state = accept(state, command(state, "final-pass-2", "player-2", "stock.pass", {}));
    state = accept(state, command(state, "final-pass-3", "player-3", "stock.pass", {}));
    expect(state.priorityDealPlayerId).toBe("player-1");

    let orange = limitFixture("orange-limit");
    orange = setCorporationMarket(orange, "CPR", 3, 0);
    orange = giveCertificates(orange, "player-1", firstFive("CPR"));
    orange = accept(orange, command(orange, "orange-sixth", "player-1", "stock.buyCertificate", {
      certificateId: "CPR-10-5",
    }));
    expect(orange.certificates["CPR-10-5"].location).toEqual({
      type: "player",
      playerId: "player-1",
    });

    let yellow = limitFixture("yellow-limit");
    for (const corporationId of ["PRR", "NYC", "C&O", "ERIE"] as const) {
      yellow = setCorporationMarket(yellow, corporationId, 0, 1);
      yellow = giveCertificates(yellow, "player-1", firstFive(corporationId));
    }
    yellow = setCorporationMarket(yellow, "CPR", 0, 0);
    yellow = giveCertificates(yellow, "player-2", ["CPR-president"]);
    yellow = accept(yellow, command(yellow, "yellow-over-total", "player-1", "stock.buyCertificate", {
      certificateId: "CPR-10-1",
    }));
    expect(yellow.certificates["CPR-10-1"].location).toEqual({
      type: "player",
      playerId: "player-1",
    });

    let brown = limitFixture("brown-limits");
    for (const corporationId of ["PRR", "NYC", "C&O", "ERIE"] as const) {
      brown = setCorporationMarket(brown, corporationId, 0, 1);
      brown = giveCertificates(brown, "player-1", firstFive(corporationId));
    }
    brown = setCorporationMarket(brown, "B&M", 5, 0);
    brown = giveCertificates(brown, "player-1", firstFive("B&M"));
    brown = accept(brown, command(brown, "brown-sixth", "player-1", "stock.buyCertificate", {
      certificateId: "B&M-10-5",
    }));
    brown = accept(brown, command(brown, "brown-seventh", "player-1", "stock.buyCertificate", {
      certificateId: "B&M-10-6",
    }));
    expect(brown.stock?.turn.purchaseCount).toBe(2);

    let correction = limitFixture("limit-correction");
    for (const corporationId of ["PRR", "NYC", "C&O"] as const) {
      correction = setCorporationMarket(correction, corporationId, 0, 1);
      correction = giveCertificates(correction, "player-1", firstFive(corporationId));
    }
    correction = setCorporationMarket(correction, "ERIE", 0, 1);
    correction = giveCertificates(correction, "player-1", firstFive("ERIE").slice(0, 4));
    correction = setCorporationMarket(correction, "CPR", 0, 1);
    correction = giveCertificates(correction, "player-1", ["CPR-president", "CPR-10-1"]);
    correction = {
      ...correction,
      stock: {
        ...correction.stock!,
        turn: { actorId: "player-1", hasTransaction: true, purchaseCount: 0 },
        certificateLimitCorrectionByPlayer: {
          ...correction.stock!.certificateLimitCorrectionByPlayer,
          "player-1": { excessCount: 1, active: false },
        },
      },
    };
    correction = accept(correction, command(
      correction,
      "correction-finish-current",
      "player-1",
      "stock.finishTurn",
      {},
    ));
    correction = accept(correction, command(correction, "correction-p2", "player-2", "stock.pass", {}));
    correction = accept(correction, command(correction, "correction-p3", "player-3", "stock.pass", {}));
    expect(correction.stock?.certificateLimitCorrectionByPlayer["player-1"]).toEqual({
      excessCount: 1,
      active: true,
    });
    expectRejected(
      correction,
      command(correction, "correction-pass-rejected", "player-1", "stock.pass", {}),
      "CERTIFICATE_LIMIT_EXCEEDED",
    );
    correction = accept(correction, command(
      correction,
      "correction-sale",
      "player-1",
      "stock.sellCertificates",
      { certificateIds: ["CPR-10-1"] },
    ));
    expect(correction.stock?.certificateLimitCorrectionByPlayer["player-1"]).toBeNull();
  });
});
