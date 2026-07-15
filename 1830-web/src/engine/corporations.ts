import { CERTIFICATE_LIMIT } from "./constants";
import { payFromBank } from "./ledger";
import type {
  Certificate,
  CorporationId,
  GameState,
  PlayerId,
} from "./model";
import {
  certificatesForPlayer,
  countedCertificateTotal,
  ownershipPercent,
  soldCertificateCount,
} from "./ownership";

function presidentCertificate(state: GameState, corporationId: CorporationId): Certificate {
  const certificate = Object.values(state.certificates).find(
    (candidate) => candidate.corporationId === corporationId && candidate.isPresident,
  );
  if (!certificate) throw new Error(`Missing president certificate for ${corporationId}`);
  return certificate;
}

function currentPresidentId(state: GameState, corporationId: CorporationId): PlayerId | null {
  const location = presidentCertificate(state, corporationId).location;
  return location.type === "player" ? location.playerId : null;
}

function playersLeftOf(state: GameState, playerId: PlayerId): PlayerId[] {
  const start = state.playerOrder.indexOf(playerId);
  if (start < 0) throw new Error(`Unknown player ${playerId}`);
  return Array.from(
    { length: state.playerOrder.length - 1 },
    (_, offset) => state.playerOrder[(start + offset + 1) % state.playerOrder.length],
  );
}

/**
 * Returns the player who should hold the presidency in the supplied state.
 * The current president keeps a tie; ties between eligible successors are
 * resolved by walking left from the outgoing president.
 */
export function calculatePresident(
  state: GameState,
  corporationId: CorporationId,
): PlayerId | null {
  if (!state.corporations[corporationId]) {
    throw new Error(`Unknown corporation ${corporationId}`);
  }
  const incumbentId = currentPresidentId(state, corporationId);
  if (!incumbentId) return null;

  const incumbentPercent = ownershipPercent(state, corporationId, incumbentId);
  const holdings = state.playerOrder.map((playerId) => ({
    playerId,
    percent: ownershipPercent(state, corporationId, playerId),
  }));
  const highestPercent = Math.max(...holdings.map(({ percent }) => percent));
  if (highestPercent <= incumbentPercent) return incumbentId;

  const tiedCandidates = new Set(
    holdings
      .filter(({ percent }) => percent === highestPercent)
      .map(({ playerId }) => playerId),
  );
  return playersLeftOf(state, incumbentId).find((playerId) => tiedCandidates.has(playerId))
    ?? incumbentId;
}

function ordinaryCertificatesForPlayer(
  state: GameState,
  corporationId: CorporationId,
  playerId: PlayerId,
): Certificate[] {
  return certificatesForPlayer(state, playerId)
    .filter((certificate) => certificate.corporationId === corporationId
      && !certificate.isPresident
      && certificate.percent === 10)
    .sort((left, right) => left.id.localeCompare(right.id));
}

function recordInactiveLimitCorrection(state: GameState, playerId: PlayerId): GameState {
  const limit = CERTIFICATE_LIMIT[
    state.playerOrder.length as keyof typeof CERTIFICATE_LIMIT
  ];
  if (!limit) throw new Error(`Unsupported player count ${state.playerOrder.length}`);
  const excessCount = Math.max(0, countedCertificateTotal(state, playerId) - limit);
  if (excessCount === 0) return state;
  if (!state.stock) {
    throw new Error(`Cannot record certificate-limit correction outside a Stock Round`);
  }
  return {
    ...state,
    stock: {
      ...state.stock,
      certificateLimitCorrectionByPlayer: {
        ...state.stock.certificateLimitCorrectionByPlayer,
        [playerId]: { excessCount, active: false },
      },
    },
  };
}

/**
 * Exchanges the unique president certificate for two deterministic 10%
 * certificates. Callers may pass an expected successor when validating an
 * atomic stock transaction; otherwise the rules-selected successor is used.
 */
export function applyPresidencyTransfer(
  state: GameState,
  corporationId: CorporationId,
  incomingPresidentId: PlayerId | null = calculatePresident(state, corporationId),
): GameState {
  const outgoingPresidentId = currentPresidentId(state, corporationId);
  if (!outgoingPresidentId || !incomingPresidentId || incomingPresidentId === outgoingPresidentId) {
    return state;
  }
  if (!state.players[incomingPresidentId]) {
    throw new Error(`Unknown incoming president ${incomingPresidentId}`);
  }

  const selectedPresidentId = calculatePresident(state, corporationId);
  if (selectedPresidentId !== incomingPresidentId) {
    throw new Error(
      `${incomingPresidentId} is not the rules-selected president of ${corporationId}`,
    );
  }

  const ordinaryCertificates = ordinaryCertificatesForPlayer(
    state,
    corporationId,
    incomingPresidentId,
  );
  if (ordinaryCertificates.length < 2) {
    throw new Error(
      `${incomingPresidentId} lacks two 10% certificates for the ${corporationId} presidency exchange`,
    );
  }

  const president = presidentCertificate(state, corporationId);
  const [firstOrdinary, secondOrdinary] = ordinaryCertificates;
  const certificates = {
    ...state.certificates,
    [president.id]: {
      ...president,
      location: { type: "player" as const, playerId: incomingPresidentId },
    },
    [firstOrdinary.id]: {
      ...firstOrdinary,
      location: { type: "player" as const, playerId: outgoingPresidentId },
    },
    [secondOrdinary.id]: {
      ...secondOrdinary,
      location: { type: "player" as const, playerId: outgoingPresidentId },
    },
  };

  return recordInactiveLimitCorrection({ ...state, certificates }, outgoingPresidentId);
}

/** Marks a parred corporation float-eligible once five sold certificates total at least 60%. */
export function updateFloatEligibility(
  state: GameState,
  corporationId: CorporationId,
): GameState {
  const corporation = state.corporations[corporationId];
  if (!corporation) throw new Error(`Unknown corporation ${corporationId}`);
  if (corporation.lifecycle === "floatEligible" || corporation.lifecycle === "operating") {
    return state;
  }
  if (corporation.lifecycle !== "parred" || soldCertificateCount(state, corporationId) < 5) {
    return state;
  }
  const soldPercent = Object.values(state.certificates)
    .filter((certificate) => certificate.corporationId === corporationId
      && certificate.location.type !== "initialOffering")
    .reduce((total, certificate) => total + certificate.percent, 0);
  if (soldPercent < 60) return state;

  return {
    ...state,
    corporations: {
      ...state.corporations,
      [corporationId]: { ...corporation, lifecycle: "floatEligible" },
    },
  };
}

/** Fully capitalizes a newly floated corporation exactly once. */
export function capitalizeCorporation(
  state: GameState,
  corporationId: CorporationId,
): GameState {
  const corporation = state.corporations[corporationId];
  if (!corporation) throw new Error(`Unknown corporation ${corporationId}`);
  if (corporation.lifecycle === "operating") return state;
  if (corporation.lifecycle !== "floatEligible") return state;
  if (corporation.parPrice === null) {
    throw new Error(`Cannot capitalize ${corporationId} without a par price`);
  }

  const markedOperating: GameState = {
    ...state,
    corporations: {
      ...state.corporations,
      [corporationId]: { ...corporation, lifecycle: "operating" },
    },
  };
  return payFromBank(
    markedOperating,
    { type: "corporation", corporationId },
    corporation.parPrice * 10,
    "capitalization",
  );
}
