export type PlayerId = string;
export type CorporationId = string;
export type CertificateId = string;
export type PrivateId = string;

export type CertificateLocation =
  | { type: "initialOffering" }
  | { type: "bankPool" }
  | { type: "player"; playerId: PlayerId };

export interface Certificate {
  id: CertificateId;
  corporationId: CorporationId;
  percent: 10 | 20;
  isPresident: boolean;
  saleRestrictedUntilCorporationParred: CorporationId | null;
  location: CertificateLocation;
}

export type PrivateLocation =
  | { type: "bank" }
  | { type: "player"; playerId: PlayerId }
  | { type: "corporation"; corporationId: CorporationId }
  | { type: "closed" };

export interface PlayerState {
  id: PlayerId;
  name: string;
  cash: number;
  seat: number;
}

export interface CorporationState {
  id: CorporationId;
  name: string;
  abbreviation: string;
  color: string;
  lifecycle: "unstarted" | "parred" | "floatEligible" | "operating";
  parPrice: number | null;
  // stackIndex 0 is top and operates first; larger indices are lower.
  market: { row: number; column: number; stackIndex: number } | null;
  treasury: number;
}

export interface PrivateState {
  id: PrivateId;
  name: string;
  faceValue: number;
  revenue: number;
  offeredPrice: number;
  location: PrivateLocation;
}

export interface BankObligation {
  id: string;
  recipient:
    | { type: "player"; playerId: PlayerId }
    | { type: "corporation"; corporationId: CorporationId };
  amount: number;
  reason: "stockSale" | "privateIncome" | "capitalization";
}

export interface AuctionBid {
  playerId: PlayerId;
  privateId: PrivateId;
  amount: number;
}

export interface BidOffState {
  privateId: PrivateId;
  participantIds: PlayerId[];
  passedPlayerIds: PlayerId[];
  currentActorId: PlayerId;
  standingBid: number;
  standingBidderId: PlayerId;
}

export interface AuctionState {
  currentActorId: PlayerId;
  currentPrivateId: PrivateId;
  consecutivePasses: number;
  bidsByPrivate: Record<PrivateId, AuctionBid[]>;
  lockedByPlayer: Record<PlayerId, Record<PrivateId, number>>;
  bidOff: BidOffState | null;
  pendingBOParPlayerId: PlayerId | null;
}

export interface PendingPrivateTrade {
  proposedByPlayerId: PlayerId;
  responderId: PlayerId;
  privateId: PrivateId;
  buyerId: PlayerId;
  sellerId: PlayerId;
  price: number;
}

export interface StockTurnState {
  actorId: PlayerId;
  hasTransaction: boolean;
  purchaseCount: number;
}

export interface CertificateLimitCorrection {
  excessCount: number;
  active: boolean;
}

export interface StockRoundState {
  currentActorId: PlayerId;
  consecutivePasses: number;
  turn: StockTurnState;
  soldCorporationIdsByPlayer: Record<PlayerId, CorporationId[]>;
  certificateLimitCorrectionByPlayer: Record<PlayerId, CertificateLimitCorrection | null>;
  pendingPrivateTrade: PendingPrivateTrade | null;
}

export interface OperatingShellState {
  operatingOrder: CorporationId[];
  currentIndex: number;
  currentCorporationId: CorporationId | null;
  stopAfterShell: boolean;
}

export interface GameState {
  id: string;
  version: number;
  round: "privateAuction" | "stock" | "operatingShell" | "milestoneStopped";
  roundNumber: number;
  isFirstStockRound: boolean;
  playerOrder: PlayerId[];
  corporationOrder: CorporationId[];
  players: Record<PlayerId, PlayerState>;
  corporations: Record<CorporationId, CorporationState>;
  certificates: Record<CertificateId, Certificate>;
  privates: Record<PrivateId, PrivateState>;
  bankCash: number;
  priorityDealPlayerId: PlayerId;
  lastTransactionPlayerId: PlayerId | null;
  auction: AuctionState | null;
  stock: StockRoundState | null;
  operatingShell: OperatingShellState | null;
  bankBroken: boolean;
  bankObligations: BankObligation[];
  appliedCommandIds: string[];
}
