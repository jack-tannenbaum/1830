import { getMarketZone } from "./market";
import type {
  Certificate,
  CorporationId,
  GameState,
  PlayerId,
} from "./model";

export function certificatesForPlayer(state: GameState, playerId: PlayerId): Certificate[] {
  return Object.values(state.certificates).filter(
    (certificate) => certificate.location.type === "player"
      && certificate.location.playerId === playerId,
  );
}

export function ownershipPercent(
  state: GameState,
  corporationId: CorporationId,
  playerId: PlayerId,
): number {
  return certificatesForPlayer(state, playerId)
    .filter((certificate) => certificate.corporationId === corporationId)
    .reduce((total, certificate) => total + certificate.percent, 0);
}

export function poolPercent(state: GameState, corporationId: CorporationId): number {
  return Object.values(state.certificates)
    .filter((certificate) => certificate.corporationId === corporationId
      && certificate.location.type === "bankPool")
    .reduce((total, certificate) => total + certificate.percent, 0);
}

export function soldCertificateCount(state: GameState, corporationId: CorporationId): number {
  return Object.values(state.certificates).filter(
    (certificate) => certificate.corporationId === corporationId
      && certificate.location.type !== "initialOffering",
  ).length;
}

export function countedCertificateTotal(state: GameState, playerId: PlayerId): number {
  const countedStock = certificatesForPlayer(state, playerId).filter((certificate) => {
    const zone = getMarketZone(state, certificate.corporationId);
    return zone !== "yellow" && zone !== "brown";
  }).length;

  const openPrivates = Object.values(state.privates).filter(
    (privateCompany) => privateCompany.location.type === "player"
      && privateCompany.location.playerId === playerId,
  ).length;

  return countedStock + openPrivates;
}
