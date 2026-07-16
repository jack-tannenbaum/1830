# Complete 1830 Operating Engine Implementation Plan

> **Status: DRAFT — pending corrected-spec review.** Do not execute this plan
> until the corrected operating-engine design has been reviewed, reconciled
> with the golden manifests, and marked approved.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the temporary Operating Round shell with a complete,
deterministic, definition-driven 1830 Classic Operating Round engine supporting
the canonical board, track and station construction, trains and routes,
dividends, phases, private powers, emergency financing, bankruptcy, Bank
exhaustion, final scoring, save/reload, undo, and the approved map-first UI.

**Architecture:** A generic pure TypeScript engine interprets an immutable,
validated `GameDefinition`. The production `1830-classic@1` package owns every
1830 entity, coordinate, price, inventory, phase threshold, and policy. Mutable
`GameState` remains normalized and JSON-serializable: station-token and train
locations are canonical, finite tile supply is counted once, action kind is
derived from the definition, and pending decisions are typed. The application
composition root resolves an exact definition ID/version and passes it to game
creation, command execution, selectors, invariants, save loading, and UI
projections. React remains presentation; Zustand remains a persistence/undo
adapter.

**Tech Stack:** React 19, TypeScript 5.8, Zustand 5, Vite 7, Vitest, ESLint,
SVG, localStorage.

---

## Source documents and approval boundary

- Corrected design, pending review:
  `docs/superpowers/specs/2026-07-15-operating-round-engine-design.md`
- Golden manifest checklist:
  `docs/superpowers/verification/1830-classic-golden-manifests.md`
- Rules prose: `docs/rules/1830-rules-authoritative.md`
- Reconciliation PDF: `1830 RE Rules.pdf`, Classic rules and tables only
- Existing financial implementation plan:
  `docs/superpowers/plans/2026-07-14-financial-engine-repair.md`
- Existing implementation: `1830-web/src`

The authoritative rules and independently reviewed Classic manifest win over
current code, prototype data, screenshots, and legacy UI behavior. The
corrected design must incorporate the normalized-contract corrections before
this plan leaves Draft:

1. `StationTokenState.location` is the only mutable station-occupancy source.
   `PlacedTileState` has no token list and `CorporationState` has no duplicated
   `homeTokenPlaced` flag.
2. Mutable tile supply contains exactly finite tile IDs. Unlimited supply is a
   definition property and is never represented by `Infinity`, `-1`, or a
   mutable sentinel.
3. Track topology uses atomic physical segments joined by explicit edge, city,
   and junction nodes. Geometric crossovers are disconnected unless they share
   a node.
4. `OperatingRoundState` stores a step index, not a duplicated action kind.
   Kind, label, completion state, and availability derive from the resolved
   definition and selectors.
5. Multi-actor and mandatory interruptions use a discriminated
   `OperatingPendingDecision` union.
6. Saves and active games resolve one exact `{ id, version }`; execution never
   falls back to a latest or nearby definition.
7. Generic commands name mechanic families and exact entity IDs. There are no
   entity-specific command names such as `chooseErieHome` or
   `exchangeMHForNYC`.

---

## Non-negotiable execution rules

1. Create a dedicated integration worktree and branch from the approved plan
   baseline. Do not implement on the documentation branch.
2. Each parallel lane starts from the preceding gate commit in its own worktree
   and owns only its listed files. Workers do not opportunistically repair files
   owned by another lane.
3. Every behavior task is test-first: add the smallest failing scenario, run it
   and record the expected failure, implement, rerun the focused test, then run
   the lane's lint/type gate.
4. Generic modules under `src/engine/definitions` (except
   `definitions/1830-classic`), `map`, `operating`, `routes`, `trains`, and
   `abilities` must never import `definitions/1830-classic`.
5. Generic modules must not contain 1830 game, corporation, private, train,
   tile, coordinate, inventory, price, or phase constants. IDs and display
   names never select reducer behavior.
6. Definitions contain declarative data and closed typed policy/ability values,
   never executable callbacks.
7. State contains records and arrays, not `Map`, `Set`, class instances, DOM
   objects, SVG geometry, or browser APIs. Runtime definition indexes may use
   immutable `Map`/`Set` because they are never serialized.
8. React may keep unconfirmed hover, selection, tile rotation, and route-draft
   state. Confirmed game facts exist only in canonical engine state.
9. Do not wire the new Operating Round into the production Stock Round, save
   flow, or `GameBoard` before the Wave 8 emergency/endgame gate passes. Until
   then the existing shell remains the single production Operating Round path;
   the new engine is reached only through focused scenario fixtures.
10. Do not add a runtime fallback between the shell and complete engine. The
    Wave 9 cutover is atomic, removes shell routing, and leaves one canonical
    path.
11. Do not delete prototype map/station files until Wave 10 proves there are no
    live imports.
12. Every gate ends with a clean worktree and a named integration commit before
    downstream lanes begin.

### Worktree pattern

```bash
git worktree add ../1830-or-task-N -b feat/operating-engine-task-N HEAD
cd ../1830-or-task-N
```

The root integrator cherry-picks lane commits in task order, fixes only shared
contract/import integration, runs the gate, commits the gate, then removes task
worktrees.

---

## Wave map and production-cutover rule

| Wave | Parallel work | Depends on | Integration gate |
|---|---|---|---|
| 0 | Baseline and approval audit | Corrected spec approved | Reproducible clean baseline |
| 1 | Definition contracts and boundary enforcement | Wave 0 | Contracts, resolver, invalid fixtures |
| 2 | 1830 and synthetic definition packages | Wave 1 | Golden manifests and non-1830 proof |
| 3 | Existing financial engine parameterization | Wave 2 | No behavior change; no generic 1830 facts |
| 4 | Normalized v3 model and static operating setup | Wave 3 | Exact-definition state initializes in tests |
| 5 | Map topology/rendering | Wave 4 | Two maps render; lane graph is exact |
| 6 | Track and stations | Wave 5 | Construction and station scenario matrix |
| 7 | Routes, revenue, trains, phases, privates | Wave 6 | Complete ordinary corporation turn |
| 8 | Emergency financing and completed game | Wave 7 | Bankruptcy/endgame gate passes |
| 9 | **Atomic production cutover** and UI | Wave 8 only | Full game uses complete engine |
| 10 | Persistence v3, cleanup, exhaustive verification | Wave 9 | Delivery gate and clean tree |

**Cutover prohibition:** Waves 1-8 may parameterize the financial engine and add
new pure modules, tests, and definition-backed renderers, but
`completeStockRound` continues to enter the current shell in production. Do not
change `GameBoard` production routing or accept v3 production saves until all
Wave 8 scenarios pass. This avoids exposing a game that can enter an Operating
Round but cannot legally escape forced train purchase or bankruptcy.

---

## Wave 0 — Approved baseline

### Task 0: Review the corrected specification and capture the baseline

**Files:** No source or plan changes.

- [ ] **Step 1: Confirm approval prerequisites**

Verify the corrected design is tracked, reviewed, and no longer marked Draft.
Verify the golden manifest checklist identifies reviewers and source pages for
board, tiles, trains, tokens, phases, and private powers. Stop if either is
missing.

- [ ] **Step 2: Create the integration worktree**

```bash
git worktree add ../1830-operating-engine -b feat/complete-operating-engine HEAD
cd ../1830-operating-engine
git status --short
```

Expected: clean worktree on `feat/complete-operating-engine`.

- [ ] **Step 3: Install and record baseline**

```bash
cd 1830-web
npm ci
node --version
npm --version
npm test
npm run lint
npm run build
```

Expected: record test count, versions, failures, and baseline SHA in
`docs/superpowers/verification/2026-07-16-operating-engine.md`. Do not attribute
pre-existing failures to later tasks.

- [ ] **Step 4: Prove the current production shell boundary**

```bash
rg -n "operatingShell|endCorporationTurn" src
rg -n "HexGrid|TileRenderer|StationManager|routeValidation|TRACK_TILES" src
```

Record current production importers separately from developer experiment routes.

### Wave 0 gate

No implementation begins until the corrected spec is approved, manifests have
review ownership, baseline commands are recorded, and the worktree is clean.

---

## Wave 1 — Definition contracts and dependency boundary

### Task 1: Add normalized definition, runtime, and state contracts

**Sequential foundation; all later lanes import these contracts.**

**Files:**
- Create: `1830-web/src/engine/definitions/schema.ts`
- Create: `1830-web/src/engine/definitions/runtime.ts`
- Create: `1830-web/src/engine/definitions/resolver.ts`
- Create: `1830-web/src/engine/definitions/validation-types.ts`
- Create: `1830-web/src/engine/operating/model.ts`
- Create: `1830-web/src/engine/map/model.ts`
- Create: `1830-web/src/engine/trains/model.ts`
- Modify: `1830-web/src/engine/model.ts`
- Create: `1830-web/src/engine/definitions/contracts.type-test.ts`

- [ ] **Step 1: Write compile-time contract tests**

Add `contracts.type-test.ts` fixtures proving:

- a junction-capable fragment accepts edge/city/junction nodes and atomic
  segments;
- finite and unlimited supply are distinct union members;
- `MapState.finiteTileSupply` is numeric and contains no unlimited sentinel;
- placed tiles contain no station occupancy;
- station tokens have exactly one discriminated location;
- Operating Round state has `stepIndex` and no stored `actionKind`;
- `GameState` stores one exact `GameDefinitionRef`;
- pending decisions are an exhaustive discriminated union.

Run:

```bash
npx tsc --noEmit -p tsconfig.app.json
```

Expected: fail because contracts do not exist.

- [ ] **Step 2: Implement replacement-ready interfaces**

Implement the corrected normalized contracts from the approved design. Static
names, colors, percentages, revenues, homes, abilities, train types, and tile
geometry live in definitions. Mutable state stores locations, money, lifecycle,
round progress, and exact definition reference only.

- [ ] **Step 3: Define the exact resolver API**

Expose only:

```ts
interface GameDefinitionResolver {
  resolveExact(ref: GameDefinitionRef):
    | ResolvedGameDefinition
    | DefinitionResolutionError;
}
```

No gameplay API exposes `resolveLatest` or a compatibility fallback.

- [ ] **Step 4: Run focused checks and commit**

```bash
npx vitest run src/engine/definitions/contracts.type-test.ts
npx tsc --noEmit -p tsconfig.app.json
npx eslint src/engine/definitions src/engine/operating/model.ts src/engine/map/model.ts src/engine/trains/model.ts src/engine/model.ts
git add 1830-web/src/engine
git commit -m "feat: define normalized game definition contracts"
```

### Task 2: Implement exhaustive definition validation

**Depends on:** Task 1

**Files:**
- Create: `1830-web/src/engine/definitions/validateGameDefinition.ts`
- Create: `1830-web/src/engine/definitions/validateGameDefinition.test.ts`
- Create: `1830-web/src/engine/definitions/indexDefinition.ts`
- Create: `1830-web/src/engine/definitions/indexDefinition.test.ts`

- [ ] **Step 1: Add one failing fixture per validation family**

Cover duplicate IDs, dangling neighbors, asymmetric topology, invalid home and
private references, unknown track nodes, illegal junction degree, duplicate
segment IDs, invalid tile upgrade edges/color regression, negative finite
supply, invalid currency, unsupported ability kind, dangling ability targets,
certificate totals, missing president certificate, invalid station inventory,
phase trigger/rust references, and unsatisfiable action sequences.

- [ ] **Step 2: Implement validation without title knowledge**

Validation returns all structured issues with paths; it does not throw on the
first problem. After success, index a deeply immutable runtime definition with
read-only lookup maps/sets and stable definition-order indexes.

- [ ] **Step 3: Verify and commit**

```bash
npx vitest run src/engine/definitions/validateGameDefinition.test.ts src/engine/definitions/indexDefinition.test.ts
npx eslint src/engine/definitions
git add 1830-web/src/engine/definitions
git commit -m "feat: validate and index game definitions"
```

### Task 3: Enforce import and title-constant boundaries

**Depends on:** Task 1

**Files:**
- Modify: `1830-web/eslint.config.js`
- Create: `1830-web/scripts/check-definition-boundary.mjs`
- Modify: `1830-web/package.json`
- Modify: `1830-web/package-lock.json` only if scripts alter lock metadata
- Create: `1830-web/src/engine/definitions/boundary.scenario.test.ts`

- [ ] **Step 1: Add a failing boundary test and script**

Scan generic engine directories for imports of `definitions/1830-classic` and
for reviewed forbidden 1830 literals. Exclude tests whose sole job is verifying
the production package.

- [ ] **Step 2: Add ESLint restricted-import rules**

Apply restrictions specifically to generic definitions, map, operating,
routes, trains, and abilities directories. The application composition root may
import registered title packages.

- [ ] **Step 3: Add the package script**

```json
"check:definition-boundary": "node scripts/check-definition-boundary.mjs"
```

- [ ] **Step 4: Verify and commit**

```bash
npm run check:definition-boundary
npx vitest run src/engine/definitions/boundary.scenario.test.ts
npm run lint
git add eslint.config.js scripts package.json package-lock.json src/engine/definitions/boundary.scenario.test.ts
git commit -m "test: enforce ruleset package boundary"
```

### Wave 1 integration gate

Merge Tasks 1, 2, and 3 in order, then run:

```bash
cd 1830-web
npm run check:definition-boundary
npm test
npm run lint
npm run build
```

Expected: definition contracts compile, invalid fixtures fail for the expected
structured reasons, current production behavior remains unchanged.

---

## Wave 2 — Production and synthetic definition packages

All manifest lanes consume Wave 1 schemas and own disjoint files. No generic
module may import these packages.

### Task 4: Transcribe board and corporation/token manifests

**Files:**
- Create: `1830-web/src/engine/definitions/1830-classic/board.ts`
- Create: `1830-web/src/engine/definitions/1830-classic/corporations.ts`
- Create: `1830-web/src/engine/definitions/1830-classic/board.golden.test.ts`
- Create: `1830-web/src/engine/definitions/1830-classic/corporations.golden.test.ts`

- [ ] Write golden tests from the independently reviewed checklist before data.
- [ ] Transcribe every printed coordinate, neighbor, blocked edge, city, printed
  path, terrain, label, home, destination if applicable, private reservation,
  corporation identity, station token ID/count, home option, and station cost.
- [ ] Compare every manifest row, not only aggregate counts.
- [ ] Run focused tests, lint owned files, and commit as
  `feat: add classic board and corporation definitions`.

### Task 5: Transcribe the Classic tile manifest

**Files:**
- Create: `1830-web/src/engine/definitions/1830-classic/tiles.ts`
- Create: `1830-web/src/engine/definitions/1830-classic/tiles.golden.test.ts`

- [ ] Write the complete expected T-09 ID/quantity/color/label/city/segment and
  successor table first.
- [ ] Encode atomic segments and explicit junctions; never infer data from
  `types/tiles.ts`, `TRACK_TILES`, or `TileRenderer` switches.
- [ ] Verify finite/unlimited supply and every upgrade edge.
- [ ] Run focused tests and commit as `feat: add classic tile definition`.

### Task 6: Transcribe trains, phases, stock market, and bank rules

**Files:**
- Create: `1830-web/src/engine/definitions/1830-classic/trains.ts`
- Create: `1830-web/src/engine/definitions/1830-classic/phases.ts`
- Create: `1830-web/src/engine/definitions/1830-classic/stockMarket.ts`
- Create: `1830-web/src/engine/definitions/1830-classic/bank.ts`
- Create: `1830-web/src/engine/definitions/1830-classic/trains-phases.golden.test.ts`

- [ ] Test physical train IDs, type order, quantity, price, distance, rust,
  Diesel availability/trade-in, limits, tile colors, private permissions,
  offboard schedule, future OR count, market cells/zones, par cells, and Bank.
- [ ] Transcribe the package data and pass exhaustive row comparisons.
- [ ] Commit as `feat: add classic trains phases and market definitions`.

### Task 7: Transcribe privates, certificates, abilities, and operating policies

**Files:**
- Create: `1830-web/src/engine/definitions/1830-classic/privates.ts`
- Create: `1830-web/src/engine/definitions/1830-classic/certificates.ts`
- Create: `1830-web/src/engine/definitions/1830-classic/abilities.ts`
- Create: `1830-web/src/engine/definitions/1830-classic/operatingRules.ts`
- Create: `1830-web/src/engine/definitions/1830-classic/entities.golden.test.ts`

- [ ] Test all six privates, effects, purchase/closure timing, physical
  certificates, four generic action definitions, allowances, route policy,
  dividend policy, and order policy.
- [ ] Encode C&A, B&O, M&H, C&SL, D&H, and home-choice behavior as typed generic
  abilities/policies, never ID-selected callbacks.
- [ ] Commit as `feat: add classic entities abilities and operating rules`.

### Task 8: Add the synthetic definition and composition registry

**Files:**
- Create: `1830-web/src/engine/testing/fixtures/synthetic-definition.ts`
- Create: `1830-web/src/engine/testing/fixtures/synthetic-definition.test.ts`
- Create: `1830-web/src/gameDefinitions.ts`
- Create: `1830-web/src/engine/definitions/1830-classic/index.ts`
- Create: `1830-web/src/engine/definitions/registry.scenario.test.ts`

- [ ] Write a synthetic definition with different map shape, coordinate labels,
  tile IDs, an unlimited tile, junction, station schedule, corporations,
  certificate percentages, trains, phases, market, action sequence, and costs.
- [ ] Assemble and validate `1830-classic@1` in its package index.
- [ ] Make `src/gameDefinitions.ts` the only production composition module that
  imports the 1830 package and registers exact definitions.
- [ ] Test exact resolution success, missing version rejection, and no fallback.
- [ ] Commit as `feat: register classic and synthetic definitions`.

### Wave 2 integration gate

Merge Tasks 4-7, then Task 8. Run:

```bash
cd 1830-web
npx vitest run src/engine/definitions/1830-classic src/engine/testing/fixtures src/engine/definitions/registry.scenario.test.ts
npm run check:definition-boundary
npm run lint
npm run build
```

Expected: all golden rows pass independent fixtures; both packages validate and
resolve exactly; generic source contains no production-package import.

---

## Wave 3 — Parameterize the existing financial engine

This wave deliberately changes dependencies before behavior. Existing auction
and stock scenarios must produce byte-equivalent normalized results after
definition identity is excluded from comparison.

### Task 9: Parameterize setup and market

**Files:**
- Modify: `1830-web/src/engine/setup.ts`
- Modify: `1830-web/src/engine/market.ts`
- Modify: `1830-web/src/engine/setup.scenario.test.ts`
- Create: `1830-web/src/engine/market.definition.test.ts`

- [ ] Add failing tests creating both registered definitions and traversing
  their differently shaped stock markets.
- [ ] Remove corporation/private seeds, starting cash, market grids, and par
  lookup from generic setup/market modules.
- [ ] Accept `ResolvedGameDefinition` explicitly.
- [ ] Run focused tests and commit as `refactor: parameterize setup and market`.

### Task 10: Replace entity-specific auction branches with abilities

**Files:**
- Modify: `1830-web/src/engine/auction.ts`
- Modify: `1830-web/src/engine/auction.scenario.test.ts`
- Create: `1830-web/src/engine/abilities/auctionAbilities.ts`
- Create: `1830-web/src/engine/abilities/auctionAbilities.test.ts`

- [ ] Add failing ability scenarios for certificate grant, certificate sale
  restriction, required corporation par, and cheapest-private decline policy.
- [ ] Remove direct checks for C&A, PRR, B&O, SVN, and certificate string IDs.
- [ ] Execute the definition's typed purchase abilities in stable order.
- [ ] Commit as `refactor: drive auction effects from abilities`.

### Task 11: Parameterize stock, ownership, and corporation rules

**Files:**
- Modify: `1830-web/src/engine/stock-shares.ts`
- Modify: `1830-web/src/engine/stock-private-trades.ts`
- Modify: `1830-web/src/engine/stock.ts`
- Modify: `1830-web/src/engine/corporations.ts`
- Modify: `1830-web/src/engine/ownership.ts`
- Modify: `1830-web/src/engine/stock.scenario.test.ts`
- Create: `1830-web/src/engine/stock.synthetic.test.ts`

- [ ] Add failing synthetic scenarios for non-10% certificates, different
  presidency percentage, certificate limit, pool limit, capitalization, and par.
- [ ] Replace imports of certificate/par/market constants with definition data.
- [ ] Preserve existing 1830 presidency and flotation behavior.
- [ ] Commit as `refactor: parameterize stock and ownership rules`.

### Task 12: Thread definitions through selectors, invariants, and execution

**Files:**
- Modify: `1830-web/src/engine/selectors.ts`
- Modify: `1830-web/src/engine/invariants.ts`
- Modify: `1830-web/src/engine/executeCommand.ts`
- Modify: `1830-web/src/engine/commands.ts`
- Modify: `1830-web/src/engine/results.ts`
- Modify: `1830-web/src/engine/dispatcher.scenario.test.ts`
- Create: `1830-web/src/engine/definition-resolution.scenario.test.ts`

- [ ] Test `game.create` with exact definition reference, wrong/missing version,
  commands against unresolved games, and synthetic selector projections.
- [ ] Change executor signature to accept a resolver/context and resolve once per
  command. Pass the same runtime definition to reducer and invariants.
- [ ] Make selectors accept the resolved definition explicitly or through a
  selector context; they may not import a production singleton.
- [ ] Commit as `refactor: resolve definitions through command execution`.

### Task 13: Parameterize the adapter without duplicating definition state

**Files:**
- Modify: `1830-web/src/engine/adapter-contracts.ts`
- Modify: `1830-web/src/store/gameStore.ts`
- Modify: `1830-web/src/engine/adapter.scenario.test.ts`

- [ ] Inject the exact resolver into `createGameAdapterStore`.
- [ ] Keep the accepted `GameState` and undo snapshots only; do not store a
  second mutable definition, map, train roster, or treasury.
- [ ] Test dispatch, undo, and reload under exact definition resolution.
- [ ] Commit as `refactor: inject game definitions into adapter`.

### Wave 3 integration gate

Merge Tasks 9-13 in order. Run:

```bash
cd 1830-web
npm test
npm run check:definition-boundary
npm run lint
npm run build
```

Additionally replay the existing financial command logs before and after the
migration and compare normalized results. Expected: no financial behavior
change, synthetic financial scenarios pass, and no generic engine module imports
`constants.ts` for title facts. Commit gate as:

```bash
git commit -am "chore: pass definition parameterization gate"
```

---

## Wave 4 — Schema-v3 operating model and test-only lifecycle

The new engine remains disconnected from production round transitions.

### Task 14: Initialize normalized map, tokens, trains, and phase state

**Files:**
- Create: `1830-web/src/engine/operating/initializeOperatingGame.ts`
- Create: `1830-web/src/engine/operating/initializeOperatingGame.test.ts`
- Modify: `1830-web/src/engine/setup.ts`
- Modify: `1830-web/src/engine/invariants.ts`

- [ ] Add failing tests asserting exact finite supply keys, unlimited omission,
  all station tokens on charter, all trains in one location, initial phase, and
  no duplicated token/train arrays.
- [ ] Initialize deterministic physical IDs from definitions.
- [ ] Add normalized-state invariants.
- [ ] Commit as `feat: initialize operating assets from definitions`.

### Task 15: Implement test-only OR-set initialization and dynamic order

**Files:**
- Create: `1830-web/src/engine/operating/lifecycle.ts`
- Create: `1830-web/src/engine/operating/lifecycle.test.ts`
- Create: `1830-web/src/engine/operating/order.ts`
- Create: `1830-web/src/engine/operating/order.test.ts`

- [ ] Test capitalization/private income timing, latched OR-set length,
  definition-driven order, same-cell stacking, operated exclusion, and order
  recomputation after market movement.
- [ ] Store only operated IDs/current corporation/step index; never freeze a
  complete order.
- [ ] Export fixture-only lifecycle entry points. Do not call them from
  `completeStockRound` yet.
- [ ] Commit as `feat: add definition-driven operating lifecycle`.

### Task 16: Add generic commands and typed pending-decision routing

**Files:**
- Modify: `1830-web/src/engine/commands.ts`
- Modify: `1830-web/src/engine/executeCommand.ts`
- Create: `1830-web/src/engine/operating/executeOperatingCommand.ts`
- Create: `1830-web/src/engine/operating/pendingDecisions.ts`
- Create: `1830-web/src/engine/operating/pendingDecisions.test.ts`

- [ ] Add failing tests showing only the current president can act, step ID must
  match the derived current step, mismatched decision resolutions reject, and
  unrelated commands block while a decision is active.
- [ ] Add generic `operating.placeHomeStation`, `operating.skipStep`, map, run,
  train, `ability.execute`, and `decision.resolve` families. Do not add names
  containing Classic entities.
- [ ] Route operating commands only in test-created complete-engine states.
- [ ] Commit as `feat: add typed operating command protocol`.

### Wave 4 integration gate

```bash
cd 1830-web
npx vitest run src/engine/operating src/engine/setup.scenario.test.ts
npm run check:definition-boundary
npm test
npm run lint
npm run build
```

Expected: normalized complete-engine state initializes for both definitions,
the production Stock Round still enters the shell, and no production UI changed.

---

## Wave 5 — Generic map topology and rendering

### Task 17: Build rotated lane topology and graph derivation

**Files:**
- Create: `1830-web/src/engine/map/rotation.ts`
- Create: `1830-web/src/engine/map/rotation.test.ts`
- Create: `1830-web/src/engine/map/topology.ts`
- Create: `1830-web/src/engine/map/topology.test.ts`
- Create: `1830-web/src/engine/map/trackGraph.ts`
- Create: `1830-web/src/engine/map/trackGraph.test.ts`

- [ ] Test all rotations, neighbor edge matching, lane identity, junction
  traversal, crossover separation, distinct same-hex cities, printed track, and
  stable physical segment IDs.
- [ ] Derive graph solely from definition plus placed tiles/token locations.
- [ ] Commit as `feat: build generic lane-level track graph`.

### Task 18: Build definition-backed board rendering

**Files:**
- Create: `1830-web/src/components/map/GameMap.tsx`
- Create: `1830-web/src/components/map/BoardHex.tsx`
- Create: `1830-web/src/components/map/TrackFragment.tsx`
- Create: `1830-web/src/components/map/StationToken.tsx`
- Create: `1830-web/src/components/map/mapGeometry.ts`
- Create: `1830-web/src/components/map/mapGeometry.test.ts`
- Create: `1830-web/src/components/map/GameMap.test.tsx` only if the approved
  dependency set includes a DOM renderer; otherwise use pure projection tests.

- [ ] Test projection for both differently shaped definitions, definition
  labels, city separation, junction/crossover drawing, token derivation,
  keyboard labels, and no hardcoded tile IDs.
- [ ] Reuse SVG techniques, not prototype data or legality.
- [ ] Add pan/zoom and keyboard focus without dispatching game commands.
- [ ] Keep this renderer off the production board until Wave 9.
- [ ] Commit as `feat: render definition-backed game maps`.

### Task 19: Add definition-backed map selectors

**Files:**
- Create: `1830-web/src/engine/map/selectors.ts`
- Create: `1830-web/src/engine/map/selectors.test.ts`

- [ ] Test immutable board views, finite/unlimited availability, effective city
  templates, token occupancy derived from token locations, and map-version cache
  equivalence.
- [ ] Return plain read models; never return mutable runtime indexes.
- [ ] Commit as `feat: project generic map views`.

### Wave 5 integration gate

Run all map tests, render both definitions in the developer harness, then:

```bash
cd 1830-web
npx vitest run src/engine/map src/components/map
npm run check:definition-boundary
npm run lint
npm run build
```

Manual gate: keyboard and pointer inspection, pan/zoom, light/dark, desktop and
narrow widths. Production game routing remains unchanged.

---

## Wave 6 — Track construction and stations

### Task 20: Implement tile placement, upgrades, inventory, and terrain

**Files:**
- Create: `1830-web/src/engine/map/tilePlacement.ts`
- Create: `1830-web/src/engine/map/tilePlacement.test.ts`
- Create: `1830-web/src/engine/map/tileUpgrade.ts`
- Create: `1830-web/src/engine/map/tileUpgrade.test.ts`
- Create: `1830-web/src/engine/map/tokenMigration.ts`
- Create: `1830-web/src/engine/map/tokenMigration.test.ts`
- Create: `1830-web/src/engine/operating/constructTrack.ts`
- Create: `1830-web/src/engine/operating/constructTrack.test.ts`

- [ ] Test phase/color, shape, label, boundaries, reachable path, blocking,
  terrain, finite exhaustion/return, unlimited supply, path preservation, and
  explicit ambiguous token mapping.
- [ ] Test typed special allowances without checking private IDs/coordinates in
  generic code.
- [ ] Apply tile, supply, treasury, allowance, and token migration atomically.
- [ ] Commit as `feat: implement track construction`.

### Task 21: Implement home and normal station placement

**Files:**
- Create: `1830-web/src/engine/map/stations.ts`
- Create: `1830-web/src/engine/map/stations.test.ts`
- Create: `1830-web/src/engine/operating/placeStation.ts`
- Create: `1830-web/src/engine/operating/placeStation.test.ts`

- [ ] Test every Classic home, generic multi-choice home pending decision,
  protected home, charter supply, ordinal cost schedule, reachability, full-city
  blocking, duplicate-hex rejection, unstarted home protection, and free special
  placement.
- [ ] Derive occupancy and home placement solely from token locations.
- [ ] Commit as `feat: implement station placement and blocking`.

### Task 22: Add track/station selectors and draft UI

**Files:**
- Create: `1830-web/src/engine/operating/trackStationSelectors.ts`
- Create: `1830-web/src/engine/operating/trackStationSelectors.test.ts`
- Create: `1830-web/src/components/operating/TrackAction.tsx`
- Create: `1830-web/src/components/operating/StationAction.tsx`
- Create: `1830-web/src/components/operating/TilePalette.tsx`

- [ ] Test legal hexes, placements, upgrades, rotations, station slots, costs,
  allowances, and reason codes against authoritative commands.
- [ ] Keep hover/rotation preview local; dispatch exact confirmed payloads.
- [ ] Do not mount components in production.
- [ ] Commit as `feat: add track and station interaction surfaces`.

### Wave 6 integration gate

Run spec sections 24.2 and 24.3 scenarios plus synthetic cost/supply variants:

```bash
cd 1830-web
npx vitest run src/engine/map src/engine/operating/constructTrack.test.ts src/engine/operating/placeStation.test.ts src/engine/operating/trackStationSelectors.test.ts
npm run check:definition-boundary
npm test
npm run lint
npm run build
```

Expected: every accepted placement passes invariants and replay; production
still uses the shell.

---

## Wave 7 — Trains, routes, revenue, phases, and privates

### Task 23: Implement train ownership, depot, limits, and rusting primitives

**Files:**
- Create: `1830-web/src/engine/trains/ownership.ts`
- Create: `1830-web/src/engine/trains/depot.ts`
- Create: `1830-web/src/engine/trains/limits.ts`
- Create: `1830-web/src/engine/trains/rusting.ts`
- Create: `1830-web/src/engine/trains/trains.test.ts`

- [ ] Test canonical location derivation, depot exposure, open market, capacity,
  excess decisions, rust removal, Diesel availability/trade-in, and synthetic
  train names/limits.
- [ ] Commit as `feat: add generic train ownership and depot rules`.

### Task 24: Implement route validation and exact optimization

**Files:**
- Create: `1830-web/src/engine/routes/model.ts`
- Create: `1830-web/src/engine/routes/validateRoute.ts`
- Create: `1830-web/src/engine/routes/validateRoute.test.ts`
- Create: `1830-web/src/engine/routes/optimizer.ts`
- Create: `1830-web/src/engine/routes/optimizer.test.ts`
- Create: `1830-web/src/engine/routes/exhaustive-oracle.test.ts`

- [ ] Test continuity, junction reversal, crossover isolation, repeated physical
  segment, repeated city, separate cities, station inclusion, blocking,
  offboard endpoints, distance policies, Diesel, and multi-train non-overlap.
- [ ] Compare optimizer output to an independent exhaustive oracle on generated
  small graphs; test stable tie-breaking and a documented performance budget.
- [ ] Commit as `feat: validate and optimize train routes`.

### Task 25: Resolve runs, revenue, dividends, and market movement

**Files:**
- Create: `1830-web/src/engine/operating/runTrains.ts`
- Create: `1830-web/src/engine/operating/runTrains.test.ts`
- Create: `1830-web/src/engine/operating/revenue.ts`
- Create: `1830-web/src/engine/operating/revenue.test.ts`

- [ ] Test maximum enforcement, empty runs, low/high offboard revenue, player,
  Pool, and IPO portions, dividend versus withhold, zero/no-route movement,
  stacking, treasury, Bank obligations, and one-version atomicity.
- [ ] Commit as `feat: resolve routes revenue and dividends`.

### Task 26: Implement train purchases, trades, phases, and OR-set scheduling

**Files:**
- Create: `1830-web/src/engine/trains/purchases.ts`
- Create: `1830-web/src/engine/trains/purchases.test.ts`
- Create: `1830-web/src/engine/trains/trades.ts`
- Create: `1830-web/src/engine/trains/trades.test.ts`
- Create: `1830-web/src/engine/trains/phases.ts`
- Create: `1830-web/src/engine/trains/phases.test.ts`
- Modify: `1830-web/src/engine/operating/lifecycle.ts`
- Modify: `1830-web/src/engine/operating/lifecycle.test.ts`

- [ ] Test one-at-a-time purchase, all sources, negotiated consent, shared
  president, last train, cancellation after presidency change, trade-in, every
  phase effect, discard queue, current-set latching, and future 1/2/3 OR sets.
- [ ] Commit as `feat: add train purchases phases and operating sets`.

### Task 27: Implement corporation private purchases and generic abilities

**Files:**
- Create: `1830-web/src/engine/abilities/executeAbility.ts`
- Create: `1830-web/src/engine/abilities/executeAbility.test.ts`
- Create: `1830-web/src/engine/operating/privatePurchases.ts`
- Create: `1830-web/src/engine/operating/privatePurchases.test.ts`

- [ ] Test purchase windows/range/consent, B&O-style prohibition as policy,
  closure invalidation, special lays/stations, certificate exchange, first-train
  closure, and phase closure without entity-specific command types.
- [ ] Commit as `feat: execute operating private abilities`.

### Task 28: Add route/train interaction surfaces

**Files:**
- Create: `1830-web/src/engine/operating/trainRouteSelectors.ts`
- Create: `1830-web/src/engine/operating/trainRouteSelectors.test.ts`
- Create: `1830-web/src/components/operating/RouteAction.tsx`
- Create: `1830-web/src/components/operating/TrainAction.tsx`
- Create: `1830-web/src/components/operating/RevenueDialog.tsx`
- Create: `1830-web/src/components/operating/TrainTradeDialog.tsx`

- [ ] Test owned trains, draft validation, best run, payout preview, legal train
  purchases, limits, phase preview, trade actors, and disabled reason codes.
- [ ] Keep route drawing ephemeral until exact run confirmation.
- [ ] Do not mount components in production.
- [ ] Commit as `feat: add route and train interaction surfaces`.

### Wave 7 integration gate

Run all ordinary-turn, route, dividend, train, phase, and private scenarios:

```bash
cd 1830-web
npx vitest run src/engine/routes src/engine/trains src/engine/operating src/engine/abilities
npm run check:definition-boundary
npm test
npm run lint
npm run build
```

Script a complete ordinary corporation turn through each phase and replay it to
byte-equivalent normalized state. **Do not cut over production yet.**

---

## Wave 8 — Emergency financing, bankruptcy, Bank end, and scoring

### Task 29: Implement mandatory train purchase and emergency financing

**Files:**
- Create: `1830-web/src/engine/operating/emergencyFinancing.ts`
- Create: `1830-web/src/engine/operating/emergencyFinancing.test.ts`
- Create: `1830-web/src/engine/operating/emergencySelectors.ts`
- Create: `1830-web/src/engine/operating/emergencySelectors.test.ts`

- [ ] Test route exemption, cheapest Bank alternative, corporation cash,
  president contribution, legal sale sets, Pool limits/movement, prohibition on
  dumping the trainless corporation, other presidency changes, optional private
  sale, recomputed shortfall, indivisible-sale excess, and forced completion.
- [ ] Serialize the workflow in the typed pending-decision union; never choose a
  liquidation strategy automatically.
- [ ] Commit as `feat: implement emergency train financing`.

### Task 30: Implement bankruptcy and immediate game completion

**Files:**
- Create: `1830-web/src/engine/operating/bankruptcy.ts`
- Create: `1830-web/src/engine/operating/bankruptcy.test.ts`
- Create: `1830-web/src/engine/completion.ts`
- Create: `1830-web/src/engine/completion.test.ts`

- [ ] Test bankruptcy cannot be declared early, every legal funding source is
  exhausted, immediate command lock, remaining corporations do not operate,
  bankrupt-player scoring, and ordinary opponent scoring.
- [ ] Commit as `feat: implement bankruptcy and completed games`.

### Task 31: Implement Bank exhaustion, obligations, and final scoring

**Files:**
- Modify: `1830-web/src/engine/ledger.ts`
- Create: `1830-web/src/engine/endgame.ts`
- Create: `1830-web/src/engine/endgame.test.ts`
- Create: `1830-web/src/engine/finalScoreSelectors.ts`
- Create: `1830-web/src/engine/finalScoreSelectors.test.ts`

- [ ] Test Bank break during Stock Round and every OR position in 1/2/3-round
  sets, non-spendable obligations, exact final boundary, stock/private valuation,
  corporation-asset exclusion, ties, and completed command rejection.
- [ ] Commit as `feat: finish bank exhaustion and scoring`.

### Task 32: Add emergency and completion UI surfaces off-production

**Files:**
- Create: `1830-web/src/components/operating/EmergencyFinancingDialog.tsx`
- Create: `1830-web/src/components/operating/PendingDecisionDialog.tsx`
- Create: `1830-web/src/components/CompletedGamePanel.tsx`

- [ ] Render selector-provided shortfall, legal sales, consent actors, and final
  scores. UI must not compute bankruptcy eligibility.
- [ ] Keep components unmounted until Wave 9.
- [ ] Commit as `feat: add emergency and completion surfaces`.

### Wave 8 emergency/endgame gate — mandatory before production cutover

Run:

```bash
cd 1830-web
npx vitest run src/engine/operating/emergencyFinancing.test.ts src/engine/operating/bankruptcy.test.ts src/engine/endgame.test.ts src/engine/completion.test.ts src/engine/finalScoreSelectors.test.ts
npm test
npm run check:definition-boundary
npm run lint
npm run build
```

Then run deterministic scripted scenarios for:

1. no-route train exemption;
2. corporation-only forced purchase;
3. president contribution;
4. forced sales changing another presidency;
5. optional private sale;
6. bankruptcy and immediate stop;
7. Bank break in Stock Round;
8. Bank break in each OR of a three-OR set;
9. final scoring with obligations;
10. save-shaped JSON serialization at every pending-decision kind.

Expected: all pass, every accepted state passes invariants, and replay is
byte-equivalent after normalization. Commit the gate result. Only this commit
authorizes Wave 9 production cutover.

---

## Wave 9 — Atomic production cutover and approved UI

### Task 33: Replace shell round transitions with the complete lifecycle

**Sequential cutover foundation.**

**Files:**
- Modify: `1830-web/src/engine/rounds.ts`
- Modify: `1830-web/src/engine/executeCommand.ts`
- Modify: `1830-web/src/engine/model.ts`
- Modify: `1830-web/src/engine/commands.ts`
- Delete after all callers migrate: shell command/state exports
- Create: `1830-web/src/engine/full-game.scenario.test.ts`

- [ ] First add a failing scripted transition from Stock Round into the complete
  engine and back through an entire OR set.
- [ ] Replace `OperatingShellState` and `operatingShell.endCorporationTurn`.
- [ ] Route every complete-engine command and completion state.
- [ ] Do not retain a feature flag or fallback shell branch.
- [ ] Run all engine tests and commit as `feat: cut over complete operating lifecycle`.

### Task 34: Restore the map-first board and top turn controls

**Files:**
- Modify: `1830-web/src/components/GameBoard.tsx`
- Modify: `1830-web/src/components/TurnDisplay.tsx`
- Modify: `1830-web/src/components/GameSidebar.tsx`
- Create: `1830-web/src/components/operating/OperatingWorkspace.tsx`

- [ ] Mount `GameMap` as the main board, add board/market toggle, retain player
  summaries, place current corporation and Finish Turn in the top header, and
  derive all labels from definition/selectors.
- [ ] Remove frozen operating-order assumptions and shell dispatch.
- [ ] Commit as `feat: restore map-first operating board`.

### Task 35: Build the compact definition-driven corporation pane

**Files:**
- Replace: `1830-web/src/components/OperatingShell.tsx` with complete pane or
  rename it to `OperatingRound.tsx` and update imports
- Create: `1830-web/src/components/operating/CorporationPane.tsx`
- Create: `1830-web/src/components/operating/OperatingActions.tsx`
- Modify only for integration imports: components created in Tasks 22, 28, 32

- [ ] Render tabs for selector-provided operating corporations; treasury,
  market, ownership/president, step progress, trains, station inventory/cost,
  confirmed run, privates, abilities, and mandatory warnings.
- [ ] Render action definitions in definition order. Classic produces the 2x2
  Construct Track, Place Station, Run Trains, Buy Train layout; synthetic order
  renders without a component fork.
- [ ] Completed actions are visibly complete, current action enabled when legal,
  later actions disabled with reason codes. Dividend remains inside Run Trains.
- [ ] Commit as `feat: connect complete operating workspace`.

### Task 36: Parameterize remaining title-specific UI

**Files:**
- Modify: `1830-web/src/App.tsx`
- Modify: `1830-web/src/components/GameSetup.tsx`
- Modify: `1830-web/src/components/StockRound.tsx`
- Modify: `1830-web/src/components/StockMarketDisplay.tsx`
- Modify: `1830-web/src/components/GameSidebar.tsx` only if Task 34 delegates a
  documented non-overlapping section; otherwise integrate sequentially

- [ ] Derive game title, corporation/private display, par choices, market grid,
  action labels, and colors from the selected definition.
- [ ] Remove hardcoded NYC dark-mode handling and private-name replacements.
- [ ] Default production setup to `1830-classic@1`; synthetic remains a test/dev
  selection without source changes.
- [ ] Commit as `refactor: parameterize game presentation`.

### Wave 9 cutover gate

```bash
cd 1830-web
npm test
npm run check:definition-boundary
npm run lint
npm run build
rg -n "operatingShell|endCorporationTurn|Integration harness" src
```

Expected: no live shell references, no enabled placeholder action, full game
enters the complete OR, and synthetic UI projections require no component fork.

Manual gate:

- complete one corporation turn by keyboard and pointer;
- test every modal cancellation/focus return;
- inspect board, market, player summaries, and corporation pane at desktop and
  narrow widths;
- inspect light and dark themes;
- confirm current player/corporation and required step are immediately visible.

---

## Wave 10 — Schema v3, cleanup, and delivery verification

### Task 37: Cut persistence to schema v3 with exact definition resolution

**Files:**
- Modify: `1830-web/src/engine/save.ts`
- Modify: `1830-web/src/engine/storage.ts`
- Modify: `1830-web/src/engine/constants.ts`
- Modify: `1830-web/src/store/gameStore.ts`
- Modify: `1830-web/src/App.tsx`
- Create: `1830-web/src/engine/save-v3.scenario.test.ts`

- [ ] Test every map/train/phase/OR/pending/completed field, missing exact
  definition, corrupted entity IDs, accepted reload, undo, and explicit v2 shell
  rejection.
- [ ] Set schema v3 and new engine version only after Wave 9 cutover.
- [ ] Show a clear new-game-required message for v2 saves; never fabricate
  omitted operating history.
- [ ] Commit as `feat: persist complete operating games`.

### Task 38: Remove prototypes and obsolete shell artifacts

**Files, delete only after `rg` proves no live imports:**
- `1830-web/src/components/HexGrid.tsx`
- `1830-web/src/components/HexGridTest.tsx`
- `1830-web/src/components/MapGraphTest.tsx`
- `1830-web/src/components/StationTest.tsx`
- `1830-web/src/components/TileRenderer.tsx`
- `1830-web/src/types/mapGraph.ts`
- `1830-web/src/types/tiles.ts`
- legacy-only portions of `1830-web/src/types/game.ts`
- `1830-web/src/utils/mapGraph.ts`
- `1830-web/src/utils/mapGraphTest.ts`
- `1830-web/src/utils/routeValidation.ts`
- `1830-web/src/utils/stationManager.ts`
- `1830-web/src/utils/trackTiles.ts`
- `1830-web/src/utils/trackTilesHex.ts`
- obsolete shell panel/state/tests
- Modify: `1830-web/src/components/GameSetup.tsx` to remove experiment links

- [ ] Record import proof before deletion.
- [ ] Delete prototypes rather than keeping them as fallback legality.
- [ ] Run TypeScript, lint, tests, build, and commit as
  `refactor: remove operating prototypes and shell`.

### Task 39: Add deterministic end-to-end scripts and verification record

**Files:**
- Create: `1830-web/src/engine/end-to-end/classic-game.scenario.test.ts`
- Create: `1830-web/src/engine/end-to-end/bankruptcy-game.scenario.test.ts`
- Create: `1830-web/src/engine/end-to-end/bank-break-game.scenario.test.ts`
- Create: `1830-web/src/engine/end-to-end/synthetic-game.scenario.test.ts`
- Create: `1830-web/src/engine/end-to-end/replay.scenario.test.ts`
- Modify: `1830-web/README.md`
- Create: `docs/superpowers/verification/2026-07-16-operating-engine.md`

- [ ] Script Classic progression through first 3, 4, 5, 6, and D; 1/2/3 OR
  sets; all private abilities; shared market cells; train trade; forced purchase;
  presidency change; bankruptcy; Bank break; final score; save/reload; undo.
- [ ] Script synthetic create/render-equivalent projections, tile placement and
  upgrade, custom station cost, route, phase, and save/reload without engine/UI
  source changes.
- [ ] Replay command logs to byte-equivalent normalized state.
- [ ] Document exact implemented scope and developer commands.

### Final automated gate

```bash
cd 1830-web
npm ci
npm test
npm run check:definition-boundary
npm run lint
npm run build
rg -n "definitions/1830-classic" src/engine/definitions src/engine/map src/engine/operating src/engine/routes src/engine/trains src/engine/abilities --glob '!definitions/1830-classic/**'
rg -n "operatingShell|Integration harness|StationManager|TRACK_TILES|ALL_TILES" src
git status --short
```

Expected: all scenarios pass, boundary scans return no forbidden live imports,
prototype/shell scans return no live references, build succeeds, and tree is
clean.

### Final manual walkthrough

Run:

```bash
npm run dev
```

Record real results for:

1. setup, auction, and repeated Stock Rounds remain correct;
2. resume, reload, undo, and new-game behavior;
3. exact Classic board, homes, terrain, labels, and initial track;
4. every track/station interaction including special abilities;
5. route drawing, best run, dividends, withholding, and market movement;
6. depot, open market, negotiation, rusting, phases, and OR counts;
7. corporation private purchases and all private closures/effects;
8. mandatory train, emergency sales, presidency changes, and bankruptcy;
9. Bank exhaustion, obligations, completed game, and final scores;
10. current actor/step visibility, player summaries, corporation assets and
    treasury visibility;
11. keyboard and pointer use, modal focus return, desktop/narrow layouts;
12. light and dark visual review.

Fill the verification record with command output, browser screenshots where
useful, tester, date, final SHA, and remaining non-blocking observations. Do not
mark PASS from planned expectations.

### Final commit

```bash
git add 1830-web/README.md docs/superpowers/verification/2026-07-16-operating-engine.md 1830-web/src/engine/end-to-end
git commit -m "test: verify complete 1830 operating engine"
git status --short
```

Expected: clean worktree. The milestone is complete only after the integrated
artifact—not individual task branches—passes every automated and manual gate.

---

## Definition-boundary review checklist for every gate

- [ ] Generic source imports schemas/runtime interfaces, not `1830-classic`.
- [ ] No generic branch compares an entity ID, coordinate, tile ID, train name,
  phase name, or game ID.
- [ ] No generic default embeds a Classic price, quantity, limit, threshold, or
  action order.
- [ ] Abilities are closed discriminated data and exact entity references
  validate at definition load.
- [ ] State stores no static definition copy and no duplicated token/train
  ownership.
- [ ] Current operating action derives from definition plus `stepIndex`.
- [ ] Unlimited supplies never enter numeric mutable supply records.
- [ ] Pending decisions serialize and reject unrelated commands.
- [ ] Selectors provide legal actions and reason codes; React does not recreate
  legality.
- [ ] The synthetic definition exercises the changed capability in the same
  gate, not only at final verification.

## Commit and integration discipline

Each task produces one focused commit after its focused tests pass. The root
integrator does not squash away gate commits until delivery, because downstream
workers must branch from a known passing boundary. If a gate fails, fix the
owning task or a dedicated integration commit before launching the next wave.
Never let multiple branches independently redefine a shared contract.

This plan remains **Draft pending corrected-spec review** until the source design
contains the normalized contract corrections listed above and the golden
manifest review ownership is complete.
