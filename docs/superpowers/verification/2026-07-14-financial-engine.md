# Financial Engine Milestone — Verification

```
Plan: docs/superpowers/plans/2026-07-14-financial-engine-repair.md
Verified SHA: f0c37ce
Verified at: 2026-07-14T10:09Z
```

## Automated gate

Executed inside `1830-web/` at the SHA above.

| Command | Result | Notes |
| --- | --- | --- |
| `npm test` | PASS | 6 test files / 14 tests / seven scenarios pass; `setup.scenario`, `auction.scenario`, `stock.scenario`, `corporation-rounds.scenario`, `dispatcher.scenario`, `adapter.scenario`. |
| `npm run lint` | PASS | `eslint .` exits 0. Baseline pre-existing failures in map/hex/tile/route/station experiments cleaned up in this milestone. |
| `npm run build` | PASS | `tsc -b` clean; Vite build produces 64 modules; `dist/assets/index-*.js` ≈ 288 KB (84 KB gzip). |

## Manual walkthrough

The interactive `npm run dev` walkthrough is not executed by the automation
session that produced this record — the environment cannot drive a real browser
end-to-end. Each numbered checkpoint below cites the engine scenario that
already exercises the underlying behavior; anyone reproducing the milestone
should still run the ten-point browser walkthrough before declaring the
milestone shippable.

1. 3-player setup gives each player $800 in starting cash and Bank $9,600.
   - Result: COVERED by `src/engine/setup.scenario.test.ts` scenario 1 (which parametrizes 3/4/5/6 players and asserts exactly $2,400 / n distribution and Bank cash 9,600). Interactive check: PENDING.
2. SVN declines resolve correctly through the private auction and free-assign to the next actor.
   - Result: COVERED by `src/engine/auction.scenario.test.ts` scenarios 2-3 (four decline rounds around SVN at 20/15/10/5, then free assignment). Interactive check: PENDING.
3. C&A grants the exact PRR share and B&O par is set exactly once through `auction.setBOPar`.
   - Result: COVERED by `src/engine/auction.scenario.test.ts` scenarios 2-3 (`saleRestrictedUntilCorporationParred: "PRR"` set on the granted PRR certificate; B&O purchase blocks further action until par is set). Interactive check: PENDING.
4. First Stock Round blocks every share sale and every private trade.
   - Result: COVERED by `src/engine/stock.scenario.test.ts` scenario 4 step 1 and by the first-round-restriction guards in `src/engine/stock.ts`. Interactive check: PENDING.
5. A later Stock Round supports sell-then-buy on the same turn and requires explicit Finish Turn.
   - Result: COVERED by `src/engine/stock.scenario.test.ts` scenario 4 steps 5-9 (sell 10 %, remain current actor, buy different corporation, reject buying the sold corporation, `stock.finishTurn`). Interactive check: PENDING.
6. An accepted private-company trade transfers ownership and cash.
   - Result: COVERED by `src/engine/stock.scenario.test.ts` scenario 4 step 11 ($40 private trade proposed and accepted during the buyer's turn) and by `stock.proposePrivateTrade` / `stock.respondPrivateTrade` guards in `src/engine/stock.ts`. Interactive check: PENDING.
7. Presidency transfer and float capitalization display correctly.
   - Result: COVERED by `src/engine/corporation-rounds.scenario.test.ts` scenario 5 (presidency exchange, 60 % sold, ten-times-par capitalization only on first shell entry). Interactive check: PENDING.
8. Operating Round shell is labeled incomplete and can cycle without deadlock.
   - Result: COVERED by `src/engine/corporation-rounds.scenario.test.ts` scenario 6 (repeated shell cycles) and by the "Integration harness: trains, routes, dividends, and legal operating market movement are not implemented." banner rendered by `src/components/OperatingShell.tsx`. Interactive check: PENDING.
9. Undo, reload, and legacy-save rejection all behave as specified.
   - Result: COVERED by `src/engine/adapter.scenario.test.ts` scenario 7 (`dispatch`, `undo`, `load`, invalid-save rejection, `newGame`). Interactive check: PENDING.
10. Bank exhaustion is detected and reported in the milestone-stopped panel with unpaid obligations.
    - Result: COVERED by `src/engine/corporation-rounds.scenario.test.ts` scenario 6 (Bank cash reaches zero, an unpaid obligation is recorded, the current shell completes, and `milestoneStopped` is entered) and by `src/components/MilestoneStoppedPanel.tsx`. Interactive check: PENDING.

## Known limitations

- The 10-point interactive browser walkthrough has not been executed in this
  automation session; each behavior is covered by an engine scenario, but a
  human should still exercise `npm run dev` before the milestone ships.
- Operating Rounds beyond the shell (trains, routes, dividends, legal
  operating market movement) are intentionally not implemented — the shell
  renders a warning banner and only accepts `operatingShell.endCorporationTurn`.
- Network multiplayer is not implemented; commands are versioned and idempotent
  by id, but there is no transport.
- Legacy saves (`schemaVersion !== 2` or `engineVersion !== "financial-core-v1"`)
  are refused by the adapter's `load()` and produce no live-state change.
