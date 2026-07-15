import type { AuctionCommand } from "./commands";
import { PAR_VALUES, STOCK_MARKET_COLOR_GRID, STOCK_MARKET_GRID } from "./constants";
import { assertGameInvariants } from "./invariants";
import { payFromBank } from "./ledger";
import type {
  AuctionBid,
  AuctionState,
  BidOffState,
  GameState,
  PlayerId,
  PrivateId,
  StockRoundState,
} from "./model";
import type { CommandResult, DomainEvent, RuleErrorCode } from "./results";

function reject(code: RuleErrorCode, message: string): CommandResult {
  return { ok: false, code, message };
}

function accepted(state: GameState, events: DomainEvent[]): CommandResult {
  assertGameInvariants(state);
  return { ok: true, state, events };
}

function nextPlayer(state: GameState, playerId: PlayerId): PlayerId {
  const index = state.playerOrder.indexOf(playerId);
  return state.playerOrder[(index + 1) % state.playerOrder.length];
}

function privateOrder(state: GameState): PrivateId[] {
  return Object.values(state.privates)
    .sort((left, right) => left.faceValue - right.faceValue || left.id.localeCompare(right.id))
    .map((privateCompany) => privateCompany.id);
}

function availableCash(state: GameState, playerId: PlayerId, excludingPrivateId?: PrivateId): number {
  const locked = Object.entries(state.auction?.lockedByPlayer[playerId] ?? {})
    .filter(([privateId]) => privateId !== excludingPrivateId)
    .reduce((total, [, amount]) => total + amount, 0);
  return (state.players[playerId]?.cash ?? 0) - locked;
}

function withAuction(state: GameState, auction: AuctionState): GameState {
  return { ...state, auction };
}

function releasePrivateLocks(
  auction: AuctionState,
  privateId: PrivateId,
): AuctionState["lockedByPlayer"] {
  return Object.fromEntries(
    Object.entries(auction.lockedByPlayer).map(([playerId, locks]) => {
      const remaining = { ...locks };
      delete remaining[privateId];
      return [playerId, remaining];
    }),
  );
}

function transferPrivate(
  state: GameState,
  privateId: PrivateId,
  buyerId: PlayerId,
  price: number,
): GameState {
  const buyer = state.players[buyerId];
  const privateCompany = state.privates[privateId];
  if (!buyer || !privateCompany) throw new Error("Auction transfer references an unknown entity");

  let certificates = state.certificates;
  if (privateId === "CA") {
    const certificate = state.certificates["PRR-10-1"];
    certificates = {
      ...certificates,
      [certificate.id]: {
        ...certificate,
        saleRestrictedUntilCorporationParred: "PRR",
        location: { type: "player", playerId: buyerId },
      },
    };
  } else if (privateId === "BO") {
    const certificate = state.certificates["B&O-president"];
    certificates = {
      ...certificates,
      [certificate.id]: { ...certificate, location: { type: "player", playerId: buyerId } },
    };
  }

  return {
    ...state,
    players: { ...state.players, [buyerId]: { ...buyer, cash: buyer.cash - price } },
    privates: {
      ...state.privates,
      [privateId]: {
        ...privateCompany,
        purchasePrice: price,
        location: { type: "player", playerId: buyerId },
      },
    },
    certificates,
    bankCash: state.bankCash + price,
    lastTransactionPlayerId: buyerId,
  };
}

function createStockRound(state: GameState, actorId: PlayerId): StockRoundState {
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

function enterStockRound(state: GameState, finalBuyerId: PlayerId): GameState {
  const actorId = nextPlayer(state, finalBuyerId);
  return {
    ...state,
    round: "stock",
    auction: null,
    stock: createStockRound(state, actorId),
  };
}

function redMarketPosition(parPrice: number): { row: number; column: number; stackIndex: number } {
  for (let row = 0; row < STOCK_MARKET_GRID.length; row += 1) {
    for (let column = 0; column < STOCK_MARKET_GRID[row].length; column += 1) {
      if (STOCK_MARKET_COLOR_GRID[row][column] === "red"
        && Number(STOCK_MARKET_GRID[row][column]) === parPrice) {
        return { row, column, stackIndex: 0 };
      }
    }
  }
  throw new Error(`No red market space for par ${parPrice}`);
}

function startBidOff(state: GameState, privateId: PrivateId, bids: AuctionBid[]): GameState {
  const auction = state.auction!;
  const sorted = [...bids].sort((left, right) => right.amount - left.amount);
  const standing = sorted[0];
  const participants = state.playerOrder.filter((playerId) =>
    bids.some((bid) => bid.playerId === playerId));
  let actorId = nextPlayer(state, standing.playerId);
  while (!participants.includes(actorId) || actorId === standing.playerId) {
    actorId = nextPlayer(state, actorId);
  }
  const bidOff: BidOffState = {
    privateId,
    participantIds: participants,
    passedPlayerIds: [],
    currentActorId: actorId,
    standingBid: standing.amount,
    standingBidderId: standing.playerId,
  };
  return withAuction(state, { ...auction, bidOff, currentActorId: actorId });
}

function nextBidOffActor(state: GameState, bidOff: BidOffState, after: PlayerId): PlayerId {
  let candidate = nextPlayer(state, after);
  while (candidate === bidOff.standingBidderId
    || !bidOff.participantIds.includes(candidate)
    || bidOff.passedPlayerIds.includes(candidate)) {
    candidate = nextPlayer(state, candidate);
  }
  return candidate;
}

function continueAfterPurchase(
  state: GameState,
  purchasedPrivateId: PrivateId,
  buyerId: PlayerId,
  resumeAfterPlayerId: PlayerId,
  events: DomainEvent[],
): CommandResult {
  const order = privateOrder(state);
  const nextPrivateId = order[order.indexOf(purchasedPrivateId) + 1];
  if (!nextPrivateId) {
    if (purchasedPrivateId === "BO") {
      return accepted({
        ...state,
        auction: {
          ...state.auction!,
          currentActorId: buyerId,
          currentPrivateId: purchasedPrivateId,
          consecutivePasses: 0,
          bidOff: null,
          pendingBOParPlayerId: buyerId,
        },
      }, events);
    }
    return accepted(enterStockRound(state, buyerId), events);
  }

  const bids = state.auction!.bidsByPrivate[nextPrivateId] ?? [];
  if (bids.length === 0) {
    return accepted(withAuction(state, {
      ...state.auction!,
      currentActorId: nextPlayer(state, resumeAfterPlayerId),
      currentPrivateId: nextPrivateId,
      consecutivePasses: 0,
      bidOff: null,
    }), events);
  }
  if (bids.length > 1) {
    return accepted(startBidOff(state, nextPrivateId, bids), events);
  }

  const bid = bids[0];
  let nextState = transferPrivate(state, nextPrivateId, bid.playerId, bid.amount);
  nextState = withAuction(nextState, {
    ...nextState.auction!,
    lockedByPlayer: releasePrivateLocks(nextState.auction!, nextPrivateId),
    bidsByPrivate: { ...nextState.auction!.bidsByPrivate, [nextPrivateId]: [] },
  });
  const nextEvents = [...events, {
    type: "auction.privatePurchased",
    message: `${nextState.players[bid.playerId].name} bought ${nextState.privates[nextPrivateId].name}`,
    data: { playerId: bid.playerId, privateId: nextPrivateId, amount: bid.amount },
  }];
  return continueAfterPurchase(
    nextState,
    nextPrivateId,
    bid.playerId,
    resumeAfterPlayerId,
    nextEvents,
  );
}

function buyOffered(state: GameState, command: AuctionCommand): CommandResult {
  const auction = state.auction!;
  const privateCompany = state.privates[auction.currentPrivateId];
  const price = privateCompany.offeredPrice;
  if (availableCash(state, command.actorId) < price) {
    return reject("INSUFFICIENT_AVAILABLE_CASH", "Insufficient available cash");
  }
  let nextState = transferPrivate(state, privateCompany.id, command.actorId, price);
  nextState = withAuction(nextState, { ...nextState.auction!, consecutivePasses: 0 });
  return continueAfterPurchase(nextState, privateCompany.id, command.actorId, command.actorId, [{
    type: "auction.privatePurchased",
    message: `${nextState.players[command.actorId].name} bought ${privateCompany.name}`,
    data: { playerId: command.actorId, privateId: privateCompany.id, amount: price },
  }]);
}

function placeAdvanceBid(state: GameState, command: Extract<AuctionCommand, { type: "auction.placeAdvanceBid" }>): CommandResult {
  const auction = state.auction!;
  const target = state.privates[command.payload.privateId];
  const order = privateOrder(state);
  if (!target || target.location.type !== "bank"
    || order.indexOf(target.id) <= order.indexOf(auction.currentPrivateId)) {
    return reject("ACTION_NOT_ALLOWED_IN_ROUND", "Advance bids are only allowed on later privates");
  }
  if ((auction.bidsByPrivate[target.id] ?? []).some((bid) => bid.playerId === command.actorId)) {
    return reject("DUPLICATE_ADVANCE_BID", "A player may bid only once on a private");
  }
  const existingHigh = Math.max(target.faceValue, ...(
    auction.bidsByPrivate[target.id] ?? []).map((bid) => bid.amount));
  if (!Number.isInteger(command.payload.amount) || command.payload.amount < existingHigh + 5) {
    return reject("BID_INCREMENT_TOO_SMALL", "Advance bid must raise by at least $5");
  }
  if (availableCash(state, command.actorId) < command.payload.amount) {
    return reject("INSUFFICIENT_AVAILABLE_CASH", "Insufficient available cash");
  }
  const bid: AuctionBid = {
    playerId: command.actorId,
    privateId: target.id,
    amount: command.payload.amount,
  };
  const nextAuction: AuctionState = {
    ...auction,
    currentActorId: nextPlayer(state, command.actorId),
    consecutivePasses: 0,
    bidsByPrivate: {
      ...auction.bidsByPrivate,
      [target.id]: [...(auction.bidsByPrivate[target.id] ?? []), bid],
    },
    lockedByPlayer: {
      ...auction.lockedByPlayer,
      [command.actorId]: {
        ...auction.lockedByPlayer[command.actorId],
        [target.id]: command.payload.amount,
      },
    },
  };
  return accepted(withAuction(state, nextAuction), [{
    type: "auction.advanceBidPlaced",
    message: `${state.players[command.actorId].name} bid $${command.payload.amount}`,
    data: { playerId: command.actorId, privateId: target.id, amount: command.payload.amount },
  }]);
}

function raiseBid(state: GameState, command: Extract<AuctionCommand, { type: "auction.raiseBid" }>): CommandResult {
  const auction = state.auction!;
  const bidOff = auction.bidOff!;
  if (!Number.isInteger(command.payload.amount) || command.payload.amount < bidOff.standingBid + 5) {
    return reject("BID_INCREMENT_TOO_SMALL", "Bid must raise by at least $5");
  }
  if (availableCash(state, command.actorId, bidOff.privateId) < command.payload.amount) {
    return reject("INSUFFICIENT_AVAILABLE_CASH", "Insufficient available cash");
  }
  const raised: BidOffState = {
    ...bidOff,
    standingBid: command.payload.amount,
    standingBidderId: command.actorId,
  };
  raised.currentActorId = nextBidOffActor(state, raised, command.actorId);
  const nextAuction: AuctionState = {
    ...auction,
    currentActorId: raised.currentActorId,
    bidOff: raised,
    lockedByPlayer: {
      ...auction.lockedByPlayer,
      [command.actorId]: {
        ...auction.lockedByPlayer[command.actorId],
        [bidOff.privateId]: command.payload.amount,
      },
    },
  };
  return accepted(withAuction(state, nextAuction), [{
    type: "auction.bidRaised",
    message: `${state.players[command.actorId].name} raised to $${command.payload.amount}`,
    data: { playerId: command.actorId, privateId: bidOff.privateId, amount: command.payload.amount },
  }]);
}

function resolveBidOff(state: GameState, bidOff: BidOffState): CommandResult {
  const auction = state.auction!;
  let nextState = transferPrivate(
    state,
    bidOff.privateId,
    bidOff.standingBidderId,
    bidOff.standingBid,
  );
  nextState = withAuction(nextState, {
    ...nextState.auction!,
    bidOff: null,
    bidsByPrivate: { ...auction.bidsByPrivate, [bidOff.privateId]: [] },
    lockedByPlayer: releasePrivateLocks(auction, bidOff.privateId),
  });
  return continueAfterPurchase(
    nextState,
    bidOff.privateId,
    bidOff.standingBidderId,
    state.lastTransactionPlayerId ?? bidOff.standingBidderId,
    [{
      type: "auction.privatePurchased",
      message: `${state.players[bidOff.standingBidderId].name} won ${state.privates[bidOff.privateId].name}`,
      data: {
        playerId: bidOff.standingBidderId,
        privateId: bidOff.privateId,
        amount: bidOff.standingBid,
      },
    }],
  );
}

function closeFailedAuctionRound(state: GameState): CommandResult {
  const auction = state.auction!;
  const transactionPlayerId = state.lastTransactionPlayerId;
  const priorityDealPlayerId = transactionPlayerId
    ? nextPlayer(state, transactionPlayerId)
    : state.priorityDealPlayerId;
  let nextState: GameState = {
    ...state,
    roundNumber: state.roundNumber + 1,
    isFirstStockRound: false,
    priorityDealPlayerId,
    lastTransactionPlayerId: null,
    auction: {
      ...auction,
      currentActorId: priorityDealPlayerId,
      consecutivePasses: 0,
      bidOff: null,
    },
  };
  for (const privateCompany of Object.values(nextState.privates)) {
    if (privateCompany.location.type === "player") {
      nextState = payFromBank(
        nextState,
        { type: "player", playerId: privateCompany.location.playerId },
        privateCompany.revenue,
        "privateIncome",
      );
    }
  }
  if (nextState.bankBroken) {
    nextState = { ...nextState, round: "milestoneStopped", auction: null };
  }
  return accepted(nextState, [{
    type: "auction.roundClosed",
    message: nextState.bankBroken ? "The Bank is exhausted" : "The private auction continues",
    data: { roundNumber: nextState.roundNumber, bankBroken: nextState.bankBroken },
  }]);
}

function passNormalAuction(state: GameState, command: AuctionCommand): CommandResult {
  const auction = state.auction!;
  const passes = auction.consecutivePasses + 1;
  if (passes < state.playerOrder.length) {
    return accepted(withAuction(state, {
      ...auction,
      currentActorId: nextPlayer(state, command.actorId),
      consecutivePasses: passes,
    }), []);
  }

  const offered = state.privates[auction.currentPrivateId];
  if (offered.id !== "SVN") return closeFailedAuctionRound(state);

  const firstOfferedPlayerId = nextPlayer(state, command.actorId);
  if (offered.offeredPrice === 5) {
    let nextState = transferPrivate(state, offered.id, firstOfferedPlayerId, 0);
    nextState = {
      ...nextState,
      roundNumber: state.roundNumber + 1,
      isFirstStockRound: false,
      auction: { ...nextState.auction!, consecutivePasses: 0 },
    };
    return continueAfterPurchase(
      nextState,
      offered.id,
      firstOfferedPlayerId,
      firstOfferedPlayerId,
      [{
        type: "auction.privatePurchased",
        message: `${state.players[firstOfferedPlayerId].name} received ${offered.name} for free`,
        data: { playerId: firstOfferedPlayerId, privateId: offered.id, amount: 0 },
      }],
    );
  }

  const reduced = { ...offered, offeredPrice: offered.offeredPrice - 5 };
  const nextState: GameState = {
    ...state,
    roundNumber: state.roundNumber + 1,
    isFirstStockRound: false,
    lastTransactionPlayerId: null,
    privates: { ...state.privates, [offered.id]: reduced },
    auction: {
      ...auction,
      currentActorId: state.priorityDealPlayerId,
      consecutivePasses: 0,
    },
  };
  return accepted(nextState, [{
    type: "auction.priceReduced",
    message: `${offered.name} is now offered for $${reduced.offeredPrice}`,
    data: { privateId: offered.id, amount: reduced.offeredPrice },
  }]);
}

function passBidOff(state: GameState, command: AuctionCommand): CommandResult {
  const bidOff = state.auction!.bidOff!;
  const passedPlayerIds = [...bidOff.passedPlayerIds, command.actorId];
  const remaining = bidOff.participantIds.filter((playerId) => !passedPlayerIds.includes(playerId));
  const nextBidOff = { ...bidOff, passedPlayerIds };
  if (remaining.length === 1) return resolveBidOff(state, nextBidOff);
  nextBidOff.currentActorId = nextBidOffActor(state, nextBidOff, command.actorId);
  return accepted(withAuction(state, {
    ...state.auction!,
    currentActorId: nextBidOff.currentActorId,
    bidOff: nextBidOff,
  }), []);
}

function setBOPar(state: GameState, command: Extract<AuctionCommand, { type: "auction.setBOPar" }>): CommandResult {
  if (!(PAR_VALUES as readonly number[]).includes(command.payload.parPrice)) {
    return reject("INVALID_PAR_PRICE", "Invalid B&O par price");
  }
  const corporation = state.corporations["B&O"];
  const basePosition = redMarketPosition(command.payload.parPrice);
  const stackIndex = Object.values(state.corporations)
    .filter((candidate) => candidate.market?.row === basePosition.row
      && candidate.market.column === basePosition.column)
    .reduce((highest, candidate) => Math.max(highest, candidate.market!.stackIndex + 1), 0);
  const nextState: GameState = {
    ...state,
    corporations: {
      ...state.corporations,
      "B&O": {
        ...corporation,
        lifecycle: "parred",
        parPrice: command.payload.parPrice,
        market: { ...basePosition, stackIndex },
      },
    },
    auction: { ...state.auction!, pendingBOParPlayerId: null },
  };
  return accepted(enterStockRound(nextState, command.actorId), [{
    type: "corporation.parred",
    message: `B&O was parred at $${command.payload.parPrice}`,
    data: { corporationId: "B&O", parPrice: command.payload.parPrice },
  }]);
}

export function executeAuction(state: GameState, command: AuctionCommand): CommandResult {
  if (state.round !== "privateAuction" || !state.auction) {
    return reject("ACTION_NOT_ALLOWED_IN_ROUND", "The private auction is not active");
  }
  const pendingBOPlayerId = state.auction.pendingBOParPlayerId;
  if (pendingBOPlayerId) {
    if (command.type !== "auction.setBOPar" || command.actorId !== pendingBOPlayerId) {
      return reject("ACTION_NOT_ALLOWED_IN_ROUND", "B&O par must be selected first");
    }
    return setBOPar(state, command);
  }

  const expectedActor = state.auction.bidOff?.currentActorId ?? state.auction.currentActorId;
  if (command.actorId !== expectedActor) {
    return reject("NOT_CURRENT_PLAYER", "Only the current auction player may act");
  }
  if (command.type === "auction.setBOPar") {
    return reject("ACTION_NOT_ALLOWED_IN_ROUND", "B&O par is not pending");
  }
  if (state.auction.bidOff) {
    if (command.type === "auction.raiseBid") return raiseBid(state, command);
    if (command.type === "auction.pass") return passBidOff(state, command);
    return reject("ACTION_NOT_ALLOWED_IN_ROUND", "Only raising or passing is allowed in a bid-off");
  }

  switch (command.type) {
    case "auction.buyOfferedPrivate":
      return buyOffered(state, command);
    case "auction.placeAdvanceBid":
      return placeAdvanceBid(state, command);
    case "auction.pass":
      return passNormalAuction(state, command);
    case "auction.raiseBid":
      return reject("ACTION_NOT_ALLOWED_IN_ROUND", "No bid-off is active");
  }
}
