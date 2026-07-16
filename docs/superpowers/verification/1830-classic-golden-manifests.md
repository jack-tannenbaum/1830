# 1830 Classic Golden Manifests

Date: 2026-07-16  
Status: Independently reviewable source transcription  
Normative source: [`1830 RE Rules.pdf`](../../../1830%20RE%20Rules.pdf), 1830 Classic side only

## 1. Purpose and transcription notes

This document records the exact static manifests needed to verify the
`1830-classic` game definition. It is fixture evidence, not engine or UI design.
It intentionally contains no inferred board geometry, neighbor graph, track
rotation, terrain, revenue, or other board data.

The repository PDF contains 28 pages. Citations below use the PDF's printed
section and page numbers. The PDF does not contain `C-*` section identifiers or
`T-*` table identifiers.

Every quantity and upgrade edge below was transcribed from the visible PDF
tables, then checked against the printed color totals. A dash (`—`) means the
source table prints no successor; it does not mean an omitted or unknown edge.

## 2. Train manifest

Source: PDF p. 5, **Trains** table and its immediately following note. Train
purchase, trade-in, and phase rules are in PDF §6.6, p. 23.

| Type | Price | Physical cards | Effective Classic supply | Notes |
|---|---:|---:|---|---|
| 2 | $80 | 6 | 6 | First depot type |
| 3 | $180 | 5 | 5 | Available after all 2s leave the depot |
| 4 | $300 | 4 | 4 | Available after all 3s leave the depot |
| 5 | $450 | 3 | 3 | Available after all 4s leave the depot |
| 6 | $630 | 2 | 2 | Available after all 5s leave the depot |
| D | $1,100, or $800 with one 4/5/6 trade-in | 6 | Unlimited | Additional paper Diesels are issued if all six physical cards are in use |

Extraction note: the component manifest prints six Diesel cards, but the note
under the table explicitly says Diesel supply is theoretically unlimited. Six
is therefore a component count, not a legal supply cap.

## 3. Phase manifest

Sources: PDF §§2.0–2.7, pp. 10–11, and **The Phases** summary table on p. 27.

| Phase | Begins when | Newly available train | Playable tile colors | Train limit | Corporations may buy privates | Private closure | ORs between Stock Rounds | Off-board revenue | Immediate train removal |
|---|---|---|---|---:|---|---|---:|---|---|
| 1 | Game begins | — | None | — | No | No | — | — | — |
| 2 | All Private Companies have been purchased | 2 | Yellow | 4 | No | No | 1 | Lower | — |
| 3 | First 3 is purchased | 3 | Yellow, green | 4 | Yes | No | 2, beginning after the next Stock Round | Lower | — |
| 4 | First 4 is purchased | 4 | Yellow, green | 3 | Yes | No | 2 | Lower | All 2s |
| 5 | First 5 is purchased | 5 | Yellow, green, brown | 2 | No | All open privates | 3, beginning after the next Stock Round | Higher immediately | — |
| 6 | First 6 is purchased | 6 and D | Yellow, green, brown | 2 | No | Already closed | 3 | Higher | All 3s |
| 7 | First D is purchased | D | Yellow, green, brown | 2 | No | Already closed | 3 | Higher | All 4s |

Verification notes:

- Phase 2 begins when all privates have been purchased, not when the first 2 is
  purchased.
- The first 3 and first 5 change the number of Operating Rounds only after the
  next Stock Round. An Operating Round set already in progress does not grow.
- The first 6 makes Diesels available alongside any remaining 6s.
- 1830 Classic has no playable gray tiles and no gray-tile phase.

## 4. Railroad station-token manifest

Source: PDF p. 28, **The Railroads** table. Placement costs and restrictions are
in PDF §6.3, p. 20.

| Corporation | Initials | Station tokens including home | Starting city | Printed hex |
|---|---|---:|---|---|
| Pennsylvania | PRR | 4 | Altoona | H-12 |
| New York Central | NYC | 4 | Albany | E-19 |
| Canadian Pacific | CPR | 4 | Montreal | A-19 |
| Baltimore & Ohio | B&O | 3 | Baltimore | I-15 |
| Chesapeake & Ohio | C&O | 3 | Cleveland | F-6 |
| Erie | Erie | 3 | Buffalo | E-11 |
| New York, New Haven, & Hartford | NNH | 2 | New York | G-19 |
| Boston & Maine | B&M | 2 | Boston | E-23 |

The counts include the free home station. The first additional station costs
$40; every later additional station costs $100. Stock-market markers, par
markers, and round markers are not included in this supply.

## 5. Private Company manifest

Sources: PDF **The Private Companies** table on p. 9, private effects and
§§3.0–3.2 on p. 11, and the Classic private appendix on p. 27.

| Private | PDF initials | Face value | Revenue | Printed hex or hexes | Exact Classic effect relevant to implementation |
|---|---|---:|---:|---|---|
| Schuylkill Valley | SV | $20 | $5 | G-15 | No special effect |
| Champlain & St. Lawrence | CS | $40 | $10 | B-20 | A corporation owner may place a tile on B-20 without station or track connection. This is an additional placement beyond its normal tile placement for that turn. |
| Delaware & Hudson | DH | $70 | $15 | F-16 | A corporation owner may place yellow tile 57 on F-16 without station or track connection. It pays the normal $120 mountain cost and consumes its normal tile placement. It may place a free station there in the same turn. If it omits the station, later placement follows normal reachability and cost. Another corporation's ordinary tile placement there ends these special opportunities. |
| Mohawk & Hudson | MH | $110 | $20 | D-18 | A player owner may exchange MH for an available NYC 10% share from the Initial Offering or Bank Pool if that player may legally hold it. The exchange may occur during that player's Stock Round turn or between player/corporation turns in a Stock or Operating Round. The exchange closes MH. |
| Camden & Amboy | CA | $160 | $25 | H-18 | The initial purchaser immediately receives a PRR 10% share without payment. CA does not close and has no additional Operating Round action. |
| Baltimore & Ohio | BO | $220 | $30 | I-13 and I-15 | The owner immediately receives the B&O president certificate without payment and sets par. BO cannot be sold to a corporation and does not follow the B&O presidency. It closes when the B&O corporation buys its first train. |

General private rules verified by PDF §§3.0–3.2 and §§6.2.1:

- During phases 3 and 4, corporations may buy player-owned privates for a
  publicly declared price from one-half through twice face value, inclusive.
- A corporation may buy a private at any point in that corporation's Operating
  Round turn. A corporation-owned private cannot be resold.
- A tile cannot be placed on a hex containing an open player-owned private.
  Ordinary placement is permitted when the private is corporation-owned or
  closed.
- All open privates close when the first 5 is purchased. MH also closes on its
  share exchange, and BO also closes when B&O buys its first train.

Source ambiguities and typographical inconsistencies:

1. PDF p. 9 and the p. 27 summary table give CA a face value of **$160**. The
   prose heading in the p. 27 appendix says `165/25`. `$160` is the table-backed
   value and the one used by the physical certificate and Classic setup.
2. The PDF table abbreviates Champlain & St. Lawrence as `CS`, while nearby
   prose sometimes calls it `CL`. These are references to the same private; IDs
   must not be inferred from inconsistent prose abbreviations.
3. The PDF clearly says the D&H tile consumes the normal tile placement and its
   special station is free. It does not explicitly state whether that free
   station also consumes the corporation's ordinary one-station allowance. That
   interaction requires a documented rules reconciliation; this manifest does
   not invent an answer.

## 6. Track-tile inventory and upgrade edges

Source: PDF p. 28, **Track Tile Manifest & Upgrades**. Placement and upgrade
rules are in PDF §§6.2–6.2.2, pp. 17–19.

### 6.1 Yellow tiles — 34 total

| Tile ID | Quantity | Legal green successors printed in source |
|---:|---:|---|
| 1 | 1 | — |
| 2 | 1 | — |
| 3 | 2 | — |
| 4 | 2 | — |
| 7 | 4 | 18, 26, 27, 28, 29 |
| 8 | 8 | 16, 19, 23, 24, 25, 28, 29 |
| 9 | 7 | 18, 19, 20, 23, 24, 26, 27 |
| 55 | 1 | — |
| 56 | 1 | — |
| 57 | 4 | 14, 15 |
| 58 | 2 | — |
| 69 | 1 | — |

Quantity check: `1+1+2+2+4+8+7+1+1+4+2+1 = 34`.

### 6.2 Green tiles — 25 total

| Tile ID | Quantity | Legal brown successors printed in source |
|---:|---:|---|
| 14 | 3 | 63 |
| 15 | 2 | 63 |
| 16 | 1 | 43, 70 |
| 18 | 1 | 43 |
| 19 | 1 | 45, 46 |
| 20 | 1 | 44, 47 |
| 23 | 3 | 41, 43, 45, 47 |
| 24 | 3 | 42, 43, 46, 47 |
| 25 | 1 | 40, 45, 46 |
| 26 | 1 | 42, 44, 45 |
| 27 | 1 | 41, 44, 46 |
| 28 | 1 | 39, 43, 46, 70 |
| 29 | 1 | 39, 43, 45, 70 |
| 53 | 2 | 61 |
| 54 | 1 | 62 |
| 59 | 2 | 64, 65, 66, 67, 68 |

Quantity check: `3+2+1+1+1+1+3+3+1+1+1+1+1+2+1+2 = 25`.

### 6.3 Brown tiles — 26 total

| Tile ID | Quantity | Successors |
|---:|---:|---|
| 39 | 1 | — |
| 40 | 1 | — |
| 41 | 2 | — |
| 42 | 2 | — |
| 43 | 2 | — |
| 44 | 1 | — |
| 45 | 2 | — |
| 46 | 2 | — |
| 47 | 1 | — |
| 61 | 2 | — |
| 62 | 1 | — |
| 63 | 3 | — |
| 64 | 1 | — |
| 65 | 1 | — |
| 66 | 1 | — |
| 67 | 1 | — |
| 68 | 1 | — |
| 70 | 1 | — |

Quantity check: `1+1+2+2+2+1+2+2+1+2+1+3+1+1+1+1+1+1 = 26`.

### 6.4 Whole-set checks

| Color | PDF total | Transcribed total |
|---|---:|---:|
| Yellow | 34 | 34 |
| Green | 25 | 25 |
| Brown | 26 | 26 |
| **All playable tiles** | **85** | **85** |

The source prints no playable gray inventory and no brown successor edges.
Legality still depends on rotation, preservation of old track, matching city
shape and label, reachability, boundary restrictions, phase, and remaining
supply. Presence in the successor table alone is necessary but not sufficient
for a legal upgrade.
