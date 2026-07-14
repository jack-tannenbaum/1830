# Financial Engine Milestone — Verification

```
Plan: docs/superpowers/plans/2026-07-14-financial-engine-repair.md
Verified SHA: TBD
Verified at: TBD
```

## Automated gate

| Command | Result | Notes |
| --- | --- | --- |
| `npm test` | TBD | |
| `npm run lint` | TBD | |
| `npm run build` | TBD | |

## Manual walkthrough

1. 3-player setup gives each player $800 in starting cash.
   - Result: TBD
2. SVN declines resolve correctly through the private auction.
   - Result: TBD
3. C&A and B&O flow through their private-company purchase and assignment paths.
   - Result: TBD
4. First Stock Round blocks share sales.
   - Result: TBD
5. A later Stock Round allows sell-then-buy in the same turn and Finish Turn advances play.
   - Result: TBD
6. An accepted private-company trade transfers ownership and cash.
   - Result: TBD
7. Presidency assignment and float capitalization trigger correctly.
   - Result: TBD
8. Operating Round shell is labeled incomplete and can be cycled without executing rule-authoritative operations.
   - Result: TBD
9. Undo, reload, and legacy-save rejection all behave as specified.
   - Result: TBD
10. Bank exhaustion is detected and reported.
    - Result: TBD

## Known limitations

- TBD
