# 1830 Complete Operating Round Engine and Map Design

Date: 2026-07-15  
Status: Draft under rules-reconciliation review  
Repository baseline: `9032f66` (`main`, merged financial-engine milestone)  
Primary rules authority: [`docs/rules/1830-rules-authoritative.md`](../../rules/1830-rules-authoritative.md)  
Reconciliation source: [`1830 RE Rules.pdf`](../../../1830%20RE%20Rules.pdf), 1830 Classic rules and tables only

## 1. Purpose

Replace the temporary Operating Round shell with a deterministic, rules-correct
implementation of the complete 1830 Classic Operating Round. The result must
support the actual 1830 board, tile inventory and upgrades, station tokens,
routes, revenue, dividends, train ownership and trading, phase changes, private
company powers, forced train purchases, bankruptcy, Bank exhaustion, and the
transition between Stock Rounds and sets of one to three Operating Rounds.

This milestone extends the existing financial engine rather than creating a
second game system. React remains a presentation layer, Zustand remains an
adapter, and every rule-relevant transition remains a serializable command
validated by a pure TypeScript engine.

Although this specification uses 1830 Classic to prove correctness, 1830 is a
versioned ruleset package consumed by the engine. The map, tile set, station
inventory and prices, corporations, trains, phases, and supported operating
policies are inputs. They must not be hard-coded into generic reducers,
selectors, graph builders, validators, optimizers, persistence, or UI layout.

The approved UI restoration remains the visual baseline. The main game board is
the map. The compact tabbed corporation pane sits below the board. Current-turn
controls live in the top header. The four corporation actions are Construct
Track, Place Station, Run Trains, and Buy Train. Dividend handling is part of
Run Trains, not a separate top-level action.

## 2. Normative sources and precedence

### 2.1 Source order

Rules questions are resolved in this order:

1. The saved Avalon Hill rules prose in
   [`docs/rules/1830-rules-authoritative.md`](../../rules/1830-rules-authoritative.md).
2. The 1830 Classic sections and appendices in
   [`1830 RE Rules.pdf`](../../../1830%20RE%20Rules.pdf), used to supply tables
   omitted from the saved prose and to resolve ambiguities explicitly identified
   as clarifications of the original rules.
3. The physical 1830 Classic board and component faces, transcribed into static
   manifests and verified against the PDF tables.
4. Explicit product decisions in this document, but only where the rules do not
   determine software interaction, serialization, or presentation behavior.

Current code, comments, test prototypes, screenshots, and legacy UI behavior are
not rules authorities. They may be reused only after they pass the rules in this
document.

### 2.2 Edition boundary

The target game is **1830 Classic**, not the simplified 2011 Base Game and not
an 1830+ scenario or optional variant.

In particular:

- Use Classic forced sales, bankruptcy, and immediate game end from PDF
  sections 6.6.2 through 7.1 and saved rules sections 24 and 25.
- Do not implement the Base Game receivership or Bank-loan system.
- Use only the six Classic private companies and eight Classic corporations.
- Use the Classic train and tile manifests. Ignore scenario-only trains,
  companies, corporations, licenses, board overlays, and alternate tiles.
- Use the Classic open tile-laying clarification from PDF section 6.2.1: one
  reachable segment on the placed or upgraded tile is sufficient.
- Support every Classic player count described by the repository PDF: two
  through six players. The two-player starting cash is $1,200 and certificate
  limit is 28.

### 2.3 Reconciled omitted tables

The saved prose references tables without reproducing them. For this milestone,
the repository PDF supplies the following normative data.

#### Train manifest — repository PDF page 5

| Type | Price | Component count | Effective supply | Immediate trigger |
|---|---:|---:|---:|---|
| 2 | $80 | 6 | 6 | None; Phase 2 already began when the private auction ended |
| 3 | $180 | 5 | 5 | Phase 3; green tiles; corporations may buy privates |
| 4 | $300 | 4 | 4 | Phase 4; 2-trains removed; three-train limit |
| 5 | $450 | 3 | 3 | Phase 5; brown tiles; privates close; two-train limit; high off-board revenue |
| 6 | $630 | 2 | 2 | Phase 6; 3-trains removed; Diesels available |
| D | $1100, or $800 with one owned 4/5/6 trade-in | 6 | Unlimited | Phase 7; 4-trains removed |

The physical set contains six Diesel cards, but the PDF explicitly makes the
Diesel supply theoretically unlimited and directs players to issue paper
Diesels if necessary. The engine deterministically creates additional virtual
Diesels after the six component-backed IDs are exhausted.

The first 3 and first 5 affect the number of Operating Rounds only after the
next Stock Round, as required by saved rules section 22. The current Operating
Round set never grows midway through the set.

#### Railroad station-token manifest — repository PDF pages 20 and 28

| Corporation | Home | Printed coordinate | Station tokens including home |
|---|---|---|---:|
| PRR | Altoona | H-12 | 4 |
| NYC | Albany | E-19 | 4 |
| CPR | Montreal | A-19 | 4 |
| B&O | Baltimore | I-15 | 3 |
| C&O | Cleveland | F-6 | 3 |
| Erie | Buffalo | E-11 | 3 |
| NNH | New York | G-19 | 2 |
| B&M | Boston | E-23 | 2 |

Stock-market markers and par markers are not station tokens and do not consume
this supply.

#### Private effects — saved sections 18, 19, and 23; repository PDF pages 9,
11, and 27

| Private | Operating effect |
|---|---|
| SV | No special Operating Round effect. |
| C&SL | Owning corporation may place a tile on B-20 without connection; this is an additional tile placement in that turn. |
| D&H | Owning corporation may place yellow #57 on F-16 without connection and may place a free station there in the same turn; the tile costs the normal $120 mountain fee and consumes the normal tile placement. |
| M&H | Player owner may exchange it for an available NYC 10% share at the rule-permitted timing; the exchange closes M&H. |
| C&A | Its free PRR share is awarded during initial purchase; it has no additional Operating Round action. |
| B&O | It may not be sold to a corporation; it closes when the B&O corporation buys its first train. |

All still-open private companies other than the already-closed M&H and B&O
close immediately when the first 5-train is bought.

#### Tile manifest and upgrades — repository PDF page 28

The implementation must transcribe the complete Classic quantities and upgrade
edges from the Track Tile Manifest & Upgrades using the original numeric tile
IDs.
No quantity or upgrade edge may be inferred from the current prototype. A
fixture test must compare every transcribed Classic tile ID, quantity, color,
label, city shape, and legal successor set against an independently reviewed
table transcription.

### 2.4 Explicit reconciliation decisions

- 1830 Classic has exactly 85 playable track tiles in yellow, green, and brown.
  It has no playable gray tiles and no brown-to-gray upgrade stage. Printed gray
  and red board track is static board geometry, not a tile color.
- Phase 1 is the private auction. Phase 2 begins when all six privates are
  purchased, before any train is bought. Phase 7 begins with the first Diesel.
- The saved rules describe discarded excess trains as returned to the Bank and
  available for resale. The PDF calls this the Bank Pool; to avoid confusing
  trains with share certificates, the engine models a
  distinct `openMarket` location, charges face value, and pays that purchase to
  the Bank. This is a representation choice, not a rules change.
- The PDF Base Game describes receivership. Classic sections 6.6.2 through 7.1 instead
  require forced sales, bankruptcy, and immediate game end. Only the Classic
  rule is implemented.
- Saved rule 11 capitalizes a newly floated corporation at the beginning of the
  Operating Round in which it starts, while PDF section 5.3 describes issuance
  at the end of the Stock Round. Under section 2.1 precedence, capitalization
  occurs exactly once during Operating Round initialization.
- PDF page 27 contains one C&A prose-heading typo of $165; its table, page 9,
  the component, and saved rules use $160. The definition uses $160.
- Exact automatic maximum-route calculation is a software interaction decision.
  The tabletop rule requires a higher demonstrated route but does not require
  another player to find one; the engine's optimizer itself demonstrates the
  maximum and therefore requires it.
- The D&H text makes its same-turn station free but does not expressly say
  whether it consumes the ordinary station action. Treat it as a definition-
  issued additional station allowance: it does not consume the normal station
  action, but it expires when that turn's station step is finished.
- When the Bank first cannot meet a payment, the final-round deadline latches,
  but play must continue with full spending power as required by saved rule 25
  and PDF section 7.0. Full credits are represented by allowing Bank cash to go
  negative; the engine may not make an earned payment non-spendable or create a
  false bankruptcy.
- PDF section 6.6.3 supplies an omitted emergency-financing clarification: if a
  presidency change cancels the contemplated intercorporate train sale, restore
  the entire state to the beginning of that train-buying step.
- Corporation treasury amounts remain visible in the local UI. The rules say
  they need not be divulged, not that they must remain hidden.
- The existing random `HexGrid`, generic `TRACK_TILES`, `StationManager`, and
  revenue-center-only route graph are experiments. Their data and legality
  logic are not migrated into the engine. Rendering techniques may be reused.

## 3. Goals

1. Make a complete game of 1830 Classic playable from setup through final
   scoring without manual rule overrides.
2. Render the selected ruleset's board and all current tile and token state,
   including the canonical Classic board for `1830-classic@1`.
3. Enforce the five-step corporation operating sequence.
4. Validate every tile placement and upgrade against connectivity, terrain,
   phase, inventory, labels, city shape, and private-company restrictions.
5. Validate station placement, costs, reachability, blocking, home stations,
   and special cases.
6. Represent exact track lanes so crossovers, junctions, separate cities, and
   route overlap are rules-correct.
7. Run every owned train on a legal, maximum-revenue set of routes and resolve
   dividends or withholding atomically.
8. Implement the Classic train depot, open market, corporation-to-corporation
   trades, train limits, rusting, phase changes, and excess-train discards.
9. Implement corporation purchases of private companies and every remaining
   Classic private effect.
10. Implement forced train purchases, emergency financing, presidency effects,
    bankruptcy, and both game-end conditions.
11. Preserve deterministic commands, invariant checking, versioned saves,
    snapshot undo, and future server-authoritative compatibility.
12. Preserve the approved information hierarchy and visual system while making
    every enabled Operating Round control functional.
13. Prove that the operating engine is definition-driven by loading a second
    synthetic fixture map with different dimensions, tiles, station counts and
    costs, corporations, trains, phases, and action settings without modifying
    engine source.

## 4. Non-goals

This milestone does not implement:

- Any 1830 Base Game rule that differs from Classic.
- 1830+ variants, scenarios, additional companies, additional corporations,
  plus-trains, 7-trains, licenses, or alternate boards.
- Automated strategy advice beyond identifying legal actions and the required
  maximum route revenue.
- AI presidents or automated negotiation decisions.
- Network transport, accounts, lobbies, invitations, spectators, clocks, or
  reconnect behavior.
- Hidden-information enforcement for corporation treasuries.
- A universal engine for every published 18XX title on the first milestone.
  However, the architecture must be ruleset-driven: 1830 Classic is the first
  complete ruleset package, not a collection of hard-coded engine branches.
  New maps, manifests, corporations, phases, and compatible rule policies must
  be installable without editing the generic map, route, token, train, or round
  engines.

## 5. Architectural boundary

The four-layer architecture from the financial-engine milestone remains.

### 5.0 Ruleset package boundary

The implementation has two distinct pure layers:

1. A generic operating engine that interprets topology, manifests, costs,
   phases, action sequences, and typed rule policies.
2. A versioned `GameDefinition` package. The first production package is
   `1830-classic@1`, transcribed from the sources in section 2.

The generic engine must not contain checks such as `gameId === "1830"`,
`corporationId === "ERIE"`, `privateId === "D&H"`, tile-number switches,
printed-coordinate switches, fixed station costs, fixed train names, or fixed
phase thresholds. Those facts belong in definitions or typed ability/policy
data.

Parameterization is not permission to weaken type safety. A ruleset is validated
when loaded and converted into an immutable, indexed runtime definition. Invalid
maps, dangling upgrade edges, negative inventories, unknown home hexes, invalid
phase triggers, and unsupported ability kinds fail before a game can start.

The extension boundary is deliberately two-tiered:

- **Data-only variation:** maps, hexes, tiles, station inventories and prices,
  corporations, certificates, trains, phases, terrain, revenue, and action
  availability are declarative.
- **New mechanic families:** a title requiring behavior outside the supported
  policy/ability union adds a new typed engine capability with focused tests. It
  must not inject arbitrary executable callbacks into save data or definitions.

### 5.1 Pure engine

The generic engine owns:

- Loading and validating versioned game definitions.
- Canonical map, token, train, phase, and Operating Round state.
- Turn and step authority.
- Legality and atomic transitions for all operating actions.
- Route graph derivation, route validation, and maximum-revenue calculation.
- Money transfers, stock-market movements, phase effects, rusting, discards,
  emergency financing, bankruptcy, and scoring.
- Structured domain events, rejection codes, and invariants.

It must not import React, Zustand, browser APIs, SVG code, local storage,
wall-clock time, or mutable singleton managers.

### 5.2 Serializable command protocol

Commands retain the existing envelope with `id`, `gameId`, `actorId`,
`expectedVersion`, `type`, and a JSON payload. Accepted commands increment the
version exactly once, including commands that cause multiple internal phase
effects. Rejected and duplicate commands leave state unchanged.

### 5.3 Zustand adapter

Zustand stores the accepted state, dispatches commands, persists saves, records
undo snapshots, and projects events into notifications. It does not keep a
parallel map, selected route, train roster, or corporation treasury.

Ephemeral UI drafts such as a hovered rotation or an unconfirmed route drawing
remain component state. Once confirmed, the exact action is sent as a command.

### 5.4 React presentation

React renders selector projections and dispatches commands. It may highlight
legal choices but may not decide legality. A disabled button is a usability aid;
the command handler remains authoritative.

### 5.5 Suggested module ownership

Keep game content physically separate from reusable mechanics:

```text
src/engine/definitions/                 # schemas, indexes, validation
src/engine/definitions/1830-classic/    # board, tiles, trains, phases, entities
src/engine/map/                         # generic topology and track graph
src/engine/operating/                   # generic action sequencing and commands
src/engine/routes/                      # generic route legality/optimization
src/engine/trains/                      # generic ownership, depot, limits, triggers
src/engine/abilities/                   # supported typed mechanic families
src/engine/testing/fixtures/            # synthetic non-1830 definition
```

Definition modules may import shared schemas. Generic modules must not import
`1830-classic`. The composition root resolves the selected package and supplies
it to game creation, command execution, selectors, invariants, save loading, and
UI projections.

## 6. Canonical static definitions

Static definitions live outside `GameState` and are passed into pure engine
functions through an immutable `GameDefinition`. They are deterministic,
versioned game data, not mutable state. Engine functions must not import an 1830
singleton directly; the application selects a definition when creating or
loading a game.

```ts
interface GameDefinition {
  ref: { id: GameDefinitionId; version: number };
  metadata: GameMetadata;
  setup: SetupDefinition;
  board: BoardDefinition;
  tiles: TileSetDefinition;
  corporations: CorporationDefinition[];
  privates: PrivateDefinition[];
  trains: TrainRosterDefinition;
  phases: PhaseDefinition[];
  stockMarket: StockMarketDefinition;
  bank: BankDefinition;
  certificates: CertificateDefinition[];
  operatingRound: OperatingRoundRulesDefinition;
  abilities: AbilityDefinition[];
}
```

`GameState` stores this exact definition reference, not a copy of the package.
`GameDefinitionResolver.resolveExact` must either return that exact version or a
structured not-installed error. It never silently substitutes the latest
version. Game creation, command execution, selectors, invariants, save loading,
and UI projections all receive the resolved definition explicitly.

### 6.0 Definition validation

Before a game starts, `validateGameDefinition` verifies at minimum:

- every board coordinate, neighbor relationship, home, destination, and private
  reservation is internally consistent;
- tile quantities are nonnegative, paths reference valid endpoints, and upgrade
  graphs reference existing tiles without illegal color regressions;
- corporation station inventories can accommodate required home stations;
- station costs, terrain costs, bank amounts, train prices, and revenues are
  valid currency amounts;
- phase triggers reference existing train types and every rust/obsolete target
  exists;
- certificate totals, corporation shares, presidency percentages, and pool
  limits are coherent;
- every typed private/corporation ability is supported by the engine and all
  referenced entities exist; and
- the operating action sequence and skip/required policies are satisfiable.

### 6.1 Board definition

Each printed board hex is represented by a stable printed coordinate:

```ts
type HexId = string; // e.g. "H-12"
type HexSide = 0 | 1 | 2 | 3 | 4 | 5;

type TrackNodeRef =
  | { type: "edge"; side: HexSide; lane: number }
  | { type: "city"; cityId: CityId }
  | { type: "junction"; junctionId: JunctionId };

interface TrackSegmentDefinition {
  id: TrackSegmentId; // stable locally within this hex/tile
  endpoints: [TrackNodeRef, TrackNodeRef];
}

interface TrackFragmentDefinition {
  junctionIds: JunctionId[];
  segments: TrackSegmentDefinition[];
}

interface CityDefinition {
  id: CityId;
  kind: "town" | "city" | "offboard";
  stationSlots: number;
  revenue: RevenueScheduleDefinition;
}

interface BoardHexDefinition {
  id: HexId;
  displayCoordinate: string;
  position: { q: number; r: number };
  kind: BoardHexKindId;
  terrain: TerrainFeatureDefinition[];
  label: string | null;
  neighbors: Partial<Record<HexSide, HexId>>;
  cities: CityDefinition[];
  printedTrack: TrackFragmentDefinition;
  privateIds: PrivateId[];
  homeCorporationIds: CorporationId[];
  blockedSides: HexSide[];
}
```

For `1830-classic@1`, the board manifest is a literal transcription. The engine
does not assume its dimensions, coordinate notation, orientation, labels,
terrain prices, revenue values, home locations, or offboard layout. Another
ruleset may provide any finite hex map satisfying the topology schema. It must
not procedurally or randomly invent printed features after game creation.

`BoardDefinition` explicitly supplies the coordinate-to-screen projection and
the six neighbor relationships (or enough orientation metadata to derive and
validate them). Legality operates on stable hex and side IDs, never pixel
positions or assumptions about a particular row/column convention.

### 6.2 Track-lane model

Track is modeled as atomic physical segments joined by explicit edge, city, or
junction nodes—not simply adjacency between revenue centers. Three or more
segments may share a junction node. Geometrically crossing segments share no
node and therefore remain disconnected.

This representation must preserve these rule distinctions:

- Junctions cannot be reversed across.
- Crossovers do not permit switching from one crossing track to the other.
- A large city connects an entering track to any other track incident to that
  same city.
- Separate cities on one hex remain distinct and may both be scored.
- Two independent track paths on one tile may be used by different trains.
- A route cannot reuse the same physical track path.

Route payloads identify an oriented segment instance as
`{ hexId, segmentId, fromNode }`. Tile-local segment IDs may repeat on different
hexes, so a bare segment ID is never globally authoritative. Continuity and
scored cities derive from the ordered oriented segments; a client does not
submit a second independently trusted list of scored cities.

### 6.3 Tile definition

```ts
type TileId = string; // original numeric Classic ID
type TileColorId = string;

interface TileDefinition {
  id: TileId;
  color: TileColorId;
  label: string | null;
  cities: CityDefinition[];
  track: TrackFragmentDefinition;
  upgradesTo: TileId[];
  supply: { kind: "finite"; quantity: number } | { kind: "unlimited" };
}

interface TileSetDefinition {
  colors: Array<{ id: TileColorId; rank: number; availableFromPhase: PhaseId }>;
  tiles: TileDefinition[];
}
```

Rotation is not embedded in a definition. The six possible rotations transform
edge endpoints at validation and rendering time. Symmetric duplicates may be
deduplicated by a selector but remain equivalent legal payloads.

### 6.4 Corporation definition

Each corporation definition supplies its certificate structure, capitalization
policy, home/destination data, station inventory, station cost schedule, visual
identity, and any typed special abilities. The generic engine does not assume
eight corporations, ten shares, a 20% president certificate, full
capitalization, one home, or the 1830 station-price sequence. Do not store train
or map state in definitions.

Static certificate percentages, names, abbreviations, colors, revenues, home
locations, and ability links live only in definitions. Mutable corporation,
certificate, and private records store IDs plus changing lifecycle, location,
price, treasury, and market data; they do not duplicate those static facts.

### 6.5 Private definition

Private definitions supply revenue, ownership/closure rules, purchase windows,
and explicit typed ability descriptors. Do not interpret human-readable effect
text in reducers. IDs and display names are never used to select behavior.

### 6.6 Train definition

Each physical train has a stable ID. Type definitions hold distance, price,
quantity, source behavior, phase trigger, rust/obsolete trigger, and any trade-in
policy. The engine does not assume 2–6 trains, Diesels, unlimited Diesels, a
specific train limit, or a particular depot order.

### 6.7 Operating rules definition

The following are definition data or closed typed policies rather than 1830
constants:

- corporation ordering and tie-breaking;
- operating action sequence, repeatability, optionality, and prerequisites;
- track-lay allowance, upgrade allowance, reachability, terrain charging, and
  special lays;
- station inventory, placement prices, home placement, and blocking semantics;
- route visit/path rules, train distance semantics, revenue modifiers, and the
  requirement to maximize revenue;
- payout/withhold options and stock-market movement;
- train-buy timing, sources, trading, limits, emergency purchase, and bankruptcy;
- phase transitions, rusting/obsolescence, private closure, and OR-set length;
  and
- end-game triggers and scoring.

The 1830 package selects the policy values described in sections 8–17. A second
map using the same mechanics can replace all manifests and costs without engine
changes. A title with a new semantic rule requires a named policy/ability kind
and engine tests, not a title-ID conditional.

## 7. Canonical mutable state

`GameState` begins with `definition: { id, version }` and contains only mutable
game facts. Runtime definition indexes (`Map`/`Set`) are derived caches and are
never serialized.

### 7.1 Map state

```ts
interface PlacedTileState {
  hexId: HexId;
  tileId: TileId;
  rotation: HexSide;
}

interface MapState {
  placedTiles: Record<HexId, PlacedTileState>;
  finiteTileSupply: Record<TileId, number>;
}
```

Printed gray and red track remains in the static board definition. Only placed
or upgraded tiles belong in mutable map state. `finiteTileSupply` contains
exactly the finite-supply tile IDs; unlimited definition pieces never use a
numeric sentinel such as `-1` or `Infinity`.

When a tile upgrades, station tokens migrate to city nodes that preserve their
existing connections. If more than one legal mapping exists, the command must
name the mapping; the UI previews it before confirmation.

### 7.2 Station-token state

```ts
type StationTokenLocation =
  | { type: "charter" }
  | { type: "map"; hexId: HexId; cityId: CityId; slot: number };

interface StationTokenState {
  id: StationTokenId;
  corporationId: CorporationId;
  sequence: number; // stable ordinal into the corporation token-cost policy
  location: StationTokenLocation;
}
```

For `1830-classic@1`, the home token is sequence 0 and free, sequence 1 costs
$40, and every later token costs $100. The selected definition determines the
price by token ordinal and may supply a different schedule. Cost is not inferred
from current map count, so save/load and special free placement remain
unambiguous.

`StationTokenState.location` is the sole occupancy source. No placed tile or
corporation stores a second token list or `homeTokenPlaced` flag. City occupancy,
remaining tokens, and home placement are derived. Printed cities and placed-tile
cities therefore use the same representation.

### 7.3 Train state

```ts
type TrainLocation =
  | { type: "depot" }
  | { type: "openMarket" }
  | { type: "corporation"; corporationId: CorporationId }
  | { type: "removed"; reason: "phaseRemoval" | "tradeIn" };

interface TrainState {
  id: TrainId;
  location: TrainLocation;
  acquiredOnOperatingTurn: number | null;
}
```

Train type is static definition data resolved from the physical train ID. Depot
order is derived from type and stable manifest order. A corporation's
trains are derived from locations; there is no second train list.

### 7.4 Phase and round-set state

```ts
type PhaseId = string;

interface PhaseState {
  id: PhaseId;
  appliedTriggerIds: string[];
}
```

Train limits, available tile colors, private-purchase permissions, revenue
schedules, rusting, and other phase effects are derived from the selected
`PhaseDefinition`; they are not copied into mutable state.

The next OR-set length is derived from the current phase definition and latched
into mutable Operating Round state only when the intervening Stock Round ends.

### 7.5 Corporation extensions

`CorporationState` gains no token or train arrays. Both forms of ownership and
home placement are derived from canonical piece locations.

Treasury remains on the corporation. Lifecycle remains the financial source for
whether a corporation can enter an Operating Round.

### 7.6 Operating Round state

Replace `OperatingShellState` with:

```ts
interface OperatingRoundState {
  setNumber: number;
  roundInSet: number;
  roundsInSet: number;
  operatedCorporationIds: CorporationId[];
  turn: CorporationTurnState | null;
  boundary: TurnBoundaryState | null;
  interruption: OperatingInterruption | null;
}

interface CorporationTurnState {
  corporationId: CorporationId;
  turnSerial: number;
  stepIndex: number;
  stepUsage: Record<OperatingStepId, number>;
  allowanceUsage: Record<AbilityId, number>;
  resolvedRun: ResolvedRunState | null;
}
```

The current step kind, label, status, and optionality derive from `stepIndex`
and the resolved definition. A mutable action kind cannot drift from the
definition. Exactly one authority mode is active: a normal corporation turn, a
between-turn boundary, or an interruption.

Do not store a frozen full operating order. At each corporation boundary,
recompute the next corporation from the unoperated set using its current market
position. This handles forced share sales that change the price of a corporation
which has not yet operated.

### 7.7 Boundaries and interruptions

The top-level discriminated unions cover generic mechanic families, never entity
names:

- `homeStationSelection` with exact legal city slots;
- `privatePurchaseConsent` and `trainPurchaseConsent` with exact entities,
  actors, and price;
- `excessTrainDiscard` with trigger, queue, current corporation, and suspended
  turn continuation;
- `forcedTrainPurchase` with a beginning-of-train-step rollback checkpoint and
  optional nested private/train-sale proposal;
- `certificateExchangeWindow` with owner, exact eligible certificates,
  boundary ID, and continuation; and
- `pendingGameEnd` with a definition-selected completion boundary.

Only commands appropriate to the active union member are accepted. Every
resolution revalidates actor authority, ownership, cash, phase, locations,
limits, and game version. Names such as Erie, M&H, NYC, C&SL, D&H, and Diesel do
not appear in generic command types; definition-issued ability IDs select typed
behavior.

### 7.8 Game completion

Add a completed-game state with reason `bankExhausted` or `bankruptcy`, final
player values, and the bankrupt player when applicable. Final scoring uses
personal cash, stock at current market value, and face value of open
player-owned privates for ordinary players. On bankruptcy, the bankrupt player
scores only remaining stock as specified in section 16.6. Corporation assets
never count.

## 8. Operating Round lifecycle

Sections 8 through 17 specify the values and behavior of
`1830-classic@1`. The generic engine reaches these results by interpreting the
selected definition and supported policy/ability kinds. Dollar amounts, entity
IDs, coordinates, action allowances, phase triggers, and sequence rules in
these sections are 1830 package facts, not global engine constants.

### 8.1 End of Stock Round

After all Stock Round end movement and Priority Deal updates:

1. Update float eligibility.
2. Determine the number of Operating Rounds in the coming set from the currently
   scheduled value.
3. Create `OperatingRoundState` for round 1 of that set.
4. Do not pay private revenue or capitalize corporations until Operating Round
   initialization.

An Operating Round still initializes when no corporation has floated: pay
private income, then immediately advance through the empty round. After the
latched number of empty Operating Rounds, begin the next Stock Round or finish
at a pending Bank-break deadline.

### 8.2 Start of each Operating Round

1. Capitalize each newly float-eligible corporation exactly once for ten times
   par and mark it operating.
2. Pay every still-open private company once, in increasing face-value order,
   to its current player or corporation owner.
3. If any full payment takes Bank cash to zero or below for the first time,
   latch the current Operating Round set as the final set while preserving full
   spending power as described in section 17.
4. Clear the operated set for this round.
5. Select the first corporation using current market order.
6. At the selected corporation's first-ever turn, place or resolve its free home
   station before normal step 1.

Private income is paid before corporations can buy privates. A private bought by
a corporation during the round does not pay again until the next Operating
Round.

### 8.3 Corporation order

Among operating corporations that have not yet operated this round, sort by:

1. Higher current market price.
2. If equal price in different columns, farther right.
3. If equal price in the same column, farther up.
4. If sharing one market cell, lower `stackIndex` (top token first).
5. Static corporation definition order only as a corruption-safe final tie.

After every corporation turn and after any forced sale affecting an unoperated
corporation, choose the next corporation from current state rather than from a
stale round-start array.

### 8.4 Home station

At the beginning of a corporation's first operating turn:

- Place its home token free in the printed home city.
- It does not consume the optional station action.
- Erie chooses either city in its E-11 home hex; no other corporation may token
  that hex until Erie establishes its home.
- Multiple-home scenario data in the PDF is ignored because it is not Classic.
- The home token cannot be moved later.

Home behavior is definition data. A deterministic single legal home slot is
placed automatically. A multiple-choice home creates the generic
`homeStationSelection` interruption; `1830-classic@1` uses that mechanism for
Erie. Printed city IDs exist before a tile is placed, and later placement or
upgrade preserves/migrates the home token through the same explicit mapping as
every other token.

### 8.5 Ordered steps

The rules' five steps are Construct Track, Place Station, Run Trains, Collect
Revenue, and Buy Trains. The UI and command protocol group Run Trains and
Collect Revenue into one atomic `runTrains` action because the route set,
maximum revenue, and dividend/withhold disposition must be validated together.
The configured action sequence is therefore:

1. Construct Track.
2. Place Station.
3. Run Trains and resolve revenue.
4. Buy Trains.

Track and station steps end through explicit finish commands. Finishing a step
abandons every unused normal or special allowance for that step, so saves and
remote clients agree on progress. Run Trains is never a general skip: when the
computed maximum is zero, `resolveNoRun` atomically records zero withheld
revenue and the required left/down market movement. `finishTrainBuying` is the
only normal corporation-turn completion command; it either ends the turn or
enters mandatory-train financing.

A corporation may buy a private company at any point in its turn during phases
3 and 4. That transaction does not reorder or skip the current operating step.
If it buys an ability whose relevant step has already finished, that ability
waits until its next Operating Round. C&SL's normal and special lays may occur in
either order before finishing track. D&H's free station is additional to the
normal station action but expires when that same turn's station step finishes.

### 8.6 Corporation and round completion

After `finishTrainBuying` accepts:

1. Add the corporation to `operatedCorporationIds` exactly once.
2. If another unoperated operating corporation exists, open the serialized M&H
   boundary described in section 15 when eligible, then dynamically select the
   next corporation using current market positions.
3. If no corporation remains and another Operating Round remains in the latched
   set, open the same eligible boundary, increment `roundInSet`, initialize the
   next Operating Round, pay private income, and clear the operated set.
4. If the set is complete, do not open an M&H window: either complete the game
   at a latched Bank-break deadline or begin the next Stock Round.

A corporation made float-eligible during an Operating Round—including via M&H—
does not capitalize or operate until the next Operating Round initialization.

## 9. Construct Track

### 9.1 Normal action

Once per corporation turn, the president may either:

- place one available yellow tile on a legal tan hex;
- upgrade one existing tile to an available next-color tile; or
- skip track construction.

Placement and upgrade are alternatives. A normal corporation cannot do both.

### 9.2 Reachability

At least one track path on the placed or upgraded tile must be reachable by a
legal route of any length from one of the corporation's stations. Reachability:

- observes fully blocked cities;
- does not require an owned train;
- does not require the reachable path to be usable in a maximum train run;
- may reach one path while other independent paths on the same tile remain
  unreachable;
- uses the Classic open-lay clarification, not a restrictive closed-lay variant.

Exceptions are NYC's #57 home lay, Erie's #59 home lay once green is available,
C&SL B-20, and D&H F-16 as described below.

### 9.3 Placement validation

The engine validates all of the following atomically:

- It is the active corporation's track step.
- The named tile exists and supply is positive.
- The tile color is currently available.
- A fresh tan hex receives a yellow tile only.
- The tile's city/town shape matches the printed hex.
- Special OO, B, and NY positions receive the required labeled tile.
- The rotated track does not run off the grid, into a blocked gray side, or into
  a solid water boundary.
- At least one path is reachable unless a named exception applies.
- A player-owned open private does not block the hex.
- The corporation treasury can pay the terrain cost before revenue is earned.
- The corporation has not already used its normal track action.

The engine decrements tile supply and pays $80 for water or $120 for mountain.
The Erie home has no terrain fee. Terrain is charged only for the initial tile,
never for a later upgrade.

### 9.4 Upgrade validation

In addition to general reachability and boundary checks:

- The target tile ID must appear in the current tile's page-28 successor list.
- Yellow upgrades to green and green to brown only when that color is available.
- Every old track path must be preserved in the same orientation.
- Every existing station token must map to a city with the same old connections.
- A labeled tile keeps the same OO, B, or NY label.
- Replaced yellow or green tiles return to supply. Brown is the final Classic
  tile color and is never replaced.
- Upgrades cost no terrain fee.

### 9.5 Special private track actions

#### C&SL

An owning corporation may, while C&SL is open, place a tile on B-20 without
station reachability. It may make this special placement in addition to its
normal placement in the same turn. The action becomes unavailable once B-20 has
a tile or the private closes or changes ownership.

The commands name exact definition-issued step or ability allowance IDs so the
normal and special lays cannot consume each other. No generic command contains
the C&SL ID.

#### D&H

An owning corporation may place a tile on F-16 without station reachability.
This consumes its normal track placement and costs $120. In the same turn it may
place a free station in the city. If the corporation does not place the free
station then, any later station there follows normal reachability and cost.

If another corporation legally places the first tile on F-16, the D&H special
placement and free-station opportunity expire.

The free station uses the definition-issued additional station allowance from
section 2.4. It does not consume the normal station action, but both the tile and
free station must occur in their respective steps of the same corporation turn.

## 10. Place Station

### 10.1 Normal station action

After track, a corporation may place at most one additional station token or
skip. The home station does not count against this limit.

### 10.2 Legality

The target must:

- be a large-city circle, not a town;
- have an empty station slot;
- be reachable by a legal route of any length from an existing corporation
  station without passing through a fully blocked city;
- be on a hex where the corporation has no other station;
- not fill the slot required for an unstarted corporation's future home token;
- respect Erie's protected home before Erie places its home;
- have an available token in the corporation's charter.

### 10.3 Cost

- Home token: free.
- First additional token: $40.
- Every later token: $100.
- D&H's same-turn additional special token: free.

Payment comes from the corporation treasury immediately. Revenue earned later
in the turn is unavailable.

### 10.4 Blocking semantics

A city with at least one empty circle remains passable by all corporations. When
all circles contain other corporations' stations, a route may terminate there
but may not pass through. The same blocking rule applies to reachability for
track and station placement.

## 11. Run Trains, routes, and revenue

### 11.1 One integrated action

`Run Trains` opens route construction and concludes with one command containing:

- zero or one route per currently owned train;
- exact ordered oriented segment-instance references for each route; and
- the revenue disposition: `dividend` or `withhold`.

The engine derives visited/scored cities, continuity, and revenue from those
segments. It rejects payloads that attempt to assert an independent city or
revenue list.

Dividend choice is part of running trains. It is not a separate top-level
corporation action.

### 11.2 Route legality

Each submitted route must:

- contain at least two scored cities;
- be continuous;
- include at least one city containing the operating corporation's station;
- never reverse at a junction;
- never change tracks at a crossover;
- never reuse a physical track path;
- never score the same city twice;
- permit separate cities on one hex to be scored independently;
- stop at a fully blocked city unless the corporation owns a station there;
- use an off-board red area only as an endpoint, never an intermediate city;
- not use the same off-board area as both ends;
- score every city the track passes through rather than skipping one;
- score no more cities than the train distance, except D which has no maximum.

A train may run shorter than its maximum if that participates in the highest
legal total for the corporation.

### 11.3 Multiple trains

Each train may run at most once. Routes for different trains may meet or cross
at cities and may use separate paths on the same tile, but they may not share a
physical track path. The combined set, not each route in isolation, is validated.

### 11.4 Maximum revenue

The rules require the highest legal revenue that can be demonstrated. The
digital engine will provide a deterministic exact optimizer over the current
track graph and train multiset.

- A submitted run is accepted only if its total equals the computed maximum.
- When multiple maximum runs exist, any maximum run is legal.
- The UI may offer `Use best run`, but the optimizer result is not strategy
  advice beyond enforcing the mandatory maximum.
- Optimizer tie-breaking is stable for display and tests: higher total, then
  train manifest order, then lexicographic path IDs.
- Performance work may cache graph fragments by map version, but cache data is
  never serialized and cannot affect results.
- On the checked-in canonical late-game benchmark, the exact result must finish
  within 1,000 ms at p95 over 20 warm runs on the project verification machine.
  Correctness is never abandoned on timeout; a slower implementation fails the
  performance gate and must be improved before production cutover.

### 11.5 Revenue calculation

Revenue is the sum of every scored city on every accepted route. Red off-board
areas use low values before phase 5 and high values from the first 5-train
purchase onward.

Open private-company income is not included in train revenue and is never
available for dividends.

### 11.6 Dividend

When `dividend` is selected:

- Pay each player from the Bank according to owned share percentage.
- Pay the corporation for shares in the Bank Pool.
- Pay nothing for Initial Offering shares; that portion remains in the Bank.
- Move the corporation market token one space right, or one row up if it is at
  the right end of its track.
- Place a moving token beneath all tokens already in the destination.

### 11.7 Withhold or no dividend

When `withhold` is selected, place all train revenue in the corporation treasury
and move its market token one space left, or one row down if the left end blocks
movement.

An operating corporation that pays no dividend moves left even when it owns no
train, has no legal route, or earns zero, because saved rule 8.2 applies when no
dividend is paid "for whatever reason."

### 11.8 No trains or no routes

- A corporation whose computed maximum is zero uses `resolveNoRun`; it cannot
  declare a dividend, records zero withheld revenue, and moves left/down.
- Whether a train purchase becomes mandatory is evaluated at the end of the
  train-buy step from the existence of any legal two-city route.

## 12. Buy Trains

### 12.1 Timing and repetition

Train purchase is the final operating step. A corporation may buy zero or more
trains, one at a time. Before a purchase, it must be below the current
pre-purchase limit; an eligible trade-in is removed before that capacity check.
A depot purchase may introduce a lower limit and create a post-purchase excess,
matching the first-5 rules example. Intercorporate and open-market purchases
that do not trigger a new phase may not exceed the current limit. Every purchase
resolves all triggered effects and excess-discard interruptions before another
purchase is allowed.

Newly purchased trains cannot run until the corporation's next Operating Round.

### 12.2 Sources

A corporation may buy:

- the next available depot train at face value;
- an eligible discarded train from the open market at face value, paid to Bank;
- a train from another corporation for a mutually agreed price of at least $1.

It may buy another corporation's last train. A seller is never forced to agree,
including when both corporations share a president, though a shared president
may accept both sides directly.

### 12.3 Corporation-to-corporation trade

The buying president proposes a train and exact price. The selling president
accepts or rejects unless the same player controls both, in which case one
command may complete the transfer. The buyer must have the treasury cash and
train capacity at acceptance time.

Emergency financing retains an immutable beginning-of-train-step checkpoint.
If its forced sales change the selling corporation's presidency, the new
president may cancel that contemplated train sale; cancellation restores the
whole checkpoint as required by PDF section 6.6.3, including the emergency
sales and market movements in that branch.

### 12.4 Depot order

All trains of the current type must leave the depot before the next type is
available. Once the first 6 is purchased, D trains are also available alongside
remaining 6 trains.

### 12.5 Diesel trade-in

A D costs $1100 or $800 plus one owned 4, 5, or 6. The traded train moves to the
open market unless the D purchase immediately removes it. The first D removes all
remaining 4-trains everywhere, including an offered or traded 4.

### 12.6 Train limits and excess trains

- Phases 2 and 3: four trains.
- Phase 4: three trains.
- Phases 5, 6, and 7: two trains.

When a phase change lowers the limit, every over-limit corporation discards
without compensation until legal. If several corporations must discard, resolve
them in current market order, highest first. These decisions interrupt the
buying corporation's turn. Discarded trains go to the open market unless the
triggering phase simultaneously rusts their type.

A corporation may not voluntarily scrap or discard a train to create capacity.

## 13. Phase transitions

Only the once-only global introduction of a new type from the depot applies its
phase effects immediately and atomically. A later purchase of that type from the
open market or another corporation never retriggers a phase.

### First 3

- Phase becomes 3.
- Green tiles become available.
- Corporations may buy private companies.
- Schedule two Operating Rounds after the next Stock Round.

### First 4

- Phase becomes 4.
- Remove every 2-train from corporations, depot, open market, and pending offers.
- Lower the train limit to three and resolve excess discards.

### First 5

- Phase becomes 5.
- Brown tiles become available.
- Close every remaining open private company.
- Immediately remove closed private certificates from certificate-limit counts.
- Disable all private powers and pending private purchases.
- Use high red off-board revenue immediately.
- Lower the train limit to two and resolve excess discards.
- Schedule three Operating Rounds after the next Stock Round.

### First 6

- Phase becomes 6.
- Remove every 3-train.
- Make D trains available alongside any remaining 6s.

### First D

- Phase becomes 7.
- Remove every 4-train, including a traded-in 4.

Buying the B&O corporation's first train closes the B&O private immediately
regardless of whether the train came from the depot, open market, another
corporation, or a trade-in purchase.

Phase removals never pay compensation. A corporation made trainless by a phase
removal may
be required to buy at the end of its next operating turn, not immediately during
another corporation's purchase.

## 14. Corporation purchases of private companies

During phases 3 and 4, at any point in the buying corporation's turn:

- The private must be open and player-owned.
- B&O is never eligible.
- Price must be publicly declared and between half and twice face value,
  inclusive.
- The corporation treasury pays the player.
- Buyer and seller consent are both required. When the corporation president is
  also the player seller, one command may complete both roles.
- A corporation-owned private cannot later be sold.
- The purchase does not immediately pay private income.

Pending purchase proposals close without transfer if the first 5 is bought or
if actor, owner, cash, or phase legality changes before acceptance.

## 15. M&H exchange timing

The player owner may exchange M&H for an available NYC 10% certificate:

- during that player's Stock Round turn;
- between player turns in a Stock Round; or
- between corporation turns in an Operating Round.

The player may not already own 60% of NYC. The command selects an exact eligible
certificate from the Initial Offering or Bank Pool; neither location has an
engine-invented priority over the other. Apply ordinary certificate-limit and
presidency consequences required by the rules. Close M&H immediately.

The exchange is not permitted in the middle of another corporation's unresolved
step or pending decision.

This timing is represented as serializable authority, not a UI race:

- During the owner's active Stock turn, the owner may execute the typed
  certificate-exchange ability while no trade decision is pending, then continue
  that same turn.
- After each nonterminal Stock turn and before installing the next actor, create
  a `certificateExchangeWindow` when the exchange is legal. The owner must
  exchange an exact eligible certificate or defer that exact boundary.
- After each corporation turn and between Operating Rounds within one latched
  set, create the same window before selecting the next corporation or starting
  the next Operating Round. Do not create it before the first corporation or
  after the set's final corporation.
- Every window stores a unique boundary ID and exact continuation. A stale,
  duplicate, or wrong-actor command is rejected.

The exchange does not consume the Stock turn's one-certificate purchase, reset
consecutive passes, set the last-transaction player, or change Priority Deal. It
does update ownership, presidency, certificate-limit correction, and float
eligibility immediately. An NYC made float-eligible mid-OR waits until the next
Operating Round initialization.

## 16. Forced train purchase and emergency financing

### 16.1 Trigger

At the end of the train-buy step, a corporation with no train must buy one if
there exists any legal route of at least two cities available to it. If no such
route exists, it may finish without a train.

### 16.2 Voluntary resolution before compulsion

The president may first complete any normal legal purchase, including an agreed
purchase from another corporation. If the requirement remains unresolved, the
forced sequence begins.

`finishTrainBuying` is the single transition into this state. It stores an
immutable checkpoint from the beginning of the train-buying step and the exact
active corporation/president. There is no separate client command that merely
asserts emergency financing is required.

### 16.3 Corporation funds

If buying from the Bank during the forced sequence, the corporation must choose
the cheapest Bank alternative: the currently available depot type or any
still-usable returned train in the open market. Stable source and train ID break
exact-price ties. A mutually agreed corporation-to-corporation purchase may
satisfy the train requirement, but no other corporation is compelled to offer a
train and its negotiated price is not used to redefine the Bank's cheapest
alternative.

### 16.4 President contribution

If the corporation cannot afford the cheapest train but corporation plus
president cash can:

- spend all corporation cash first;
- use only the president cash required for the deficiency;
- if buying from another corporation, pay no more than face value;
- return any excess raised by indivisible stock sales to the president, not the
  corporation.

Personal money cannot support voluntary extra trains or any other corporation
expense.

### 16.5 Forced sales

If combined cash is still insufficient, the pending forced-purchase state
collects a deterministic liquidation plan. It does not mutate canonical money,
certificates, markets, or presidencies until an exact train purchase or
bankruptcy command commits the plan.

- The president supplies ordered sale batches. Each batch names one corporation
  and exact certificate IDs.
- Every certificate in one batch pays the market price before that batch's
  downward movement; the next corporation batch uses its then-current price.
- Apply normal Pool 50% limits and all normal certificate-sale restrictions.
- Reject a batch that changes presidency of the trainless corporation.
- Apply presidency changes in other corporations during simulation, including
  their effect on any contemplated train seller.
- Stop accepting batches once the cheapest required purchase is fundable. The
  final indivisible certificate may overraise; excess belongs to the president.
- A player-owned private may be included only after a serialized proposal names
  another player buyer and exact mutually agreed price, the buyer has cash, and
  the buyer consents. An out-of-turn corporation cannot buy it. Such a sale is
  optional and is never assumed for bankruptcy proof.
- A willing corporation train sale may satisfy the requirement. If president
  money contributes, its price cannot exceed face value.

The pure liquidation simulator revalidates the plan after every batch. The same
simulator drives selectors, previews, purchase execution, bankruptcy proof, and
tests. An invalid final batch, stale certificate, changed actor, unavailable
train, illegal Pool total, or unaffordable result rejects the whole command with
no partial mutation.

If simulated presidency change gives a contemplated selling corporation a new
president, that president may cancel. Cancellation restores the stored
beginning-of-train-step checkpoint, exactly as PDF section 6.6.3 requires.

### 16.6 Bankruptcy

`declareBankruptcy` is accepted only after an exhaustive bounded search proves
that no legal ordered stock-sale sequence, combined with corporation and
president spendable cash, can buy the cheapest Bank/depot or open-market train.
Unconsented private or corporation-train deals are optional and do not block the
proof. The submitted liquidation must be maximal: after it, no additional legal
stock sale remains. If any legal funding sequence exists, reject bankruptcy and
return legal alternatives.

On acceptance, commit the maximal liquidation and end the game immediately. No
later corporation operates and no pending action completes.

The bankrupt player's final value is the market value of remaining stock they
could not sell. Other players receive ordinary final scoring.

## 17. Bank exhaustion and final scoring

The first payment that would take Bank cash to zero or below permanently latches
an end schedule. It never disappears if the Bank later receives money. To match
paper accounting in saved rule 25 and PDF section 7.0, every Bank payment is
still credited in full as spendable player cash or corporation treasury. Bank
cash may therefore become negative, representing the paper ledger; this keeps
financial conservation exact and cannot create a false inability to buy track,
stations, or trains.

- If Bank exhaustion occurs in a Stock Round, finish that Stock Round and the
  complete following Operating Round set.
- If it occurs during an Operating Round set, finish the current and all
  remaining Operating Rounds in that already-latched set.
- End immediately before the next Stock Round would start.
- Continue all incoming and outgoing Bank transactions normally. Negative Bank
  cash is public audit state, not a non-spendable player claim.

Final player value is:

- personal cash;
- stock shares times current market price;
- face value of open player-owned privates.

Corporation treasury, trains, tokens, and corporation-owned privates do not
count. Highest value wins; ties are reported as ties because the rules provide
no additional tiebreaker.

## 18. Command surface

The shell command is deleted and replaced by commands grouped below.

### Round and step progression

- `operating.placeHomeStation`
- `operating.chooseErieHome`
- `operating.skipTrack`
- `operating.skipStation`
- `operating.skipRunTrains`
- `operating.finishCorporationTurn`

### Map

- `operating.layTile { corporationId, hexId, tileId, rotation, allowance }`
- `operating.upgradeTile { corporationId, hexId, tileId, rotation, tokenMapping }`
- `operating.placeStation { corporationId, tokenId, hexId, cityId, allowance }`

`allowance` is `normal`, `cslSpecial`, or `dhSpecial` where applicable.

### Routes and revenue

- `operating.runTrains { corporationId, routes, disposition }`

`disposition` is `dividend` or `withhold`. The command resolves revenue,
payments, and market movement together.

### Private purchases and exchange

- `operating.proposePrivatePurchase`
- `operating.respondPrivatePurchase`
- `private.exchangeMHForNYC`

### Train actions

- `operating.buyDepotTrain`
- `operating.buyOpenMarketTrain`
- `operating.proposeTrainPurchase`
- `operating.respondTrainPurchase`
- `operating.buyDieselWithTradeIn`
- `operating.discardExcessTrain`
- `operating.beginForcedPurchase`

### Emergency financing

- `operating.emergencySellCertificates`
- `operating.proposeEmergencyPrivateSale`
- `operating.respondEmergencyPrivateSale`
- `operating.completeForcedPurchase`
- `operating.declareBankruptcy`

All commands name exact entity IDs. No command says "buy cheapest," "place any
token," or "use best route" without a deterministic payload chosen from a
selector projection.

## 19. Structured errors and events

Add focused error codes including:

- `NOT_CURRENT_CORPORATION_PRESIDENT`
- `OPERATING_STEP_OUT_OF_ORDER`
- `TILE_NOT_AVAILABLE`
- `TILE_COLOR_NOT_AVAILABLE`
- `ILLEGAL_TILE_ROTATION`
- `ILLEGAL_TILE_UPGRADE`
- `TRACK_NOT_REACHABLE`
- `HEX_BLOCKED_BY_PRIVATE`
- `TERRAIN_COST_UNAFFORDABLE`
- `STATION_NOT_REACHABLE`
- `STATION_SLOT_OCCUPIED`
- `STATION_SUPPLY_EXHAUSTED`
- `ROUTE_ILLEGAL`
- `ROUTE_REVENUE_NOT_MAXIMUM`
- `TRAIN_NOT_AVAILABLE`
- `TRAIN_LIMIT_REACHED`
- `TRAIN_TRADE_NOT_PERMITTED`
- `PRIVATE_PURCHASE_NOT_PERMITTED`
- `MANDATORY_TRAIN_PURCHASE_REQUIRED`
- `EMERGENCY_FINANCING_REQUIRED`
- `FORCED_SALE_NOT_PERMITTED`
- `BANKRUPTCY_NOT_ESTABLISHED`
- `GAME_ALREADY_COMPLETE`

Domain events must identify relevant corporation, player, hex, tile, token,
train, amount, phase, and market positions as structured data. Notification
text is projected outside the engine.

## 20. Selectors

Selectors provide complete read models without duplicating legality in React:

- `getOperatingRoundView`
- `getCurrentCorporation`
- `getNextOperatingCorporation`
- `getCorporationOperatingAssets`
- `getLegalTrackHexes`
- `getLegalTilePlacements(hexId)`
- `getLegalTileUpgrades(hexId)`
- `getLegalRotations(hexId, tileId)`
- `getLegalStationPlacements`
- `getRouteGraph(corporationId)`
- `getMaximumRun(corporationId)`
- `validateDraftRun(corporationId, routes)`
- `getTrainDepotView`
- `getLegalTrainPurchases`
- `getPhaseView`
- `getPrivatePurchaseOptions`
- `getEmergencyFinancingView`
- `getFinalScoreView`

Selectors may return explanatory reason codes for disabled actions. They never
return mutable engine objects.

## 21. Engine invariants

Run the existing financial invariants plus:

1. Every tile supply count is an integer between zero and printed quantity.
2. Printed quantity equals supply plus tiles currently on the board for every
   reusable tile.
3. Every placed tile is legal for its board hex shape and label.
4. Every station token has exactly one valid location.
5. A city slot contains at most one station token.
6. A corporation never has two stations on one hex.
7. Erie protection holds until its home is placed.
8. Every train has exactly one valid location.
9. Depot order never exposes a later type early, except D alongside 6 after the
   first 6.
10. No corporation exceeds the current train limit outside an explicit pending
    excess-discard decision.
11. Rusted or traded-away trains cannot be used in a run.
12. Phase never moves backward and every phase trigger occurs at most once.
13. Closed privates have no owner, income, or usable ability.
14. Corporation-private purchase prices respect the legal range.
15. Operating steps never move backward within a corporation turn.
16. A corporation appears exactly once in the operated set per Operating Round.
17. Current corporation is operating, unoperated, and controlled by the command
    actor except during a typed pending decision.
18. A resolved run uses owned trains, legal non-overlapping routes, and maximum
    revenue.
19. Revenue and dividend transfers conserve total ledger value even when Bank
    cash is negative after the end trigger.
20. Completed-game state accepts no gameplay command.
21. Definition ID/version resolves exactly, and all mutable entity IDs exist in
    that resolved definition.
22. Action index, action kind, and progress conform to the selected definition's
    operating sequence and allowance policies.

## 22. Save, undo, and versioning

### 22.1 Save schema

The expanded model requires `schemaVersion: 3`, `gameDefinitionId`,
`gameDefinitionVersion`, and a new engine version. Every map, train, phase,
round, pending-decision, and completion field is validated against that exact
definition before load.

Version-2 shell saves cannot be migrated rules-correctly because prior shell
turns omitted track, trains, dividends, market movement, and mandatory train
purchases. The loader rejects them as incompatible rather than fabricating a
history. The menu explains that a new game is required.

### 22.2 Undo

Accepted commands continue to store complete immutable snapshots. Rejected
commands create no snapshot. A multi-step proposal and acceptance are separate
commands and therefore separate undo points in local play.

Undo is disabled after game completion unless the user explicitly returns to
the active game through the existing local undo control. Multiplayer rollback
policy remains deferred.

### 22.3 Determinism

- Static manifests have stable ordering.
- Route optimization has stable tie-breaking.
- IDs for setup-created physical pieces derive deterministically from game
  definitions.
- No reducer reads wall time, browser state, object iteration accident, or SVG
  geometry.
- All commands and accepted states remain JSON-serializable.

## 23. UI and interaction design

### 23.1 Overall layout

- The main game area renders the selected definition's board; production 1830
  games therefore render the canonical Classic board.
- The existing sidebar continues to show player summaries.
- The compact corporation pane remains below the board with one tab per
  operating corporation.
- Current corporation and End Turn live in the top header beside Main Menu.
- A Stock Market control restores the prior board/market toggle without moving
  core corporation information.

### 23.2 Corporation pane

The left column remains narrow:

- Treasury.
- Current market price.
- Player ownership with president first and gold `P`.

The wider right column shows actual Operating Round data:

- Current step and completed steps.
- Owned trains.
- Available station tokens and next cost.
- Current run and revenue after route confirmation.
- Corporation-owned private companies and usable abilities.
- Phase-relevant warnings, including mandatory train purchase.

For `1830-classic@1`, the 2x2 action grid remains to the right of the corporation
heading:

| Construct Track | Place Station |
|---|---|
| Run Trains | Buy Train |

Buttons become enabled only in their legal step. Completed actions remain
visually completed, not merely disabled. Pay Dividend never appears as a fifth
top-level action.

The UI obtains action labels, order, availability, tile palette, token counts,
and train choices from definition-backed selectors. The four labels above are
not a global fixed array; another compatible definition may omit, repeat, or add
a supported action kind and the pane lays out the resulting controls without a
title-specific component fork.

### 23.3 Map interaction

Construct Track:

1. Highlight legal hexes.
2. Select a hex.
3. Show only legal tile IDs with remaining counts.
4. Preview legal rotations directly on the board.
5. Display terrain cost and special allowance.
6. Confirm once; dispatch exact placement.

Place Station:

1. Highlight legal city slots.
2. Show token cost before selection.
3. Preview blocking consequences.
4. Confirm exact token and city slot.

### 23.4 Route interaction

- Selecting Run Trains shows each owned train.
- The user may draw routes or accept the engine's best run.
- Used paths are color-coded per train.
- Illegal continuity, crossover, blocking, repeat-city, and shared-path errors
  appear at the affected path.
- Revenue updates live from selector validation.
- Confirmation presents `Pay dividends` and `Withhold` together with exact
  player/corporation payouts and resulting market movement.
- The command is dispatched only after disposition is chosen.

### 23.5 Train interaction

The Buy Train surface shows:

- next depot train and price;
- eligible open-market trains and face prices;
- trains other corporations may sell;
- current train limit and owned trains;
- Diesel trade-in options;
- phase effects before confirmation.

Negotiated purchases use a modal naming buyer, seller, train, price, and both
presidents. Emergency financing replaces the normal modal with a shortfall and
legal-sale workflow.

### 23.6 Accessibility and responsive behavior

- Board operations must be usable by keyboard as well as pointer.
- Hex, tile, token, train, and route controls expose meaningful labels.
- Color is never the only indicator of corporation, phase, legality, or route.
- On narrow screens, the corporation pane stacks but the map remains pannable
  and zoomable.
- Focus returns to the invoking action after modal cancellation.

## 24. Verification strategy

### 24.1 Static-data fixtures

1. Definition-schema rejection fixtures for every dangling reference and
   invalid manifest class listed in section 6.0.
2. Synthetic non-1830 map/ruleset proving topology, tile, station, corporation,
   train, phase, action, render, and persistence parameterization.
3. Board coordinate and home/private-location fixture.
4. Complete T-09 Classic tile manifest and upgrade graph.
5. Classic station-token counts and home coordinates.
6. Classic train quantities, prices, and phase triggers.
7. Private abilities and closure triggers.

Static fixtures require independent review against the repository PDF and board.
The current prototype is not an acceptable second source.

### 24.2 Track scenarios

- Every yellow tile shape and rotation on matching and mismatching hexes.
- Reachable and unreachable paths on multi-path tiles.
- Grid edge, gray blank edge, and water boundary rejection.
- $80 water, $120 mountain, Erie free home, and no repeat upgrade charge.
- Private-owned blocked hex and corporation-owned/closed exception.
- NYC #57, Erie #59, C&SL extra lay, and D&H lay/token.
- Every legal and illegal T-09 upgrade family.
- Token migration across single-city, tangent-city, and separate-city upgrades.
- Tile exhaustion and returned-tile reuse.

### 24.3 Station scenarios

- Free home placement for all eight corporations.
- Erie's choice and protection.
- $40 then $100 costs.
- No slot, no token, no route, blocked route, duplicate-hex rejection.
- Multi-slot city remains open until full.
- Full city blocks through routes but permits termination.
- Unstarted home cannot be blocked.

### 24.4 Route scenarios

- Continuity, junction reversal, crossover switching, repeated path, repeated
  city, separate same-hex cities, and off-board endpoint rules.
- Station inclusion and fully blocked cities.
- Two through six train limits and unlimited D.
- Multiple train non-overlap with shared cities and independent same-tile paths.
- Low/high off-board revenue transition.
- Exact maximum selection and equal-revenue alternate runs.
- Empty run with no train or no possible route.

### 24.5 Dividend scenarios

- Player, Pool, and Initial Offering portions.
- Corporation Pool income.
- Dividend right/up market movement and withhold left/down movement.
- Bottom stacking at destination.
- Zero/no-route no-dividend movement.
- Bank exhaustion during capitalization, private income, stock sales, and
  dividends, with full spendability and a permanent end deadline.

### 24.6 Train and phase scenarios

- Depot type ordering and one-at-a-time purchase.
- Open-market discard and repurchase.
- Negotiated inter-corporation sale, last-train sale, shared president, rejection,
  and presidency-change cancellation.
- Each phase trigger, rust set, tile availability, private closure, off-board
  revenue, train limit, and future OR count.
- Multi-corporation excess discards in market order.
- Diesel $1100 and $800 trade-in paths.
- B&O private closure on its first train.

### 24.7 Emergency and endgame scenarios

- No route exemption from train requirement.
- Corporation-only forced purchase.
- President cash contribution.
- Forced stock sales with Pool movement and other presidency changes.
- Prohibition on dumping the trainless corporation.
- Optional emergency private sale.
- Cheapest-train recomputation.
- Bankruptcy and immediate stop.
- Bank break in Stock Round, early/middle/last OR of a set, and final scoring.

### 24.8 End-to-end games

At minimum, deterministic scripted games must cover:

1. First OR through first 3, two-OR sets, first 5, three-OR sets, first 6, and D.
2. All corporations floated with shared stock-market cells and dynamic order.
3. All private abilities before closure.
4. A forced train purchase that changes another presidency.
5. Bankruptcy.
6. Bank exhaustion and completed final scoring.
7. Save/reload and undo during each operating step and pending-decision type.

### 24.9 Quality gates

- Unit and scenario tests.
- TypeScript build.
- ESLint.
- Production build.
- Determinism replay: command log produces byte-equivalent normalized state.
- Manual keyboard and pointer walkthrough at desktop and narrow widths.
- Visual review in light and dark themes.

## 25. Delivery sequence

The milestone should be implemented behind integration gates rather than as one
large UI rewrite.

### Gate 1 — Definition framework, 1830 package, and model

- Implement `GameDefinition`, definition indexing, exhaustive validation, and
  exact-version resolution for new and saved games.
- Transcribe the 1830 board, tiles, trains, tokens, phases, and private abilities
  into `1830-classic@1`; keep them out of generic engine modules.
- Add a small synthetic ruleset fixture with deliberately different map shape,
  tile IDs, station inventory/cost schedule, corporations, trains, and phases.
- Extend model, save validation, errors, events, and invariants.
- No production UI switch yet.

### Gate 2 — Map topology and rendering

- Replace random board generation with rendering of the selected definition's
  board; use `1830-classic@1` in production.
- Render printed track, revenue centers, terrain, labels, homes, and placed tiles.
- Add pan, zoom, theme support, and accessible hex selection.

### Gate 3 — Track and station engine

- Implement graph derivation, legal tile placement/upgrades, inventory, terrain,
  private exceptions, home tokens, station placement, and blocking.
- Wire Construct Track and Place Station.

### Gate 4 — Trains, routes, and revenue

- Add train manifest and ownership.
- Implement route graph, legal runs, optimizer, revenue, dividends, withholding,
  and operating market movement.
- Wire Run Trains.

### Gate 5 — Depot, trades, phases, and privates

- Implement depot/open market, negotiated trades, train limits, discards,
  rusting, phases, OR counts, corporation private purchases, and remaining
  private abilities.
- Wire Buy Train and private actions.

### Gate 6 — Emergency financing and completed game

- Implement mandatory trains, president contribution, forced sales, bankruptcy,
  Bank-break completion, negative-Bank ledger accounting, and final scoring.

### Gate 7 — Persistence, cleanup, and verification

- Introduce schema v3.
- Remove `OperatingShellState`, shell commands, warning labels, and obsolete map
  managers/prototypes after live import proof.
- Complete scripted games, manual walkthroughs, and verification record.

Each gate must leave one canonical path. Legacy prototype legality must never run
alongside the new engine as a fallback.

Each gate must also preserve the definition boundary. A change that makes the
1830 fixture pass by introducing an 1830 entity ID, coordinate, tile ID, train
name, phase threshold, station count, or price into a generic module fails that
gate.

## 26. Acceptance criteria

The milestone is complete only when:

1. The canonical 1830 Classic board, tile supply, train roster, station-token
   supply, and private powers match the repository rules PDF.
2. Every floated corporation operates in rules-correct dynamic market order.
3. Private income and capitalization occur exactly once at the correct timing.
4. Home stations, normal stations, costs, reachability, and blocking are correct.
5. Every accepted tile placement/upgrade is legal under sections 18 and T-09,
   and illegal placements are rejected by the engine.
6. Every accepted route set is legal, non-overlapping, and maximum revenue.
7. Dividend and withhold choices transfer the correct money and move the market
   correctly, including zero/no-dividend cases.
8. Train purchases, trades, discards, rusting, phase effects, and Diesel
   trade-ins are correct and resolve one train at a time.
9. One, two, and three Operating Round sets begin at the correct Stock Round
   boundary and never change length midway.
10. All Classic private effects and corporation purchases work only at legal
    times and close correctly.
11. Mandatory train ownership, emergency financing, forced sales, presidency
    effects, and bankruptcy follow Classic rather than Base Game rules.
12. Bank exhaustion completes exactly the required round set and produces
    correct final scores.
13. Every accepted state passes financial, map, token, train, phase, round, and
    completion invariants.
14. Save/reload and undo preserve exact map and operating progress without
    mutable class instances or browser-only values.
15. The production UI exposes no enabled placeholder action and preserves the
    approved layout, palette, top turn tracker, player summaries, and compact
    corporation pane.
16. The engine remains independent of React, Zustand, browser storage, SVG,
    wall-clock time, and network transport.
17. Automated gates and the complete manual walkthrough pass on the integrated
    branch.
18. Generic engine source contains no 1830 game, corporation, private, tile,
    train, coordinate, price, inventory, or phase constants; those exist only in
    the `1830-classic@1` definition package and its source-verification tests.
19. The synthetic ruleset fixture can create a game, render its differently
    shaped map, place and upgrade its tiles, charge its station schedule, run a
    route, advance its custom phase, and save/reload without an engine or UI
    source change.
20. UI labels, corporation tabs, tile palette, station availability, train
    purchase choices, action enablement, and map geometry are derived from the
    selected definition rather than fixed 1830 arrays.

## 27. Rule traceability

| Mechanic | Saved rules | Repository PDF reconciliation |
|---|---|---|
| OR order and private income | 16 | 7.0, pp. 16–17 |
| Ordered corporation actions | 17 | 7.1, p. 17 |
| Track placement and terrain | 18 | 7.2.1, pp. 18–19; C-1.4 |
| Tile upgrades | 18.1–18.3 | 7.2.2; T-09, p. 48 |
| Stations and blocking | 19–19.1 | 7.3, pp. 20–21; T-08, p. 47 |
| Routes | 20.1 | 7.4, pp. 21–22 |
| Mandatory train | 20.2 | 7.6.2; C-2.3 |
| Revenue and dividends | 20.3; 8.2(3–4) | 7.5, p. 22 |
| Train purchases and trades | 21 | 7.6, pp. 23–24; T-03, p. 45 |
| Phases and OR count | 22 | 3.0; T-07, p. 46 |
| Private purchases/closure | 23 | 4.0–4.2; Classic appendix pp. 46–47 |
| Emergency financing | 24 | C-2.3, p. 27 |
| Bankruptcy and Bank end | 25 | C-2.4–C-2.5; 8.0 |

Any implementation task that cannot cite one of these rule locations or an
explicit software-only decision in this document is out of scope until the
design is amended.
