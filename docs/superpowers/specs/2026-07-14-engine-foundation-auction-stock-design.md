# 1830 Engine Foundation, Private Auction, and Stock Round Repair Design

Date: 2026-07-14  
Status: Approved design  
Repository baseline: `b82d025` (`main`)  
Rules authority: [`docs/rules/1830-rules-authoritative.md`](../../rules/1830-rules-authoritative.md)

## 1. Purpose

Repair the existing 1830 web implementation's financial core so local
pass-and-play games can complete setup, the private-company auction, repeated
Stock Rounds, and transitions through a temporary Operating Round shell without
corrupting ownership, money, presidency, market position, or turn order.

This milestone replaces rule decisions embedded in React and Zustand with a
deterministic, serializable TypeScript rules engine. The engine will run locally
for now but will expose command and version boundaries suitable for reuse by a
future authoritative multiplayer server.

The current visual design and user workflows should remain recognizable wherever
they are rules-correct. All existing implementation code, types, state shapes,
internal APIs, persistence formats, and component wiring may be refactored or
replaced. No internal compatibility constraint outweighs correctness or a clear
engine boundary.

## 2. Authoritative rules and fixed decisions

The project owner's pasted BoardGameGeek rules are the sole rules authority for
this milestone. Other PDFs, editions, current code, comments, and UI behavior do
not override them.

Numerical rules used by this design are:

- Total game cash: $12,000.
- Cash distributed at setup: $2,400 total.
- Starting cash: $800 with 3 players, $600 with 4, $480 with 5, and $400 with 6.
- Initial Bank cash after distribution: $9,600.
- Total certificate limits: 20 with 3 players, 16 with 4, 13 with 5, and 11 with
  6.
- Normal per-corporation holding limit: five certificates.
- Bank Pool maximum: 50% of a corporation.
- Corporation flotation threshold: five sold certificates representing 60%.
- Legal par values: $67, $71, $76, $82, $90, and $100.

If an implementation detail remains ambiguous after consulting the saved rules,
work stops for an explicit product decision rather than silently choosing an
alternate edition's behavior.

## 3. Goals

1. Create one canonical, normalized representation of game ownership and money.
2. Make all rule-relevant transitions atomic and deterministic.
3. Implement rules-correct setup and place-card order.
4. Implement the complete initial private-company auction described by the
   authoritative rules.
5. Implement first and later Stock Rounds, including share limits, presidency,
   flotation eligibility, market movement, and Priority Deal.
6. Implement a temporary Operating Round shell that correctly capitalizes new
   corporations, pays private income, visits corporations in order, and returns
   to the next Stock Round.
7. Preserve the current presentation and interaction style where practical.
8. Replace persistence with a validated, versioned save envelope.
9. Retain local undo using complete immutable state snapshots.
10. Keep the engine portable to a future server-authoritative multiplayer
    runtime without implementing networking now.

## 4. Non-goals

This milestone does not implement:

- The actual 1830 map.
- Tile laying or upgrading.
- Station-token placement.
- Route construction or revenue optimization.
- Train revenue, dividends, or withholding.
- Train ownership, purchases, rusting, limits, or phase events.
- Forced train purchases or bankruptcy.
- Bank-exhaustion endgame or final scoring.
- Network transport, accounts, lobbies, invitations, reconnection, spectators,
  clocks, host controls, or cheating prevention.
- Migration or repair of legacy browser saves.
- Broad UI redesign.

The design may establish narrow interfaces needed by later milestones, but it
must not add speculative implementations for these systems.

## 5. Architecture

The application will have four layers.

### 5.1 Pure rules engine

The rules engine is plain TypeScript. It has no dependency on React, Zustand,
browser storage, wall-clock timers, UI notifications, or mutable singleton
state.

It owns:

- Legal commands and their validation.
- All ownership and cash transfers.
- Auction order, bid locks, and resolution.
- Stock turn order and pass tracking.
- Corporation start and par selection.
- Certificate limits and stock-market zones.
- Stock sales, purchases, and market movement.
- Presidency selection and certificate exchange.
- Flotation eligibility and first-operation capitalization.
- Priority Deal and round transitions.
- Corporation operating order for the temporary shell.
- Engine invariants.

The primary engine operation is conceptually:

```ts
executeCommand(state: GameState, command: GameCommand): CommandResult
```

It returns a new state and domain events or a structured rejection. It never
partially mutates its input.

### 5.2 Serializable command protocol

Every user action is a command with a stable envelope:

```ts
interface CommandEnvelope<TType extends string, TPayload> {
  id: string;
  gameId: string;
  actorId: string;
  expectedVersion: number;
  type: TType;
  payload: TPayload;
}
```

The initial command set includes:

- `game.create`
- `auction.buyOfferedPrivate`
- `auction.placeAdvanceBid`
- `auction.raiseBid`
- `auction.pass`
- `stock.startCorporation`
- `stock.buyCertificate`
- `stock.sellCertificates`
- `stock.pass`
- `operatingShell.endCorporationTurn`

Commands validate `gameId`, `actorId`, turn authority, unique action ID, and
`expectedVersion`. Accepted commands increment the game version exactly once.
The browser engine rejects a repeated command ID with `DUPLICATE_COMMAND` and
does not apply it again. A future server may cache and return the original result
instead, without changing command semantics.

No command contains functions, class instances, Maps, Sets, object references,
or browser-only values. Commands and results are JSON-serializable.

### 5.3 Zustand application adapter

Zustand owns application concerns only:

- The current accepted `GameState`.
- Command dispatch.
- Local undo snapshots.
- Save/load orchestration.
- Mapping domain events and rule rejections to notifications.
- UI-only preferences such as theme and development flags.

Zustand does not calculate legal moves, move money, infer presidency, mutate
certificates, advance rounds, or decide market movement.

### 5.4 React presentation

Existing components remain the presentation layer. They consume engine state
through selectors and dispatch commands through the adapter.

- `GameSetup` dispatches deterministic game creation.
- `PrivateAuction` renders auction projections and dispatches auction commands.
- `StockRound` renders legal purchases and sales and dispatches stock commands.
- `GameBoard` renders the temporary Operating Round shell.
- Debug controls are available only under an explicit development flag.

Components may disable controls using engine selectors for usability. The
command handler remains authoritative so a stale or manipulated client cannot
bypass a rule.

## 6. Canonical state model

### 6.1 Stable identities

Every rule-relevant entity has a stable string ID:

- Game
- Player
- Corporation
- Private company
- Certificate
- Command

Certificates must never be identified by structural equality or array position.

### 6.2 Certificate ownership

Each certificate is stored once:

```ts
interface Certificate {
  id: CertificateId;
  corporationId: CorporationId;
  percent: 10 | 20;
  isPresident: boolean;
  location:
    | { type: "initialOffering" }
    | { type: "bankPool" }
    | { type: "player"; playerId: PlayerId };
}
```

Corporations and players do not hold second mutable certificate arrays.
Selectors derive:

- Ownership percentage by player.
- Initial Offering percentage.
- Pool percentage.
- Sold percentage.
- Presidency candidates.
- Per-corporation certificate count.
- Total counted certificates, including private companies and market-zone
  exemptions.

The current `Player.certificates` and `Corporation.playerShares` dual authority
must be eliminated.

### 6.3 Private-company ownership

Private companies also have one location:

```ts
type PrivateLocation =
  | { type: "bank" }
  | { type: "player"; playerId: PlayerId }
  | { type: "corporation"; corporationId: CorporationId }
  | { type: "closed" };
```

Only Bank and player locations are exercised fully in this milestone.
Corporation ownership and closure remain valid model states for later operating
work.

### 6.4 Money ledger

Every accepted monetary action is represented as balanced transfers among:

- Bank cash.
- Player cash.
- Corporation treasury cash.
- Auction bid locks by player and private company.

Locked money remains part of its player's wealth but is unavailable for other
purchases. Replacing or resolving a bid releases or consumes exactly the
relevant lock.

The sum of Bank cash, player cash, corporation treasury cash, and any other
future cash-holding entity must always equal $12,000. Bid locks are availability
constraints, not additional money, and therefore are not added again to the
conservation total.

### 6.5 Corporation lifecycle

Corporation lifecycle is explicit:

```text
unstarted -> parred -> floatEligible -> operating
```

- `unstarted`: president's certificate remains in the Initial Offering, except
  for the special B&O setup state.
- `parred`: a legal par price and market position exist.
- `floatEligible`: at least five certificates representing 60% have been sold
  from the Bank. Later Pool sales cannot reverse this state.
- `operating`: the corporation has entered its first Operating Round, received
  full capitalization of ten times par from the Bank, and is eligible for the
  temporary shell order.

There will not be parallel `floated` and `isFloated` flags.

### 6.6 Round state

Round state records:

- Round type and sequential number.
- Whether this is the first Stock Round.
- Current actor.
- Consecutive pass count.
- Last player to complete a transaction.
- Priority Deal holder, which is unset until the first Stock Round ends.
- Per-player corporations sold in the current Stock Round.
- Per-turn purchase count and brown-zone exception state.
- Current private offering.
- Advance bids and locks.
- Active contested auction, standing bid, and eligible bidders.
- Operating Round shell number and active corporation.

The round state must always identify one legal actor when player input is
required. Automatic transitions continue until the engine reaches an input
boundary or the next stable round state.

## 7. Command results, events, and errors

An accepted result contains:

```ts
interface AcceptedCommand {
  ok: true;
  state: GameState;
  events: DomainEvent[];
}
```

A rejected result contains:

```ts
interface RejectedCommand {
  ok: false;
  code: RuleErrorCode;
  message: string;
  details?: Record<string, string | number | boolean>;
}
```

Expected rule rejections include stable codes such as:

- `VERSION_CONFLICT`
- `DUPLICATE_COMMAND`
- `NOT_CURRENT_PLAYER`
- `ACTION_NOT_ALLOWED_IN_ROUND`
- `INSUFFICIENT_AVAILABLE_CASH`
- `BID_INCREMENT_TOO_SMALL`
- `CERTIFICATE_LIMIT_EXCEEDED`
- `CORPORATION_HOLDING_LIMIT_EXCEEDED`
- `POOL_LIMIT_EXCEEDED`
- `PRESIDENCY_CANNOT_TRANSFER`
- `CANNOT_BUY_AFTER_SELLING`
- `INVALID_PAR_PRICE`

Domain events describe accepted facts for UI messaging and future multiplayer
broadcasting. Examples are `PrivatePurchased`, `BidPlaced`, `CorporationParred`,
`CertificatePurchased`, `CertificatesSold`, `PresidentChanged`,
`CorporationBecameFloatEligible`, `CorporationCapitalized`, and `RoundStarted`.

Rule rejections do not alter state or create undo history. Violated internal
invariants are programming faults, not rule rejections. Development builds fail
loudly. Production retains the previous valid state and reports a generic
recovery error.

## 8. Selectors

The engine exposes pure selectors rather than requiring components to traverse
normalized state directly. Initial selectors include:

- `getCurrentActor`
- `getAuctionView`
- `getAvailablePrivateActions`
- `getPurchasableCertificates`
- `getSellableCertificates`
- `getCorporationOwnership`
- `getCorporationPresident`
- `getPlayerCertificateCount`
- `getCertificateLimitStatus`
- `getStockMarketView`
- `getOperatingOrder`

Selectors return presentation-safe read models. They do not mutate state or
silently relax command validation.

## 9. Setup behavior

`game.create` accepts three to six ordered players plus explicit place-card or
seat-order input. Randomization occurs outside the pure transition or through a
supplied seed so the resulting state is reproducible.

Setup must:

1. Validate player count and unique player IDs.
2. Distribute exactly $2,400 according to player count.
3. Set Bank cash to $9,600.
4. Create every corporation certificate in exactly one Initial Offering.
5. Put president certificates first for UI ordering without making array order
   authoritative.
6. Put every private company in the Bank.
7. Start the private auction with the lowest place-card player.
8. Leave Priority Deal unset during the first Stock Round. After the private
   auction completes, ordinary stock dealing begins with the player left of the
   last private purchaser. The first Priority Deal holder is assigned only when
   that Stock Round ends.

## 10. Private auction behavior

### 10.1 Normal offering

The six private companies are considered in increasing face value. On a normal
turn the current player may:

- Buy the offered private at its current offered price.
- Place an advance bid on a later unsold private.
- Pass.

Advance bids must exceed face value or the existing high bid by at least $5.
The bidder must have sufficient available cash after all other locks.

### 10.2 Resolving advance bids

When the preceding private is sold:

- A single advance bidder buys the private for the locked bid amount.
- Multiple advance bidders enter a contested bid-off.

The highest original bid remains the standing bid. Only original bidders may
participate. Each raise is at least $5. Passing removes that player from the
bid-off. The last remaining bidder buys for the standing bid. Ownership, Bank
payment, and all bid-lock releases occur atomically.

After resolution, normal offering resumes with the player left of the last
player who bought a company offered by the Banker, as specified by the pasted
rules.

### 10.3 All-pass behavior

If every player passes while SVN remains unsold:

- Start a new auction pass around.
- Reduce only SVN's offered price by $5.
- Never reduce another private's price.
- If no player buys SVN at $5, give it free to the first player offered it at
  $5; this counts as a purchase.

If SVN has sold and a complete pass around does not sell the currently offered
private:

- End that Stock Round.
- Pay income from every owned private company from the Bank.
- Begin a new private-auction Stock Round with the correct player.

### 10.4 Completion and special setup effects

Corporation stock remains unavailable until all private companies are player
owned.

When the auction completes:

- The initial C&A owner receives the designated 10% PRR certificate. It cannot
  be sold before PRR is parred.
- The initial B&O owner receives the B&O 20% president's certificate and chooses
  a legal B&O par price through the required UI continuation.
- The B&O private remains open; it does not close on flotation. Its closure is
  deferred until B&O buys its first train in a later milestone.

Other private abilities are stored as data but do not produce operating actions
in this milestone.

## 11. Stock Round behavior

### 11.1 Turns and passes

On a Stock Round turn, a player may sell any legal number of certificates and
buy the permitted number of certificates in either order, or pass.

- The first Stock Round forbids all sales.
- Normally only one certificate may be purchased per turn.
- Brown-zone stock may be bought in any available quantity in one turn.
- A player who sells any certificate of a corporation may not buy that
  corporation until the next Stock Round.
- Passing does not remove a player from the round.
- The round ends after all players pass consecutively.
- Any purchase or sale resets the consecutive-pass count.

At round end, Priority Deal goes to the player left of the last player who
bought or sold. If nobody transacted, the existing holder retains it.

### 11.2 Starting a corporation

Buying an unstarted corporation's president certificate requires selecting a
legal par value. The command atomically:

- Transfers the 20% certificate to the buyer.
- Transfers two times par from the player to the Bank.
- Records immutable par value.
- Places the corporation market token in the corresponding red space beneath
  any token already there.
- Establishes the buyer as president.

B&O uses the same par and market initialization through its private-company
setup path, without charging again for the automatically granted certificate.

### 11.3 Share purchases

- Initial Offering certificates cost par.
- Bank Pool certificates cost current market value.
- The requested certificate ID determines its actual source; the UI cannot
  claim a Pool buy while removing an IPO certificate.
- C&A's free PRR share cannot be sold until PRR has been parred.
- Purchases enforce total certificate limits and the normal five-certificate
  corporation limit, subject to market-zone exceptions.

### 11.4 Share sales

- Sales identify exact certificate IDs.
- All certificates in one corporation's sale pay the market value displayed
  before any downward movement from that sale.
- Player cash increases and Bank cash decreases by the same amount.
- Each sold 10% moves the corporation token exactly one row straight down,
  stopping at the bottom row.
- The Bank Pool may not exceed 50%.
- A president certificate never enters the Pool.
- A sale that would require an impossible presidency transfer is rejected
  atomically.

`stock.sellCertificates` accepts exact certificate IDs spanning one or more
corporations. It validates and applies the complete sale atomically. If any
certificate or resulting presidency transfer is illegal, none of the sale is
applied. Price movement is calculated independently for each affected
corporation after the seller's proceeds are fixed.

### 11.5 Presidency

Presidency is held by the 20% certificate owner. Another player becomes
president only when their percentage strictly exceeds the incumbent's.

On transfer:

1. The incoming president receives the 20% certificate.
2. The outgoing president receives two exact 10% certificates from the incoming
   president.
3. Both players retain their ownership percentages.
4. If several eligible players tie after an outgoing president's sale, the new
   president is the tied player next to the old president's left.

The entire exchange, associated sale, limit state, and event list are one
accepted transition.

### 11.6 Certificate limits and market zones

Total certificate counts include open player-owned private companies. Market
zones apply as follows:

- Yellow-zone corporation certificates do not count toward the total limit.
- Orange-zone stock has no per-corporation holding limit.
- Brown-zone stock is exempt from buying and holding limits and may be bought in
  any available quantity during one turn.

A presidency change may temporarily place the outgoing president over the total
limit; round state records the obligation, and the player must correct it on
their next Stock Round turn before any other purchase or pass.

### 11.7 Flotation and end-of-round movement

When five certificates representing 60% have been sold by the Bank, the
corporation becomes `floatEligible`. B&O, C&A, and later M&H granted shares count
as sales where required by the rules. Pool sales do not reverse eligibility.

At Stock Round end, a corporation moves one row upward if no certificate remains
in its Initial Offering or the Pool. Unstarted corporations otherwise move only
downward due to Pool sales.

## 12. Temporary Operating Round shell

This milestone uses a deliberate shell so repeated Stock Rounds can be tested
without pretending train and map operations exist.

At Stock Round end:

1. Determine the set of float-eligible or already operating corporations.
2. For each newly operating corporation, transfer ten times par from the Bank
   to its treasury immediately before its first Operating Round turn and mark it
   operating.
3. Pay each open private company's income once for this shell Operating Round.
4. Sort corporations by current market value, then rightmost position, then
   topmost token in a shared space.
5. Present the active corporation and allow only
   `operatingShell.endCorporationTurn`.
6. After every corporation has ended its turn, begin the next Stock Round with
   the Priority Deal holder.

If no corporation is eligible to operate, skip the shell without deadlocking
and immediately start the next Stock Round.

The shell must be visibly labeled as incomplete. Track, tokens, routes,
dividends, and train controls must be hidden or disabled rather than falsely
appearing functional.

## 13. Persistence and undo

### 13.1 Save envelope

New saves use a JSON envelope:

```ts
interface SaveEnvelope {
  schemaVersion: number;
  engineVersion: string;
  savedAt: string;
  game: GameState;
}
```

Loading validates the envelope, supported versions, JSON shape, and all engine
invariants before replacing live state. Invalid, unsupported, legacy, or
corrupted saves are rejected without partially loading them.

No migration from the current local-storage format is required. The new storage
key must differ from the legacy key so deployment does not misinterpret old
state.

### 13.2 Undo

Before each accepted local command, the adapter stores the complete previous
accepted `GameState`. Undo restores that exact state. Rejected commands create no
snapshot. Loading a save clears undo history. UI preferences are not part of a
game undo snapshot.

Undo is a local-play convenience, not a command in the multiplayer-ready engine.
A future multiplayer product may disable it or add a separate host-approved
rollback protocol.

## 14. Future multiplayer compatibility

Networking is outside this milestone, but the engine must satisfy these
constraints:

- The same `executeCommand` function can run in a browser or server process.
- State, commands, results, and events are JSON-serializable.
- The engine never trusts UI-disabled states as validation.
- Every command identifies the actor and expected game version.
- Every accepted command increments version exactly once.
- Duplicate command IDs cannot apply twice.
- All randomness is supplied or seeded.
- No rule depends on wall-clock time.
- Selectors are pure and can produce player-specific projections later.
- Notifications are derived from events, not embedded in engine state.

These boundaries support a future server-authoritative model in which clients
submit commands, the server validates and executes them, and accepted states or
events are broadcast to clients.

## 15. Minimal verification strategy

Testing is intentionally limited to the smallest safety net approved for this
milestone. Add Vitest and these seven scenario tests:

1. Setup across supported player counts and Bank distribution.
2. Private auction covering normal purchase, advance bid, pass, locked cash,
   single-bid resolution, and contested resolution.
3. SVN all-pass price reduction and free assignment after failure at $5.
4. Stock Round covering par, IPO purchase, Pool sale, Pool purchase, market
   movement, pass reset, and Priority Deal.
5. Presidency transfer plus flotation eligibility and first-operation
   capitalization.
6. Repeated Stock Round and Operating Round shell cycles, including no operating
   corporations.
7. Save, reload, continue, accepted-command undo, and rejected-command no-op.

A shared invariant checker runs after every accepted command in these scenarios:

- Total cash remains $12,000.
- Every certificate has exactly one valid location.
- Each corporation's certificates total 100%.
- President certificates never occupy the Bank Pool.
- The Bank Pool never exceeds 50% of a corporation.
- Cash balances and available cash never become negative.

There is no component-test suite, snapshot-test suite, exhaustive edge-case
matrix, coverage target, property-testing suite, or browser end-to-end suite in
this milestone.

Acceptance also requires TypeScript compilation, linting, a production build,
and one manual pass-and-play walkthrough through multiple Stock Rounds.

## 16. Delivery sequence

1. Introduce normalized engine types, command/result types, selectors, and the
   invariant checker without switching the UI.
2. Implement setup and private-auction commands.
3. Implement Stock Round, market, presidency, limits, and flotation commands.
4. Implement the temporary Operating Round shell.
5. Add the thin Zustand adapter and snapshot undo.
6. Connect existing setup, auction, stock, and board components to commands and
   selectors.
7. Replace persistence with the versioned save envelope.
8. Run the seven scenario tests and manual walkthrough.
9. Delete superseded rule logic, duplicate ownership fields, unused inverse-undo
   code, and obsolete debug paths.

The old and new rules engines must not remain as permanent parallel systems.
Deletion occurs only after the repaired path is connected and verified.

## 17. Acceptance criteria

The milestone is complete when:

1. A three-to-six-player local game starts with correct player and Bank cash.
2. Every private auction path in scope resolves without duplicated ownership,
   stale locks, or incorrect Bank cash.
3. Corporation stock remains unavailable until every private has an owner.
4. First Stock Round sales are prohibited and later sales are enabled.
5. IPO and Pool buys remove the requested exact certificate and charge the
   correct price.
6. Stock sales pay the pre-movement value and move the market exactly once per
   10% sold.
7. Certificate limits, zones, Pool limits, and buy-after-sale restrictions are
   enforced per the authoritative rules.
8. Presidency changes preserve percentages and keep the president certificate
   out of the Pool.
9. Float eligibility survives later Pool sales, and full capitalization occurs
   once at the corporation's first shell Operating Round.
10. Stock Round completion assigns Priority Deal correctly and never deadlocks
    when no corporation operates.
11. Private income is paid once per shell Operating Round.
12. Undo restores the complete prior accepted state.
13. Legacy or invalid saves are rejected without modifying the live game.
14. All accepted states satisfy the six critical invariants.
15. The seven approved scenarios, TypeScript build, lint, and production build
    pass.
16. The UI remains visually recognizable and exposes no apparently functional
    operating actions that are still placeholders.
17. The engine is independent of React, Zustand, browser APIs, and wall-clock
    time, and its public protocol is serializable and versioned.

## 18. Deferred follow-up specifications

After this milestone, separate design and implementation cycles should cover:

1. Actual 1830 map data, tile inventory, upgrades, terrain, and station tokens.
2. Route graph, train runs, revenue, dividends, and stock movement from
   operations.
3. Train depot, train trading, rusting, phases, private closure, and Operating
   Round counts.
4. Forced train purchases, emergency financing, bankruptcy, Bank exhaustion,
   final scoring, and completed game flow.
5. Network multiplayer transport and product behavior using the command engine
   established here.
