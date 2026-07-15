import { ENGINE_VERSION, SAVE_SCHEMA_VERSION } from "./constants";
import { assertGameInvariants } from "./invariants";
import type { GameState } from "./model";

export interface SaveEnvelope {
  schemaVersion: 2;
  engineVersion: "financial-core-v1";
  savedAt: string;
  game: GameState;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function hasRecordValues(value: unknown, predicate: (item: unknown) => boolean): value is UnknownRecord {
  return isRecord(value) && Object.values(value).every(predicate);
}

function isPlayer(value: unknown): boolean {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.name === "string"
    && isInteger(value.cash)
    && isInteger(value.seat);
}

function isMarketPosition(value: unknown): boolean {
  return isRecord(value)
    && isInteger(value.row)
    && isInteger(value.column)
    && isInteger(value.stackIndex);
}

function isCorporation(value: unknown): boolean {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.name === "string"
    && typeof value.abbreviation === "string"
    && typeof value.color === "string"
    && ["unstarted", "parred", "floatEligible", "operating"].includes(String(value.lifecycle))
    && (value.parPrice === null || isInteger(value.parPrice))
    && (value.market === null || isMarketPosition(value.market))
    && isInteger(value.treasury);
}

function isCertificateLocation(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value.type === "initialOffering" || value.type === "bankPool") return true;
  return value.type === "player" && typeof value.playerId === "string";
}

function isCertificate(value: unknown): boolean {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.corporationId === "string"
    && (value.percent === 10 || value.percent === 20)
    && typeof value.isPresident === "boolean"
    && isNullableString(value.saleRestrictedUntilCorporationParred)
    && isCertificateLocation(value.location);
}

function isPrivateLocation(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value.type === "bank" || value.type === "closed") return true;
  if (value.type === "player") return typeof value.playerId === "string";
  return value.type === "corporation" && typeof value.corporationId === "string";
}

function isPrivate(value: unknown): boolean {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.name === "string"
    && isInteger(value.faceValue)
    && isInteger(value.revenue)
    && isInteger(value.offeredPrice)
    && (value.purchasePrice === undefined || isInteger(value.purchasePrice))
    && isPrivateLocation(value.location);
}

function isAuctionBid(value: unknown): boolean {
  return isRecord(value)
    && typeof value.playerId === "string"
    && typeof value.privateId === "string"
    && isInteger(value.amount);
}

function isBidOff(value: unknown): boolean {
  return isRecord(value)
    && typeof value.privateId === "string"
    && isStringArray(value.participantIds)
    && isStringArray(value.passedPlayerIds)
    && typeof value.currentActorId === "string"
    && isInteger(value.standingBid)
    && typeof value.standingBidderId === "string";
}

function isAuction(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const bidsValid = hasRecordValues(
    value.bidsByPrivate,
    (bids) => Array.isArray(bids) && bids.every(isAuctionBid),
  );
  const locksValid = hasRecordValues(
    value.lockedByPlayer,
    (locks) => hasRecordValues(locks, isInteger),
  );
  return typeof value.currentActorId === "string"
    && typeof value.currentPrivateId === "string"
    && isInteger(value.consecutivePasses)
    && bidsValid
    && locksValid
    && (value.bidOff === null || isBidOff(value.bidOff))
    && isNullableString(value.pendingBOParPlayerId);
}

function isPendingPrivateTrade(value: unknown): boolean {
  return isRecord(value)
    && typeof value.proposedByPlayerId === "string"
    && typeof value.responderId === "string"
    && typeof value.privateId === "string"
    && typeof value.buyerId === "string"
    && typeof value.sellerId === "string"
    && isInteger(value.price);
}

function isCertificateCorrection(value: unknown): boolean {
  return value === null || (isRecord(value)
    && isInteger(value.excessCount)
    && typeof value.active === "boolean");
}

function isStock(value: unknown): boolean {
  if (!isRecord(value) || !isRecord(value.turn)) return false;
  return typeof value.currentActorId === "string"
    && isInteger(value.consecutivePasses)
    && typeof value.turn.actorId === "string"
    && typeof value.turn.hasTransaction === "boolean"
    && isInteger(value.turn.purchaseCount)
    && hasRecordValues(value.soldCorporationIdsByPlayer, isStringArray)
    && hasRecordValues(value.certificateLimitCorrectionByPlayer, isCertificateCorrection)
    && (value.pendingPrivateTrade === null || isPendingPrivateTrade(value.pendingPrivateTrade));
}

function isOperatingShell(value: unknown): boolean {
  return isRecord(value)
    && isStringArray(value.operatingOrder)
    && isInteger(value.currentIndex)
    && isNullableString(value.currentCorporationId)
    && typeof value.stopAfterShell === "boolean";
}

function isObligationRecipient(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value.type === "player") return typeof value.playerId === "string";
  return value.type === "corporation" && typeof value.corporationId === "string";
}

function isBankObligation(value: unknown): boolean {
  return isRecord(value)
    && typeof value.id === "string"
    && isObligationRecipient(value.recipient)
    && isInteger(value.amount)
    && ["stockSale", "privateIncome", "capitalization"].includes(String(value.reason));
}

function isGameState(value: unknown): value is GameState {
  if (!isRecord(value)) return false;
  return typeof value.id === "string"
    && isInteger(value.version)
    && ["privateAuction", "stock", "operatingShell", "milestoneStopped"].includes(String(value.round))
    && isInteger(value.roundNumber)
    && typeof value.isFirstStockRound === "boolean"
    && isStringArray(value.playerOrder)
    && isStringArray(value.corporationOrder)
    && hasRecordValues(value.players, isPlayer)
    && hasRecordValues(value.corporations, isCorporation)
    && hasRecordValues(value.certificates, isCertificate)
    && hasRecordValues(value.privates, isPrivate)
    && isInteger(value.bankCash)
    && typeof value.priorityDealPlayerId === "string"
    && isNullableString(value.lastTransactionPlayerId)
    && (value.auction === null || isAuction(value.auction))
    && (value.stock === null || isStock(value.stock))
    && (value.operatingShell === null || isOperatingShell(value.operatingShell))
    && typeof value.bankBroken === "boolean"
    && Array.isArray(value.bankObligations)
    && value.bankObligations.every(isBankObligation)
    && isStringArray(value.appliedCommandIds);
}

export function encodeSave(game: GameState, savedAt: string): string {
  assertGameInvariants(game);
  const envelope: SaveEnvelope = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    savedAt,
    game,
  };
  return JSON.stringify(envelope);
}

export function decodeSave(raw: string): GameState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid save data");
  }

  if (!isRecord(parsed)) throw new Error("Invalid save data");
  if (parsed.schemaVersion !== SAVE_SCHEMA_VERSION || parsed.engineVersion !== ENGINE_VERSION) {
    throw new Error("Unsupported save version");
  }
  if (typeof parsed.savedAt !== "string" || !isGameState(parsed.game)) {
    throw new Error("Invalid save data");
  }

  try {
    assertGameInvariants(parsed.game);
  } catch {
    throw new Error("Invalid save data");
  }
  return parsed.game;
}
