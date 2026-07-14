import type { CertificateId, CorporationId, PlayerId, PrivateId } from "./model";

export interface CommandEnvelope<T extends string, P> {
  id: string;
  gameId: string;
  actorId: string;
  expectedVersion: number;
  type: T;
  payload: P;
}

type C<T extends string, P> = CommandEnvelope<T, P>;

export type GameCommand =
  | C<"game.create", { playerNames: string[]; placeOrder: number[] }>
  | C<"auction.buyOfferedPrivate", Record<string, never>>
  | C<"auction.placeAdvanceBid", { privateId: PrivateId; amount: number }>
  | C<"auction.raiseBid", { amount: number }>
  | C<"auction.pass", Record<string, never>>
  | C<"auction.setBOPar", { parPrice: number }>
  | C<"stock.startCorporation", { corporationId: CorporationId; parPrice: number }>
  | C<"stock.buyCertificate", { certificateId: CertificateId }>
  | C<"stock.sellCertificates", { certificateIds: CertificateId[] }>
  | C<"stock.proposePrivateTrade", {
      privateId: PrivateId;
      buyerId: PlayerId;
      sellerId: PlayerId;
      price: number;
    }>
  | C<"stock.respondPrivateTrade", { accepted: boolean }>
  | C<"stock.finishTurn", Record<string, never>>
  | C<"stock.pass", Record<string, never>>
  | C<"operatingShell.endCorporationTurn", { corporationId: CorporationId }>;

export type AuctionCommand = Extract<GameCommand, { type: `auction.${string}` }>;
export type StockCommand = Extract<GameCommand, { type: `stock.${string}` }>;
