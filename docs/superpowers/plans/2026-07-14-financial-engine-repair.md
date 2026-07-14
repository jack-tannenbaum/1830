# 1830 Financial Engine Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing mutable auction and stock logic with a deterministic, multiplayer-ready engine supporting setup, private auctions, repeated Stock Rounds, private trades, presidency, flotation, a labeled Operating Round shell, versioned saves, and snapshot undo.

**Architecture:** Pure TypeScript engine modules own normalized state and validate serializable commands. A thin Zustand adapter owns persistence, undo, and notifications; existing React screens consume selectors and dispatch commands. Work is divided into dependency-aware waves so tasks with disjoint file ownership can be implemented concurrently and merged at explicit integration gates.

**Tech Stack:** React 19, TypeScript 5.8, Zustand 5, Vite 7, Vitest, ESLint, localStorage.

---

## Source documents

- Design: `docs/superpowers/specs/2026-07-14-engine-foundation-auction-stock-design.md`
- Rules: `docs/rules/1830-rules-authoritative.md`
- Existing app: `1830-web/src`

The exact saved rules win over current behavior. The design's explicit decisions
fill only the missing Table 3/Table 5 values and initial Priority Deal gap.

## Execution rules for parallel waves

1. Create an isolated worktree before execution; do not implement on the docs
   branch.
2. Every concurrently launched task gets its own worktree and branch from the
   current integration-gate commit, for example:

   ```bash
   git worktree add ../1830-task-4 -b feat/financial-engine-task-4 HEAD
   ```

   Cherry-pick the task commit into `feat/financial-engine`, then remove the task
   worktree. Sequential tasks may run directly on the integration branch.
3. Tasks in the same wave may run concurrently only when their listed file
   ownership does not overlap.
4. Merge tasks in numeric order at each integration gate, run the gate commands,
   and fix integration failures before launching the next wave.
5. Do not create alternative engine types inside feature branches. All workers
   import contracts from Wave 1.
6. Do not edit the legacy `src/types/game.ts` or `src/store/gameStore.ts` until
   their assigned migration tasks.
7. Leave `.DS_Store` files untracked and add them to `.gitignore` during Wave 1.

## Wave map

| Wave | Parallel tasks | Depends on | Gate |
|---|---|---|---|
| 0 | Task 0 | Approved spec | Clean baseline/build information |
| 1 | Task 1 | Wave 0 | Engine contracts and test harness compile |
| 2 | Tasks 2 and 4, then Tasks 3 and 5 | Wave 1 | Setup/market foundations feed auction and save codec |
| 3 | Tasks 7 and 8, then Task 6 | Wave 2 | Corporation/round primitives and selectors feed the Stock reducer |
| 4 | Task 9, then Task 10 | Wave 3 | Dispatcher and Zustand adapter pass engine scenarios |
| 5 | Tasks 11, 12, 13 | Wave 4 | Setup, auction, stock, and shell UI build together |
| 6 | Task 14, then Task 15 | Wave 5 | Legacy removal, full verification, manual walkthrough |

---

## Wave 0 — Baseline

### Task 0: Create the implementation worktree and capture the baseline

**Files:**
- No source changes

- [ ] **Step 1: Create the worktree from the approved documentation branch**

```bash
git worktree add ../1830-financial-engine -b feat/financial-engine docs/engine-foundation-spec
cd ../1830-financial-engine
```

Expected: a clean worktree on `feat/financial-engine` containing spec commit
`91c4e52` or its pushed equivalent.

- [ ] **Step 2: Record tool versions and install dependencies**

```bash
node --version
npm --version
cd 1830-web
npm ci
```

Expected: Node and npm print versions; `npm ci` exits 0.

- [ ] **Step 3: Run the existing quality commands**

```bash
npm run build
npm run lint
```

Expected: record the exact baseline result. Existing failures are documented in
the task notes but are not silently attributed to later work.

---

## Wave 1 — Shared contracts (sequential foundation)

### Task 1: Add Vitest, normalized contracts, constants, and test helpers

**Files:**
- Modify: `1830-web/package.json`
- Modify: `1830-web/package-lock.json`
- Modify: `.gitignore`
- Create: `1830-web/src/engine/constants.ts`
- Create: `1830-web/src/engine/model.ts`
- Create: `1830-web/src/engine/commands.ts`
- Create: `1830-web/src/engine/results.ts`
- Create: `1830-web/src/engine/testing.ts`
- Create: `1830-web/src/engine/setup.scenario.test.ts`

- [ ] **Step 1: Add the single test dependency and scripts**

Run:

```bash
cd 1830-web
npm install --save-dev vitest
```

Set scripts in `package.json` to:

```json
{
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Do not add React Testing Library or browser test dependencies.

- [ ] **Step 2: Ignore macOS metadata**

Add to `.gitignore`:

```gitignore
.DS_Store
**/.DS_Store
```

- [ ] **Step 3: Define immutable engine constants**

Create `src/engine/constants.ts` with these exported values:

```ts
export const TOTAL_GAME_CASH = 12_000;
export const DISTRIBUTED_PLAYER_CASH = 2_400;
export const STARTING_CASH = { 3: 800, 4: 600, 5: 480, 6: 400 } as const;
export const CERTIFICATE_LIMIT = { 3: 20, 4: 16, 5: 13, 6: 11 } as const;
export const PAR_VALUES = [67, 71, 76, 82, 90, 100] as const;
export const SAVE_SCHEMA_VERSION = 2;
export const ENGINE_VERSION = "financial-core-v1";
export const SAVE_KEY = "1830-game-v2";
```

Move the existing `STOCK_MARKET_GRID` and `STOCK_MARKET_COLOR_GRID` arrays from
`src/types/constants.ts` into this module unchanged and export them. Later engine
modules and the existing stock-market display must import this single copy; do
not maintain parallel market grids.

- [ ] **Step 4: Define the canonical model**

Create `src/engine/model.ts`. Use string aliases for IDs and records rather than
Maps so every state is JSON-serializable:

```ts
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
  recipient: { type: "player"; playerId: PlayerId } |
    { type: "corporation"; corporationId: CorporationId };
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
```

- [ ] **Step 5: Define the closed command union and result types**

Create `src/engine/commands.ts` with a discriminated union whose `type` values
match the design. Every member includes:

```ts
export interface CommandEnvelope<T extends string, P> {
  id: string;
  gameId: string;
  actorId: string;
  expectedVersion: number;
  type: T;
  payload: P;
}
```

Define the exact union:

```ts
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
```

Create `src/engine/results.ts`:

```ts
export type RuleErrorCode =
  | "VERSION_CONFLICT" | "DUPLICATE_COMMAND" | "NOT_CURRENT_PLAYER"
  | "ACTION_NOT_ALLOWED_IN_ROUND" | "INSUFFICIENT_AVAILABLE_CASH"
  | "BID_INCREMENT_TOO_SMALL" | "DUPLICATE_ADVANCE_BID"
  | "CERTIFICATE_LIMIT_EXCEEDED" | "CORPORATION_HOLDING_LIMIT_EXCEEDED"
  | "POOL_LIMIT_EXCEEDED" | "PRESIDENCY_CANNOT_TRANSFER"
  | "CANNOT_BUY_AFTER_SELLING" | "STOCK_TURN_ALREADY_COMPLETE"
  | "PRIVATE_TRADE_NOT_PERMITTED" | "INVALID_PAR_PRICE";

export interface DomainEvent {
  type: string;
  message: string;
  data: Record<string, string | number | boolean>;
}

export type CommandResult =
  | { ok: true; state: GameState; events: DomainEvent[] }
  | { ok: false; code: RuleErrorCode; message: string; details?: Record<string, string | number | boolean> };
```

- [ ] **Step 6: Create the scenario test harness and an intentionally failing setup test**

In `setup.scenario.test.ts`, add only the first of the seven approved scenarios:

```ts
import { describe, expect, it } from "vitest";
import { createGame } from "./setup";

describe("financial engine scenarios", () => {
  it("1. distributes exactly $2,400 for every supported player count", () => {
    for (const count of [3, 4, 5, 6] as const) {
      const names = Array.from({ length: count }, (_, i) => `P${i + 1}`);
      const state = createGame({ gameId: `g-${count}`, playerNames: names, placeOrder: names.map((_, i) => i) });
      expect(Object.values(state.players).map(player => player.cash)).toEqual(
        Array(count).fill(2_400 / count),
      );
      expect(state.bankCash).toBe(9_600);
      expect(state.priorityDealPlayerId).toBe(state.playerOrder[0]);
    }
  });
});
```

- [ ] **Step 7: Run the test to verify the contract fails before setup exists**

```bash
npm test -- src/engine/setup.scenario.test.ts
```

Expected: FAIL because `./setup` does not exist.

- [ ] **Step 8: Commit the shared foundation**

```bash
git add .gitignore 1830-web/package.json 1830-web/package-lock.json 1830-web/src/engine
git commit -m "test: define financial engine contracts"
```

### Wave 1 integration gate

```bash
cd 1830-web
npx tsc --noEmit -p tsconfig.app.json
```

Expected: only the intentional missing `./setup` test import may fail. Merge this
commit before launching Wave 2 so every worker uses identical contracts.

---

## Wave 2 — Independent engine primitives

### Task 2: Implement deterministic setup and certificate creation

**Parallel-safe ownership:** `src/engine/setup.ts`, `setup.scenario.test.ts`.

**Files:**
- Create: `1830-web/src/engine/setup.ts`
- Modify: `1830-web/src/engine/setup.scenario.test.ts`

- [ ] **Step 1: Implement `createGame` against the existing failing scenario**

Create corporation and private seed arrays inside `setup.ts`. Generate nine
certificates per corporation using stable IDs such as `PRR-president` and
`PRR-10-1` through `PRR-10-8`. Return fresh records on every call.
Initialize `saleRestrictedUntilCorporationParred` to `null` on every certificate;
Task 3 sets it only on the PRR certificate granted by C&A.

```ts
export interface CreateGameInput {
  gameId: string;
  playerNames: string[];
  placeOrder: number[];
}

export function createGame(input: CreateGameInput): GameState {
  if (input.playerNames.length < 3 || input.playerNames.length > 6) {
    throw new Error("1830 requires 3-6 players");
  }
  const playerOrder = input.placeOrder.map(index => `player-${index + 1}`);
  const cash = STARTING_CASH[input.playerNames.length as 3 | 4 | 5 | 6];
  // Build records without mutating exported seed data.
  return buildInitialState(input, playerOrder, cash);
}
```

`buildInitialState` must set round `privateAuction`, the first actor to the lowest
place-card player, Bank cash 9,600, every private Bank-owned, every certificate in
its Initial Offering, and Priority Deal to that same player.

- [ ] **Step 2: Add setup assertions for normalized ownership**

Extend scenario 1:

```ts
expect(Object.values(state.certificates)).toHaveLength(72);
expect(Object.values(state.certificates).filter(c => c.isPresident)).toHaveLength(8);
expect(Object.values(state.privates).every(p => p.location.type === "bank")).toBe(true);
expect(JSON.parse(JSON.stringify(state))).toEqual(state);
```

- [ ] **Step 3: Run the setup scenario**

```bash
npm test -- src/engine/setup.scenario.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add 1830-web/src/engine/setup.ts 1830-web/src/engine/setup.scenario.test.ts
git commit -m "feat: create normalized 1830 setup"
```

### Task 3: Implement private-auction transitions

**Dependency:** Begin after Tasks 2 and 4 are merged. May run concurrently with
Task 5; owns `auction.ts` and `auction.scenario.test.ts` exclusively.

**Files:**
- Create: `1830-web/src/engine/auction.ts`
- Create: `1830-web/src/engine/auction.scenario.test.ts`

- [ ] **Step 1: Add scenarios 2 and 3 as failing tests**

Use the public reducer below and assert these exact checkpoints:

```ts
const bought = executeAuction(state, {
  id: "a1", gameId: state.id, actorId: "player-1", expectedVersion: 0,
  type: "auction.buyOfferedPrivate", payload: {},
});
expect(bought.ok).toBe(true);
if (!bought.ok) throw new Error(bought.message);
expect(bought.state.players["player-1"].cash).toBe(780);
expect(bought.state.bankCash).toBe(9_620);

const bid = executeAuction(bought.state, {
  id: "a2", gameId: state.id, actorId: "player-2", expectedVersion: 0,
  type: "auction.placeAdvanceBid", payload: { privateId: "DH", amount: 75 },
});
expect(bid.ok).toBe(true);
if (!bid.ok) throw new Error(bid.message);
expect(bid.state.auction?.lockedByPlayer["player-2"]["DH"]).toBe(75);

const duplicate = executeAuction(bid.state, {
  id: "a3", gameId: state.id, actorId: "player-2", expectedVersion: 0,
  type: "auction.placeAdvanceBid", payload: { privateId: "DH", amount: 80 },
});
expect(duplicate).toMatchObject({ ok: false, code: "DUPLICATE_ADVANCE_BID" });
```

Scenario 3 must pass every player around SVN at 20, 15, 10, and 5, assert a
free assignment after the $5 failure, then force an all-pass round on a later
private and assert private income plus Priority Deal retention/reassignment.
It must also assert that closing the first auction Stock Round increments
`roundNumber` and permanently changes `isFirstStockRound` to `false`, even though
corporation stock was not yet available.

- [ ] **Step 2: Run scenarios 2-3 and verify failure**

```bash
npm test -- src/engine/auction.scenario.test.ts
```

Expected: FAIL because `auction.ts` does not exist.

- [ ] **Step 3: Implement one immutable auction reducer**

Export:

```ts
export function executeAuction(state: GameState, command: AuctionCommand): CommandResult;
```

Implement a switch for buy, advance bid, raise, pass, and B&O par. Each accepted
path:

1. clones only touched records;
2. validates the current auction actor or active bid-off participant;
3. calculates available cash as player cash minus all locks;
4. transfers ownership and Bank payment atomically;
5. releases every resolved bidder's exact lock;
6. resolves chained single bids before returning;
7. applies the rules' resume player;
8. closes/restarts an auction Stock Round with correct Priority Deal.

Every auction-round closure increments `roundNumber`; closure of round one sets
`isFirstStockRound` to `false`. Do not tie that flag to the sale of the final
private. Use the shared `payFromBank` from Task 4 for failed-auction private
income so Bank exhaustion records obligations and the required stop-after-shell
state instead of making Bank cash negative.

When the final private is resolved and ordinary stock dealing begins, create the
first `StockRoundState` with a null certificate-limit correction entry for every
player. Later Stock Rounds do the same after the prior round has proved that no
correction record remains.

When C&A is first purchased, move the exact designated PRR 10% certificate to
that buyer and set its `saleRestrictedUntilCorporationParred` field to `PRR`.
When B&O is purchased, move its president certificate to the buyer, set
`pendingBOParPlayerId`, and accept no further auction/stock action until that
player dispatches `auction.setBOPar` with a legal value. That command places B&O
on the market without charging again and then completes the auction transition.

Do not call Zustand, `Date.now`, `crypto`, or notification helpers.

- [ ] **Step 4: Run scenarios 2-3**

```bash
npm test -- src/engine/auction.scenario.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add 1830-web/src/engine/auction.ts 1830-web/src/engine/auction.scenario.test.ts
git commit -m "feat: implement private auction rules"
```

### Task 4: Implement market and ownership primitives

**Parallel-safe ownership:** `src/engine/market.ts`, `ownership.ts`, `ledger.ts`,
and `invariants.ts`. No scenario-test edits.

**Files:**
- Create: `1830-web/src/engine/market.ts`
- Create: `1830-web/src/engine/ownership.ts`
- Create: `1830-web/src/engine/ledger.ts`
- Create: `1830-web/src/engine/invariants.ts`

- [ ] **Step 1: Implement ownership selectors**

Export pure functions:

```ts
export function certificatesForPlayer(state: GameState, playerId: PlayerId): Certificate[];
export function ownershipPercent(state: GameState, corporationId: CorporationId, playerId: PlayerId): number;
export function poolPercent(state: GameState, corporationId: CorporationId): number;
export function soldCertificateCount(state: GameState, corporationId: CorporationId): number;
export function countedCertificateTotal(state: GameState, playerId: PlayerId): number;
```

`countedCertificateTotal` includes open player-owned privates and applies yellow
and brown market exemptions. Keep zone lookup in `market.ts`.

- [ ] **Step 2: Implement one market movement function**

```ts
export type MarketDirection = "up" | "down" | "left" | "right";

export function moveMarketToken(
  state: GameState,
  corporationId: CorporationId,
  direction: MarketDirection,
): GameState;
```

It follows the existing stock grid, never moves through a null cell, uses the
rules' edge fallback, and recalculates stack indices so the moving token is below
every token already in the destination. Index zero is the top; a moving token
receives `max(existing stackIndex) + 1`. Add `getMarketPrice` and
`getMarketZone`.

- [ ] **Step 3: Implement the shared Bank-payment ledger**

```ts
export function payFromBank(
  state: GameState,
  recipient: BankObligation["recipient"],
  amount: number,
  reason: BankObligation["reason"],
): GameState;
```

Pay `Math.min(state.bankCash, amount)`, credit only that actual cash, record the
unpaid remainder as a non-spendable obligation, and set `bankBroken` when a
remainder exists. Stable obligation IDs use state version plus obligation count;
never use randomness.

- [ ] **Step 4: Implement the six critical invariants**

```ts
export function assertGameInvariants(state: GameState): void {
  assertActualCashTotals12k(state);
  assertCertificateLocations(state);
  assertCorporationSharesTotal100(state);
  assertPresidentCertificatesOutsidePool(state);
  assertPoolAtMost50Percent(state);
  assertNonnegativeCashAndAvailability(state);
}
```

Each helper throws an `Error` containing the violated invariant and relevant ID.
Obligations are excluded from actual cash.

- [ ] **Step 5: Verify these modules type-check**

```bash
npx tsc --noEmit -p tsconfig.app.json
```

Expected: PASS after Wave 2 branches are integrated.

- [ ] **Step 6: Commit**

```bash
git add 1830-web/src/engine/market.ts 1830-web/src/engine/ownership.ts 1830-web/src/engine/ledger.ts 1830-web/src/engine/invariants.ts
git commit -m "feat: add market ownership ledger and invariants"
```

### Task 5: Implement the versioned save codec

**Dependency:** Begin after Task 4 is merged. May run concurrently with Task 3;
owns `src/engine/save.ts` exclusively.

**Files:**
- Create: `1830-web/src/engine/save.ts`

- [ ] **Step 1: Implement strict encode/decode functions**

```ts
export interface SaveEnvelope {
  schemaVersion: 2;
  engineVersion: "financial-core-v1";
  savedAt: string;
  game: GameState;
}

export function encodeSave(game: GameState, savedAt: string): string;
export function decodeSave(raw: string): GameState;
```

`decodeSave` parses JSON, checks the exact schema and engine versions, verifies
required record/array primitives, calls `assertGameInvariants`, and throws
`Unsupported save version` or `Invalid save data` without returning partial
state. It does not read or write localStorage.

- [ ] **Step 2: Type-check the codec**

```bash
npx tsc --noEmit -p tsconfig.app.json
```

Expected: PASS after Task 4 is present.

- [ ] **Step 3: Commit**

```bash
git add 1830-web/src/engine/save.ts
git commit -m "feat: add versioned game save codec"
```

### Wave 2 integration gate

Launch Tasks 2 and 4 concurrently and merge both. Launch Tasks 3 and 5 from that
integrated result and merge both. Then:

```bash
cd 1830-web
npm test -- src/engine/setup.scenario.test.ts src/engine/auction.scenario.test.ts
npx tsc --noEmit -p tsconfig.app.json
```

Expected: scenarios 1-3 PASS and TypeScript PASS.

---

## Wave 3 — Financial rules built on primitives

### Task 6: Implement Stock Round actions, private trades, and turn completion

**Dependency:** Begin after Tasks 7 and 8 are merged. Owns `src/engine/stock.ts`
and `stock.scenario.test.ts` exclusively.

**Files:**
- Create: `1830-web/src/engine/stock.ts`
- Create: `1830-web/src/engine/stock.scenario.test.ts`

- [ ] **Step 1: Add failing scenario 4**

The test must execute and assert this sequence:

1. in a later Stock Round, reject selling C&A's PRR certificate while PRR is
   unstarted;
2. start PRR at $67 and clear that certificate's sale restriction;
3. finish the purchase turn without counting a pass;
4. buy an IPO share at par;
5. sell an exact 10% certificate and remain current actor;
6. buy a different corporation after selling;
7. reject buying the sold corporation;
8. finish the turn;
9. buy the exact Pool certificate at market;
10. prove orange stock bypasses the five-certificate corporation limit, yellow
    stock does not count toward the total limit, and brown stock bypasses both
    limits and the one-purchase rule;
11. propose and accept a $40 private trade during the buyer's turn;
12. pass every player and assert Priority Deal;
13. create an over-limit presidency-loss correction, finish the current turn,
    activate it on that player's next turn, reject a pass, sell the excess, and
    clear the correction;
14. assert every moved token is at the bottom of its destination stack.

Use exact IDs; never assert against an array position.

- [ ] **Step 2: Verify scenario 4 fails**

```bash
npm test -- src/engine/stock.scenario.test.ts
```

Expected: FAIL because `stock.ts` does not exist.

- [ ] **Step 3: Add shared Stock Round guards and turn-state cloning**

Create `executeStock` with a closed switch and reusable guards for round, actor,
pending responder, first-round restrictions, and complete-turn cloning:

```ts
export function executeStock(state: GameState, command: StockCommand): CommandResult;
```

Import `applyPresidencyTransfer`, `updateFloatEligibility`, `payFromBank`, and
`completeStockRound` from Tasks 7's modules. Do not duplicate those rules.

- [ ] **Step 4: Implement corporation start and exact-certificate purchase**

Start validates par, transfers the president certificate, places the market
token, and counts one purchase. Buy reads the certificate's actual location,
charges par for Initial Offering or market for Pool, and enforces cash, total
limit, corporation limit, brown-zone count, and buy-after-sale.

Zone enforcement is explicit:

- White and yellow retain the five-certificate corporation limit.
- Orange removes the per-corporation limit but not the total limit.
- Yellow certificates do not count toward the total limit.
- Brown removes buying and holding limits and permits repeated purchases.

- [ ] **Step 5: Implement atomic multi-corporation sales**

Validate every exact certificate, Pool capacity, presidency feasibility, and the
complete proceeds before changing state. Pay all certificates of a corporation
at its pre-sale price, then move once per 10%. If any requested certificate is
illegal, reject the entire command.

Reject a certificate whose `saleRestrictedUntilCorporationParred` corporation
is still `unstarted`. When that corporation is parred, clear the restriction as
part of the accepted start command.

- [ ] **Step 6: Implement private trade proposal and response**

Proposal validates later Stock Round, active buyer/seller, ownership, price, and
buyer cash plus the buyer's resulting certificate limit. Response accepts only
the named responder. Acceptance transfers cash and ownership atomically;
rejection clears the proposal without marking a transaction.

- [ ] **Step 7: Implement Finish Turn and Pass**

`finishTurn` requires at least one transaction and resets the next player's turn
substate. `pass` requires none, increments consecutive passes, and either advances
or calls `completeStockRound` when all players have passed.

When a presidency exchange creates excess certificates, its correction record is
initially inactive, so the affected player may finish their current turn. At the
start of that player's next Stock Round turn, activate the record. While an
active correction has positive `excessCount`, allow only certificate sales and
reject purchases, private trades, `finishTurn`, and `pass`. Recompute the excess
after each sale; clear the record at zero, after which the rest of that turn may
continue normally.

Apply this order in every financial handler:

1. validate round, command actor, version-independent rule preconditions;
2. validate all IDs and the complete requested transaction;
3. calculate prices and presidency consequences without mutation;
4. transfer exact certificates and cash/obligations;
5. apply one market move per sold 10%;
6. update the turn substate and last transaction actor;
7. run `assertGameInvariants` before returning success.

Normal purchases stop at one; brown-zone purchases may repeat. The first Stock
Round rejects every share sale and every private trade.

- [ ] **Step 8: Run scenario 4**

```bash
npm test -- src/engine/stock.scenario.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add 1830-web/src/engine/stock.ts 1830-web/src/engine/stock.scenario.test.ts
git commit -m "feat: implement stock round transactions"
```

### Task 7: Implement presidency, flotation, capitalization, shell, and Bank break

**Parallel-safe ownership:** `src/engine/corporations.ts`, `rounds.ts`,
and `corporation-rounds.scenario.test.ts`; may run with Task 8.

**Files:**
- Create: `1830-web/src/engine/corporations.ts`
- Create: `1830-web/src/engine/rounds.ts`
- Create: `1830-web/src/engine/corporation-rounds.scenario.test.ts`

- [ ] **Step 1: Add failing scenarios 5 and 6**

Scenario 5 must transfer a presidency by exchanging one president certificate
for two exact 10% certificates, preserve both percentages, reach five sold
certificates/60%, and transfer ten times par only on the first shell entry. It
must leave an over-limit outgoing president in
`certificateLimitCorrectionByPlayer` as inactive without rejecting the
presidency transfer. Scenario 4 in Task 6 owns the subsequent Stock Round timing
and correction behavior.

Scenario 6 must cover a Stock Round with no operating corporation, repeated
shell cycles, private income, Bank cash reaching zero, an unpaid obligation,
completion of the current shell, and final `milestoneStopped` state before
another Stock Round.

- [ ] **Step 2: Verify scenarios 5-6 fail**

```bash
npm test -- src/engine/corporation-rounds.scenario.test.ts
```

Expected: FAIL because corporation/round helpers do not exist.

- [ ] **Step 3: Implement presidency and flotation helpers**

Export `calculatePresident`, `applyPresidencyTransfer`,
`updateFloatEligibility`, and `capitalizeCorporation`. Tie selection walks left
from the outgoing president in `playerOrder`. Capitalization is idempotent and
uses Task 4's `payFromBank` exactly once. When an exchange makes the outgoing
president exceed their total certificate limit, record the exact excess count in
`certificateLimitCorrectionByPlayer` with `active: false` without rejecting the
transfer. Task 6's stock-round turn advancement activates an affected player's
record when that player next becomes the actor; it never activates during the
turn in which the presidency was lost.

- [ ] **Step 4: Implement round completion and the shell**

Export:

```ts
export function completeStockRound(state: GameState): GameState;
export function endOperatingShellTurn(state: GameState, actorId: string): CommandResult;
```

`completeStockRound` applies full-subscription upward movements, assigns/retains
Priority Deal, creates operating order by price/rightmost/topmost, capitalizes
new entrants, pays private income, and skips an empty shell. If `bankBroken`, it
sets `stopAfterShell`; after the last shell turn—or immediately for an empty
shell—it enters `milestoneStopped` instead of another Stock Round.

For shared market spaces, lower `stackIndex` operates first. A token moved into
the space receives the largest index and therefore operates last among tokens
already there.

- [ ] **Step 5: Run scenarios 5-6 and all current scenarios**

```bash
npm test -- src/engine/corporation-rounds.scenario.test.ts
npm test
```

Expected: scenarios 1-6 PASS.

- [ ] **Step 6: Commit**

```bash
git add 1830-web/src/engine/corporations.ts 1830-web/src/engine/rounds.ts 1830-web/src/engine/corporation-rounds.scenario.test.ts
git commit -m "feat: add presidency flotation and round shell"
```

### Task 8: Implement UI-facing selectors

**Parallel-safe ownership:** `src/engine/selectors.ts` only.

**Files:**
- Create: `1830-web/src/engine/selectors.ts`

- [ ] **Step 1: Implement stable read models**

Export the selectors named in the design. Return arrays sorted explicitly by
seat, private face value, corporation definition order, or certificate ID. Do not
rely on object insertion order.

```ts
export interface StockRoundView {
  currentPlayer: PlayerState;
  mayPass: boolean;
  mayFinishTurn: boolean;
  purchasableCertificateIds: CertificateId[];
  sellableCertificateIds: CertificateId[];
  pendingPrivateTrade: PendingPrivateTrade | null;
}

export function getStockRoundView(state: GameState): StockRoundView;
export function getAuctionView(state: GameState): AuctionView;
export function getOperatingShellView(state: GameState): OperatingShellView;
```

Also export ownership, certificate-count, market-grid, and operating-order read
models by composing `ownership.ts` and `market.ts`.

- [ ] **Step 2: Type-check selectors**

```bash
npx tsc --noEmit -p tsconfig.app.json
```

Expected: PASS after Wave 3 integration.

- [ ] **Step 3: Commit**

```bash
git add 1830-web/src/engine/selectors.ts
git commit -m "feat: expose financial engine selectors"
```

### Wave 3 integration gate

Merge Tasks 7 and 8 first. Launch Task 6 from that integrated result. After Task
6 is merged:

```bash
cd 1830-web
npm test
npx tsc --noEmit -p tsconfig.app.json
```

Expected: scenarios 1-6 PASS; TypeScript PASS.

---

## Wave 4 — Dispatcher and application adapter

### Task 9: Add the command dispatcher and command-level validation

**Parallel-safe ownership:** `src/engine/executeCommand.ts`, scenario harness
conversion.

**Files:**
- Create: `1830-web/src/engine/executeCommand.ts`
- Modify: `1830-web/src/engine/setup.scenario.test.ts`
- Modify: `1830-web/src/engine/auction.scenario.test.ts`
- Modify: `1830-web/src/engine/stock.scenario.test.ts`
- Modify: `1830-web/src/engine/corporation-rounds.scenario.test.ts`

- [ ] **Step 1: Route every scenario through command envelopes**

Replace direct feature reducer calls in scenarios 1-6 with:

```ts
const result = executeCommand(state, command);
expect(result.ok).toBe(true);
if (!result.ok) throw new Error(result.message);
state = result.state;
```

Add assertions that a stale `expectedVersion` returns `VERSION_CONFLICT`, a
reused command ID returns `DUPLICATE_COMMAND`, and neither changes state.

- [ ] **Step 2: Verify the converted scenarios fail**

```bash
npm test
```

Expected: FAIL because `executeCommand.ts` does not exist.

- [ ] **Step 3: Implement the dispatcher**

```ts
export function executeCommand(state: GameState | null, command: GameCommand): CommandResult {
  if (state === null) return executeCreate(command);
  if (command.gameId !== state.id) return reject("ACTION_NOT_ALLOWED_IN_ROUND", "Wrong game");
  if (command.expectedVersion !== state.version) return reject("VERSION_CONFLICT", "State version changed");
  if (state.appliedCommandIds.includes(command.id)) return reject("DUPLICATE_COMMAND", "Command already applied");
  const result = routeByPrefix(state, command);
  return result.ok ? finalizeAcceptedCommand(result, command.id) : result;
}
```

`finalizeAcceptedCommand` increments version once, appends the command ID once,
runs invariants, and returns feature events. Feature reducers do not increment
versions themselves.

- [ ] **Step 4: Run scenarios 1-6**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add 1830-web/src/engine/executeCommand.ts 1830-web/src/engine/*.scenario.test.ts
git commit -m "feat: dispatch versioned game commands"
```

### Task 10: Replace Zustand rule logic with a thin adapter

**Dependency:** Begin only after Task 9 is merged.

**Files:**
- Create: `1830-web/src/store/gameAdapter.ts`
- Create: `1830-web/src/store/persistence.ts`
- Replace: `1830-web/src/store/gameStore.ts`
- Create: `1830-web/src/engine/adapter.scenario.test.ts`

- [ ] **Step 1: Add failing scenario 7 for save/load/undo**

Scenario 7 creates a store, dispatches an accepted command, verifies one undo
snapshot, dispatches a rejected command and verifies no new snapshot, undoes to
the exact prior state, saves, loads, clears history, and rejects a legacy save
without replacing live state.

- [ ] **Step 2: Verify scenario 7 fails**

```bash
npm test -- src/engine/adapter.scenario.test.ts
```

Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement persistence functions**

`persistence.ts` may access localStorage and must expose:

```ts
export function loadSavedGame(storage: Storage): GameState | null;
export function saveGame(storage: Storage, state: GameState, nowIso: string): void;
export function clearSavedGame(storage: Storage): void;
```

Use only `SAVE_KEY` and the codec from Task 5. Never read the legacy key as a new
save.

- [ ] **Step 4: Define the vanilla adapter store and accepted dispatch path**

```ts
export interface UiNotification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
}

export interface GameAdapterState {
  game: GameState | null;
  undoStack: GameState[];
  notifications: UiNotification[];
  dispatch: (command: GameCommand) => CommandResult;
  undo: () => boolean;
  load: () => boolean;
  newGame: () => void;
}

export function createGameAdapterStore(storage: Storage) {
  return createStore<GameAdapterState>()((set, get) => ({
    game: null,
    undoStack: [],
    notifications: [],
    dispatch: command => {
      const previous = get().game;
      const result = executeCommand(previous, command);
      if (!result.ok) {
        set(current => ({
          notifications: [...current.notifications, rejectionNotification(command.id, result)],
        }));
        return result;
      }
      if (previous) {
        set(current => ({ game: result.state, undoStack: [...current.undoStack, previous] }));
      } else {
        set({ game: result.state });
      }
      saveGame(storage, result.state, new Date().toISOString());
      return result;
    },
    undo: () => false,
    load: () => false,
    newGame: () => undefined,
  }));
}
```

On accepted dispatch: push the exact pre-command state, replace `game`, persist,
and map events to notifications. On rejection: preserve game and undo stack and
add one error notification.

- [ ] **Step 5: Implement undo, load, and new-game adapter actions**

Replace the three temporary action bodies: `undo` pops and restores the last
complete snapshot and persists it; `load` validates before replacement and
clears undo history; `newGame` clears only the v2 save, game state, undo stack,
and game notifications. Add `rejectionNotification` as a pure function that maps
the command ID, rule code, and message to one stable `UiNotification`.

`gameStore.ts` becomes only the browser binding:

```ts
import { useStore } from "zustand";
import { createGameAdapterStore } from "./gameAdapter";

export const gameAdapterStore = createGameAdapterStore(window.localStorage);
export const useGameStore = <T,>(selector: (state: GameAdapterState) => T): T =>
  useStore(gameAdapterStore, selector);
```

Scenario 7 imports `createGameAdapterStore` and supplies an in-memory `Storage`
stub, so it does not depend on a browser global.

- [ ] **Step 6: Run scenario 7 and all scenarios**

```bash
npm test -- src/engine/adapter.scenario.test.ts
npm test
```

Expected: all seven scenarios PASS.

- [ ] **Step 7: Commit**

```bash
git add 1830-web/src/store/gameAdapter.ts 1830-web/src/store/persistence.ts 1830-web/src/store/gameStore.ts 1830-web/src/engine/adapter.scenario.test.ts
git commit -m "refactor: make Zustand a thin game adapter"
```

### Wave 4 integration gate

Complete and merge Task 9 before beginning Task 10. After Task 10:

```bash
cd 1830-web
npm test
npx tsc --noEmit -p tsconfig.app.json
```

Expected: seven scenarios PASS. UI compilation may fail until Wave 5 because old
components still call removed store actions; record those call sites rather than
reintroducing legacy actions.

---

## Wave 5 — Parallel UI adapters

### Task 11: Connect setup and private-auction UI

**Parallel-safe ownership:** `GameSetup.tsx`, `PrivateAuction.tsx`,
`AuctionSummary.tsx` only.

**Files:**
- Modify: `1830-web/src/components/GameSetup.tsx`
- Modify: `1830-web/src/components/PrivateAuction.tsx`
- Modify: `1830-web/src/components/AuctionSummary.tsx`

- [ ] **Step 1: Replace setup initialization with `game.create` dispatch**

Keep existing visual controls. Generate command/game IDs in the adapter-facing UI
with `crypto.randomUUID()`. Shuffle place order once, include it in the command,
and let the engine calculate cash.

- [ ] **Step 2: Replace auction mutations with auction commands**

Render `getAuctionView(game)`. Buy, bid, raise, and pass buttons dispatch exact
commands with the current game version. Render locked money and bid-off actor
from the view; do not recompute legality in the component.

- [ ] **Step 3: Lint owned files**

```bash
npx eslint src/components/GameSetup.tsx src/components/PrivateAuction.tsx src/components/AuctionSummary.tsx
```

Expected: exit 0 for these three files. Full-project type-checking is deferred to
the Wave 5 integration gate because parallel sibling branches are still being
migrated.

- [ ] **Step 4: Commit**

```bash
git add 1830-web/src/components/GameSetup.tsx 1830-web/src/components/PrivateAuction.tsx 1830-web/src/components/AuctionSummary.tsx
git commit -m "refactor: connect setup and auction UI"
```

### Task 12: Connect Stock Round and private-trade UI

**Parallel-safe ownership:** `StockRound.tsx`, new trade dialog only.

**Files:**
- Modify: `1830-web/src/components/StockRound.tsx`
- Create: `1830-web/src/components/PrivateTradeDialog.tsx`

- [ ] **Step 1: Render only engine-derived stock actions**

Replace component calculations for first round, purchase count, sold
corporations, certificate limits, and Pool source with `getStockRoundView`.
Every buy/sell uses exact certificate IDs.

- [ ] **Step 2: Add explicit Finish Turn and Pass controls**

Show `Finish Turn` when `view.mayFinishTurn`; show `Pass` when `view.mayPass`.
Do not use Pass to complete a transaction turn. Keep Undo wired to adapter
snapshot undo.

- [ ] **Step 3: Add the mutual private-trade dialog**

The active buyer or seller selects a private, counterparty, and whole-dollar
price, then dispatches `stock.proposePrivateTrade`. While pending, show the other
party a confirm/reject panel and dispatch `stock.respondPrivateTrade`.

- [ ] **Step 4: Remove stock debug overrides**

Delete the hard-coded `isFirstStockRound`, direct `setGameState`, B&O par mutation,
and global action-history legality checks. Par selection dispatches
`stock.startCorporation`.

- [ ] **Step 5: Lint owned files**

```bash
npx eslint src/components/StockRound.tsx src/components/PrivateTradeDialog.tsx
```

Expected: exit 0 for the two owned files. Full-project type-checking is deferred
to the Wave 5 integration gate.

- [ ] **Step 6: Commit**

```bash
git add 1830-web/src/components/StockRound.tsx 1830-web/src/components/PrivateTradeDialog.tsx
git commit -m "refactor: connect stock round UI"
```

### Task 13: Connect the board shell, resume flow, and stopped state

**Parallel-safe ownership:** `GameBoard.tsx`, `App.tsx`, new panels only.

**Files:**
- Modify: `1830-web/src/components/GameBoard.tsx`
- Modify: `1830-web/src/App.tsx`
- Modify: `1830-web/src/components/StockMarketDisplay.tsx`
- Modify: `1830-web/src/components/NotificationPopup.tsx`
- Create: `1830-web/src/components/OperatingShell.tsx`
- Create: `1830-web/src/components/MilestoneStoppedPanel.tsx`

- [ ] **Step 1: Route screens from canonical `game.round`**

`GameBoard` selects auction, stock, shell, or stopped panel from the engine round.
Remove direct debug round mutations. Keep theme controls and stock-market display.
Update `StockMarketDisplay` to consume `getStockMarketView`, and update
`NotificationPopup` to render adapter notification levels without mutating the
notification array during render.

- [ ] **Step 2: Render the explicit Operating Round integration harness**

`OperatingShell` shows active corporation, operating order, treasury, and one
`End Corporation Turn` command. It displays: “Integration harness: trains,
routes, dividends, and legal operating market movement are not implemented.”
Hide the nonfunctional track/token/train/dividend buttons.

- [ ] **Step 3: Render Bank exhaustion stop information**

`MilestoneStoppedPanel` lists each unpaid obligation and its recipient, explains
that obligations are non-spendable, and offers New Game. It does not declare a
winner.

- [ ] **Step 4: Update resume/new-game behavior**

`App` calls adapter `load` once on startup, resumes only a validated v2 save, and
uses adapter `newGame` to clear it. Invalid/legacy data shows a dismissible error
without entering the board.

- [ ] **Step 5: Lint owned files**

```bash
npx eslint src/components/GameBoard.tsx src/components/StockMarketDisplay.tsx src/components/NotificationPopup.tsx src/components/OperatingShell.tsx src/components/MilestoneStoppedPanel.tsx src/App.tsx
```

Expected: exit 0 for the owned files. Full-project type-checking is deferred to
the Wave 5 integration gate.

- [ ] **Step 6: Commit**

```bash
git add 1830-web/src/components/GameBoard.tsx 1830-web/src/components/StockMarketDisplay.tsx 1830-web/src/components/NotificationPopup.tsx 1830-web/src/components/OperatingShell.tsx 1830-web/src/components/MilestoneStoppedPanel.tsx 1830-web/src/App.tsx
git commit -m "refactor: connect round shell and resume flow"
```

### Wave 5 integration gate

Merge Tasks 11, 12, and 13. Resolve shared imports only; do not copy rule logic
back into components. Then:

```bash
cd 1830-web
npm test
npx tsc --noEmit -p tsconfig.app.json
npm run build
```

Expected: seven scenarios PASS, TypeScript PASS, and production build PASS.

---

## Wave 6 — Remove legacy engine and verify delivery

### Task 14: Remove obsolete state, rule logic, and debug paths

**Dependency:** Begin after Wave 5 compiles; complete before Task 15 verification.

**Files:**
- Modify: `1830-web/src/types/game.ts`
- Delete or reduce: `1830-web/src/utils/turnManager.ts`
- Delete: unused `1830-web/src/components/BidPopup.tsx`
- Delete: unused `1830-web/src/components/PurchasePopup.tsx`
- Delete: unused `1830-web/src/components/TileLayingInterface.tsx` if present
- Modify: imports throughout `1830-web/src`

- [ ] **Step 1: Prove candidates are unused**

```bash
rg -n "BidPopup|PurchasePopup|TileLayingInterface|turnManager|GameAction|StockAction|ConnectedPlayer" 1830-web/src
```

Expected: record every remaining importer. Delete only symbols no longer needed by
map/station experiments.

- [ ] **Step 2: Remove duplicate financial models**

Delete legacy `Player.certificates`, `Corporation.playerShares`, `ipoShares`,
`bankShares`, `floated`/`isFloated`, auction mutation types, stock action history,
and turn-timeout infrastructure from `types/game.ts` once no importer remains.
Keep map, tile, train, and station experiment types required by test routes.

- [ ] **Step 3: Remove obsolete components and helpers**

Delete proven orphan files and repair imports. Do not delete map, hex, route, or
station experiments merely because they are outside this milestone.

- [ ] **Step 4: Run dead-reference and TypeScript checks**

```bash
rg -n "playerShares|ipoShares|bankShares|isFloated|undoLastStockAction|passStockRound|continueToStockRound" 1830-web/src
npx tsc --noEmit -p 1830-web/tsconfig.app.json
```

Expected: first command has no live financial-engine references; TypeScript PASS.

- [ ] **Step 5: Commit**

```bash
git add -A 1830-web/src
git commit -m "refactor: remove legacy financial engine"
```

### Task 15: Final verification and documentation

**Dependency:** Begin after Task 14. Owns README and verification notes only.

**Files:**
- Modify: `1830-web/README.md`
- Create: `docs/superpowers/verification/2026-07-14-financial-engine.md`

- [ ] **Step 1: Replace the Vite README with project instructions**

Document `npm ci`, `npm run dev`, `npm test`, `npm run lint`, and
`npm run build`. State precisely that setup/auction/Stock Rounds are implemented,
the Operating Round is an integration harness, legacy saves are unsupported, and
network multiplayer is not yet implemented.

- [ ] **Step 2: Run the full automated gate**

```bash
cd 1830-web
npm test
npm run lint
npm run build
```

Expected: seven scenarios PASS; lint exits 0; TypeScript and Vite build exit 0.

- [ ] **Step 3: Perform one manual integration walkthrough**

Run:

```bash
npm run dev
```

Verify and record:

1. 3-player setup gives $800 each and Bank $9,600.
2. SVN declines correctly and a contested private auction resolves.
3. C&A grants the exact PRR share and B&O par is selected once.
4. First Stock Round blocks sales.
5. Later Stock Round supports sell-then-buy and explicit Finish Turn.
6. An accepted private trade changes exact ownership and cash.
7. Presidency transfer and float capitalization display correctly.
8. The shell is labeled incomplete and can cycle without deadlock.
9. Undo, reload, and invalid legacy-save rejection behave as specified.
10. Bank exhaustion displays obligations and stops before another Stock Round.

- [ ] **Step 4: Write the verification record**

The verification Markdown contains the commit SHA, command outputs summarized as
PASS/FAIL, the ten manual results, and any known limitation. It must not claim
full-game playability.

- [ ] **Step 5: Commit**

```bash
git add 1830-web/README.md docs/superpowers/verification/2026-07-14-financial-engine.md
git commit -m "docs: verify financial engine milestone"
```

### Wave 6 final integration gate

Complete Task 14 before Task 15. After Task 15, rerun its automated gate and
inspect:

```bash
git status --short
git log --oneline --decorate -20
```

Expected: clean worktree; no `.DS_Store`; frequent task commits; seven tests,
lint, and build green.

## Completion state

After this plan is complete, the application is a reliable financial-core
prototype with multiplayer-ready command boundaries. It is not a complete 1830
game. The next specification should cover the actual map, tiles, and station
tokens before route, train, operating, bankruptcy, and scoring work.
