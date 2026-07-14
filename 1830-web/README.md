# 1830 Financial Engine Prototype

A prototype financial engine and integration harness for the board game *1830*, built as a React + TypeScript + Vite application.

## Commands

- `npm ci` — install dependencies.
- `npm run dev` — start the Vite development server.
- `npm test` — run the vitest scenario suite (the seven engine scenarios plus the dispatcher and adapter tests).
- `npm run lint` — run ESLint over the project.
- `npm run build` — run `tsc -b && vite build`.

## Scope

- Setup, private auctions, and Stock Rounds are implemented and rule-authoritative.
- The Operating Round is an integration harness only — trains, routes, dividends, and legal operating market movement are not implemented.
- Legacy saves (schemaVersion !== 2, engineVersion !== "financial-core-v1") are unsupported and rejected by the adapter.
- Network multiplayer is not implemented.

## Architecture

The engine lives as pure TypeScript modules under `src/engine/`, driven by immutable state and dispatched commands. A thin Zustand adapter in `src/store/gameStore.ts` bridges the engine into the UI, exposing selectors and command dispatchers. React components in `src/components/` consume those selectors and dispatch commands — they hold no rule logic of their own. See the plan file at `docs/superpowers/plans/2026-07-14-financial-engine-repair.md` for the full repair scope and milestone context.
