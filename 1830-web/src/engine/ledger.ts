import type { BankObligation, GameState } from "./model";

export function payFromBank(
  state: GameState,
  recipient: BankObligation["recipient"],
  amount: number,
  reason: BankObligation["reason"],
): GameState {
  if (!Number.isFinite(amount) || amount < 0 || !Number.isInteger(amount)) {
    throw new Error(`Invalid Bank payment amount ${amount}`);
  }

  const paid = Math.min(state.bankCash, amount);
  const unpaid = amount - paid;
  let players = state.players;
  let corporations = state.corporations;

  if (recipient.type === "player") {
    const player = state.players[recipient.playerId];
    if (!player) throw new Error(`Unknown payment recipient player ${recipient.playerId}`);
    players = {
      ...state.players,
      [player.id]: { ...player, cash: player.cash + paid },
    };
  } else {
    const corporation = state.corporations[recipient.corporationId];
    if (!corporation) {
      throw new Error(`Unknown payment recipient corporation ${recipient.corporationId}`);
    }
    corporations = {
      ...state.corporations,
      [corporation.id]: { ...corporation, treasury: corporation.treasury + paid },
    };
  }

  const bankObligations = unpaid === 0
    ? state.bankObligations
    : [
      ...state.bankObligations,
      {
        id: `bank-obligation-${state.version}-${state.bankObligations.length}`,
        recipient,
        amount: unpaid,
        reason,
      },
    ];
  const bankCash = state.bankCash - paid;

  return {
    ...state,
    players,
    corporations,
    bankCash,
    bankObligations,
    bankBroken: state.bankBroken || bankCash === 0 || unpaid > 0,
  };
}
