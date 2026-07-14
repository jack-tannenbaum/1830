import { describe, expect, it } from "vitest";
import type { AuctionCommand } from "./commands";
import { executeAuction } from "./auction";
import type { GameState } from "./model";
import { createGame } from "./setup";

function game(id: string): GameState {
  return createGame({ gameId: id, playerNames: ["P1", "P2", "P3"], placeOrder: [0, 1, 2] });
}

function command(
  state: GameState,
  id: string,
  actorId: string,
  type: AuctionCommand["type"],
  payload: AuctionCommand["payload"],
): AuctionCommand {
  return { id, gameId: state.id, actorId, expectedVersion: state.version, type, payload } as AuctionCommand;
}

function apply(state: GameState, nextCommand: AuctionCommand): GameState {
  const result = executeAuction(state, nextCommand);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.message);
  return result.state;
}

function passEveryone(state: GameState, idPrefix: string): GameState {
  for (let index = 0; index < state.playerOrder.length; index += 1) {
    const actorId = state.auction!.currentActorId;
    state = apply(state, command(state, `${idPrefix}-${index}`, actorId, "auction.pass", {}));
  }
  return state;
}

describe("private auction scenarios", () => {
  it("2. purchases normally and resolves single and contested advance bids", () => {
    let state = game("auction-normal");
    const bought = executeAuction(state, command(
      state,
      "a1",
      "player-1",
      "auction.buyOfferedPrivate",
      {},
    ));
    expect(bought.ok).toBe(true);
    if (!bought.ok) throw new Error(bought.message);
    expect(bought.state.players["player-1"].cash).toBe(780);
    expect(bought.state.bankCash).toBe(9_620);

    const bid = executeAuction(bought.state, command(
      bought.state,
      "a2",
      "player-2",
      "auction.placeAdvanceBid",
      { privateId: "DH", amount: 75 },
    ));
    expect(bid.ok).toBe(true);
    if (!bid.ok) throw new Error(bid.message);
    expect(bid.state.auction?.lockedByPlayer["player-2"]["DH"]).toBe(75);

    state = apply(bid.state, command(bid.state, "a3", "player-3", "auction.pass", {}));
    state = apply(state, command(state, "a4", "player-1", "auction.pass", {}));
    const duplicate = executeAuction(state, command(
      state,
      "a5",
      "player-2",
      "auction.placeAdvanceBid",
      { privateId: "DH", amount: 80 },
    ));
    expect(duplicate).toMatchObject({ ok: false, code: "DUPLICATE_ADVANCE_BID" });

    let single = game("auction-single");
    single = apply(single, command(single, "s1", "player-1", "auction.buyOfferedPrivate", {}));
    single = apply(single, command(
      single,
      "s2",
      "player-2",
      "auction.placeAdvanceBid",
      { privateId: "DH", amount: 75 },
    ));
    single = apply(single, command(single, "s3", "player-3", "auction.pass", {}));
    single = apply(single, command(single, "s4", "player-1", "auction.buyOfferedPrivate", {}));
    expect(single.privates.DH.location).toEqual({ type: "player", playerId: "player-2" });
    expect(single.players["player-2"].cash).toBe(725);
    expect(single.auction?.lockedByPlayer["player-2"].DH).toBeUndefined();
    expect(single.auction?.currentPrivateId).toBe("MH");

    let contested = game("auction-contested");
    contested = apply(contested, command(contested, "c1", "player-1", "auction.buyOfferedPrivate", {}));
    contested = apply(contested, command(
      contested,
      "c2",
      "player-2",
      "auction.placeAdvanceBid",
      { privateId: "DH", amount: 75 },
    ));
    contested = apply(contested, command(
      contested,
      "c3",
      "player-3",
      "auction.placeAdvanceBid",
      { privateId: "DH", amount: 80 },
    ));
    contested = apply(contested, command(contested, "c4", "player-1", "auction.buyOfferedPrivate", {}));
    expect(contested.auction?.bidOff).toMatchObject({
      privateId: "DH",
      currentActorId: "player-2",
      standingBid: 80,
      standingBidderId: "player-3",
    });
    contested = apply(contested, command(
      contested,
      "c5",
      "player-2",
      "auction.raiseBid",
      { amount: 85 },
    ));
    contested = apply(contested, command(contested, "c6", "player-3", "auction.pass", {}));
    expect(contested.privates.DH.location).toEqual({ type: "player", playerId: "player-2" });
    expect(contested.players["player-2"].cash).toBe(715);
    expect(contested.auction?.bidOff).toBeNull();
  });

  it("3. handles SVN decline, free assignment, failed rounds, income, and Priority Deal", () => {
    let state = game("auction-decline");
    for (const expectedPrice of [15, 10, 5]) {
      state = passEveryone(state, `decline-${expectedPrice}`);
      expect(state.privates.SVN.offeredPrice).toBe(expectedPrice);
    }
    state = passEveryone(state, "decline-free");
    expect(state.privates.SVN.location).toEqual({ type: "player", playerId: "player-1" });
    expect(state.players["player-1"].cash).toBe(800);
    expect(state.auction?.currentPrivateId).toBe("CSL");
    expect(state.isFirstStockRound).toBe(false);
    expect(state.roundNumber).toBe(5);

    const nearlyBroken: GameState = {
      ...state,
      bankCash: 5,
      corporations: {
        ...state.corporations,
        PRR: { ...state.corporations.PRR, treasury: 9_595 },
      },
    };
    const stopped = passEveryone(nearlyBroken, "bank-break");
    expect(stopped.bankCash).toBe(0);
    expect(stopped.bankBroken).toBe(true);
    expect(stopped.round).toBe("milestoneStopped");
    expect(stopped.auction).toBeNull();

    state = passEveryone(state, "later-pass");
    expect(state.players["player-1"].cash).toBe(805);
    expect(state.bankCash).toBe(9_595);
    expect(state.priorityDealPlayerId).toBe("player-2");
    expect(state.auction?.currentActorId).toBe("player-2");
    expect(state.roundNumber).toBe(6);

    const noDeal = game("auction-no-deal");
    const retained = passEveryone(noDeal, "retain");
    expect(retained.priorityDealPlayerId).toBe("player-1");
  });
});
