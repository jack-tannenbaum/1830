import { TOTAL_GAME_CASH } from "./constants";
import type { Certificate, GameState } from "./model";
import { poolPercent } from "./ownership";

function fail(invariant: string, id: string, detail: string): never {
  throw new Error(`${invariant} invariant violated for ${id}: ${detail}`);
}

function assertMoney(value: number, invariant: string, id: string): void {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    fail(invariant, id, `invalid cash ${value}`);
  }
}

export function assertActualCashTotals12k(state: GameState): void {
  const playerCash = Object.values(state.players).reduce((total, player) => total + player.cash, 0);
  const corporationCash = Object.values(state.corporations)
    .reduce((total, corporation) => total + corporation.treasury, 0);
  const actualCash = state.bankCash + playerCash + corporationCash;
  if (actualCash !== TOTAL_GAME_CASH) {
    fail("actual cash totals $12,000", state.id, `found $${actualCash}`);
  }
}

function assertCertificateLocation(state: GameState, certificate: Certificate): void {
  if (!state.corporations[certificate.corporationId]) {
    fail("certificate location", certificate.id, `unknown corporation ${certificate.corporationId}`);
  }
  switch (certificate.location.type) {
    case "initialOffering":
    case "bankPool":
      return;
    case "player":
      if (!state.players[certificate.location.playerId]) {
        fail("certificate location", certificate.id, `unknown player ${certificate.location.playerId}`);
      }
      return;
    default:
      fail("certificate location", certificate.id, "unknown location");
  }
}

export function assertCertificateLocations(state: GameState): void {
  for (const [certificateId, certificate] of Object.entries(state.certificates)) {
    if (certificate.id !== certificateId) {
      fail("certificate location", certificateId, `record contains ${certificate.id}`);
    }
    assertCertificateLocation(state, certificate);
  }
}

export function assertCorporationSharesTotal100(state: GameState): void {
  for (const corporationId of Object.keys(state.corporations)) {
    const total = Object.values(state.certificates)
      .filter((certificate) => certificate.corporationId === corporationId)
      .reduce((sum, certificate) => sum + certificate.percent, 0);
    if (total !== 100) {
      fail("corporation shares total 100%", corporationId, `found ${total}%`);
    }
  }
}

export function assertPresidentCertificatesOutsidePool(state: GameState): void {
  for (const certificate of Object.values(state.certificates)) {
    if (certificate.isPresident && certificate.location.type === "bankPool") {
      fail("president certificate outside Bank Pool", certificate.id, "found in Bank Pool");
    }
  }
}

export function assertPoolAtMost50Percent(state: GameState): void {
  for (const corporationId of Object.keys(state.corporations)) {
    const percent = poolPercent(state, corporationId);
    if (percent > 50) {
      fail("Bank Pool at most 50%", corporationId, `found ${percent}%`);
    }
  }
}

export function assertNonnegativeCashAndAvailability(state: GameState): void {
  assertMoney(state.bankCash, "nonnegative cash and availability", "Bank");
  for (const player of Object.values(state.players)) {
    assertMoney(player.cash, "nonnegative cash and availability", player.id);
    const locked = state.auction
      ? Object.values(state.auction.lockedByPlayer[player.id] ?? {})
        .reduce((total, amount) => total + amount, 0)
      : 0;
    assertMoney(locked, "nonnegative cash and availability", `${player.id} locked cash`);
    if (player.cash - locked < 0) {
      fail(
        "nonnegative cash and availability",
        player.id,
        `cash $${player.cash}, locked $${locked}`,
      );
    }
  }
  for (const corporation of Object.values(state.corporations)) {
    assertMoney(corporation.treasury, "nonnegative cash and availability", corporation.id);
  }
  for (const obligation of state.bankObligations) {
    assertMoney(obligation.amount, "nonnegative cash and availability", obligation.id);
  }
}

export function assertGameInvariants(state: GameState): void {
  assertActualCashTotals12k(state);
  assertCertificateLocations(state);
  assertCorporationSharesTotal100(state);
  assertPresidentCertificatesOutsidePool(state);
  assertPoolAtMost50Percent(state);
  assertNonnegativeCashAndAvailability(state);
}
