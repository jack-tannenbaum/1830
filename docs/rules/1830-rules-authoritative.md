# 1830 Authoritative Rules Reference

This document is the rules baseline for this implementation. It is derived from
the BoardGameGeek rules text pasted by the project owner on 2026-07-14. When
other editions, PDFs, existing code, or comments conflict with this document,
this document wins unless the project owner explicitly approves a change.

Source: <https://boardgamegeek.com/wiki/page/1830_Rules>

## 1. Objective and end conditions

Players are railroad investors, promoters, and presidents. Wealth comes mainly
from dividends and appreciation of railroad stock.

The game ends when either:

1. The Bank is exhausted.
2. A player goes bankrupt.

Final wealth is personal cash plus stock certificates at current market value.
Surviving player-owned private companies count at face value. Corporation cash,
trains, tokens, and other corporation assets never count toward a player's
wealth.

## 2. Setup

- Seat order is determined by shuffled place cards, clockwise from the Banker.
- The Banker distributes a total of $2,400 equally among all players:
  - 3 players: $800 each
  - 4 players: $600 each
  - 5 players: $480 each
  - 6 players: $400 each
- All remaining money forms the Bank.
- Private companies begin face up and Bank-owned.
- Corporation certificates begin in separate Initial Offering stacks with each
  president's certificate on top.
- Initial Offering shares and Bank Pool shares must remain distinguishable.
- The Bank Pool begins empty.
- Trains and the tile inventory are public information.

## 3. Round structure

The game alternates Stock Rounds and sets of Operating Rounds.

- Initially, one Operating Round follows each Stock Round.
- Beginning after the next Stock Round following the first 3-train purchase,
  two Operating Rounds follow each Stock Round.
- Beginning after the next Stock Round following the first 5-train purchase,
  three Operating Rounds follow each Stock Round.

## 4. General Stock Round procedure

On a turn a player may:

- Sell any legal number of certificates and buy one legal certificate, in
  either order.
- Only buy.
- Only sell.
- Pass.

A player who sells stock in a corporation may not buy that corporation again
until the next Stock Round.

A Stock Round ends only after every player passes consecutively. A prior pass
does not prevent a player from acting again if another player subsequently
trades.

Priority Deal goes to the player left of the last player who bought or sold. If
no transaction occurred, its current holder retains it.

## 5. Operating Round overview

Private companies pay their fixed revenue first. Railroads then operate from
highest to lowest current market value. For equal values:

1. A token farther right operates first.
2. Tokens in the same space operate from top to bottom.

A corporation performs these steps in order:

1. Optionally lay or upgrade one tile.
2. Optionally buy and place one station token.
3. Run its trains.
4. Pay all train revenue as dividends or withhold all of it.
5. Optionally or, when required, buy trains.

Revenue earned in step 4 cannot fund track or token actions earlier in the same
turn. A corporation may buy a private company at any point in its own Operating
Round turn when such purchases are permitted.

## 6. Private companies

Private companies pay fixed income every Operating Round to their player or
corporation owner. They do not lay normal track, place ordinary tokens, or own
trains.

All private companies must be sold before ordinary corporation stock becomes
available.

## 7. Initial private-company auction

Private companies are offered in increasing face-value order, beginning with
the Schuylkill Valley Navigation and Railroad Company (SVN). On a turn while a
private remains unsold, a player must do exactly one of:

1. Buy the currently offered company at its current price.
2. Bid on a later unsold company.
3. Pass.

A bid on a later company must exceed face value or its current high bid by at
least $5. Bid money is locked until that company's ownership is resolved.

When the company preceding a bid-on company is sold:

- One bid: the sole bidder buys it for that bid.
- Multiple bids: only existing bidders enter an auction. The highest original
  bid remains the standing high bid; raises are at least $5.

After resolution, play resumes with the player left of the last player who
bought a company offered by the Banker.

If everyone passes while SVN is unsold, begin another round and reduce only
SVN's price by $5. If nobody buys it at $5, the first player offered it at that
price receives it for free, and this counts as a purchase.

If everyone passes after SVN has sold, end the Stock Round, pay revenue to all
owned private companies, then begin another Stock Round.

No certificates may be sold during the first Stock Round. Corporation stock is
available only after every private company has an owner.

## 8. Corporation stock and par prices

Each corporation has ten 10% shares represented by eight ordinary 10%
certificates and one 20% president's certificate.

The president's certificate must be the first certificate bought from the
Initial Offering, except that the B&O private owner automatically receives the
B&O president's certificate.

Legal par prices are $67, $71, $76, $82, $90, and $100. Par is recorded on the
Par Chart and the corporation's market token begins in the corresponding red
market space.

- Unsold Initial Offering shares always cost par.
- Bank Pool shares always cost current market value.
- A corporation receives ten times par as initial capital when it begins its
  first Operating Round, regardless of how much stock remains unsold.

The initial purchaser of Camden & Amboy receives a free 10% PRR share. It may
not be sold until the PRR president's certificate has been bought and PRR has a
defined value.

## 9. Stock market movement

- During a Stock Round, move a corporation straight down one row for each 10%
  sold into the Bank Pool. All shares in a single sale are paid at the
  pre-sale price.
- At Stock Round end, move a corporation up one row if no shares remain in its
  Initial Offering or Bank Pool.
- A dividend moves an operating corporation one space right, or up one row if
  it is already at the right edge.
- Withholding or earning no dividend moves an operating corporation one space
  left, or down one row if it is already at the left edge.
- A corporation that has not sold five certificates does not move except
  downward due to sales into the Pool.
- A token entering an occupied market space goes beneath all tokens already
  there.

## 10. Presidency and certificate limits

The president is the holder of the 20% certificate. Presidency changes
immediately when another player owns a strictly larger percentage. A tie does
not remove the incumbent.

On a presidency change, the outgoing president exchanges the 20% certificate
for two ordinary 10% certificates from the incoming president. Ownership
percentages do not change.

If several eligible players tie after the old president sells, presidency goes
to the tied player next to the old president's left.

The president's certificate may never enter the Bank Pool. A president cannot
dump the presidency unless another player owns at least 20% and can receive the
president's certificate.

Normally a player may own no more than five certificates in one corporation.
Orange-zone corporations have no per-corporation holding limit.

The total certificate limit depends on player count. Operating private-company
certificates count. Yellow-zone corporation certificates do not count. Brown-
zone stock is exempt from buying and holding limits and any available quantity
may be bought in one turn.

If a presidency change leaves a player over a limit, the player must correct it
on their next Stock Round turn.

## 11. Flotation

A corporation floats after five certificates representing at least 60% have
been sold from the Bank. Shares later sold into the Pool do not undo flotation.
Shares granted through B&O, C&A, or M&H private-company effects count toward
sales.

At the beginning of its first Operating Round, the corporation receives its
charter, available tokens, and full capitalization of ten times par.

Corporation cash and assets must remain strictly separate from every player's
personal assets.

## 12. Stock sales and the Bank Pool

- No stock may be sold during the first Stock Round.
- The Bank Pool may never hold more than 50% of a corporation.
- Players may not trade corporation stock directly with one another.
- All sales go to the Pool and all Pool purchases come from it.
- Pool transactions occur at the current market price.
- The president's certificate never enters the Pool.

## 13. Track construction

An operating railroad may lay or upgrade one tile per Operating Round. Track
laying is optional.

- Yellow tiles may be laid on legal beige hexes from the start.
- Green tiles become available after the first 3-train purchase and generally
  upgrade yellow tiles.
- Brown tiles become available after the first 5-train purchase and generally
  upgrade green tiles.
- Upgrades must preserve every existing track connection and add track.
- Replaced yellow and green tiles return to the available inventory.
- A lay or upgrade must extend a route available from one of the corporation's
  tokens, subject to the printed exceptions.
- Track may not run off the board, into a blank gray edge, or across a blocked
  lake or river edge.
- Tile cities must match the printed city type and count.
- A water hex costs $80 and a mountain hex costs $120 on its first tile lay.
  Later upgrades do not repay that terrain cost.
- A player-owned private blocks tile laying on its location. A corporation-owned
  or closed private does not.

Special cases include the NYC and Erie home hexes, New York, Baltimore/Boston,
the C&SL private, and the D&H private. Their printed restrictions and private
abilities override ordinary connectivity where stated.

## 14. Tokens

A token:

1. Provides a railhead from which the corporation may run routes.
2. Prevents rival routes from passing beyond a fully occupied city.

The home token is placed free when the corporation first operates. Erie may
choose either city in its printed home hex.

A corporation may place at most one additional token per turn. Its first
additional token costs $40; later ones cost $100. The destination must have an
open slot and be connected to a current railhead without passing through a city
fully blocked by rivals.

The same corporation may not place two tokens on the same tile or hex. A token
may not block the unstarted home city of another corporation.

## 15. Routes and revenue

A route is a continuous track path joining at least two revenue locations.

- It may not reverse at a junction, change tracks at a crossover, repeat a
  track segment, or visit the same station twice.
- It may enter a city on one connection and leave by another.
- A red offboard may be a route endpoint but not an intermediate location.
- Every route must include at least one token belonging to the operating
  corporation.
- Routes run by different trains may meet or cross at stations, or use separate
  tracks on the same tile, but may not share a track segment.
- A numbered train counts each visited city or offboard and may visit at most
  its printed number. It may run shorter.
- A Diesel may run any legal length.
- Trains may not be combined.

The corporation must declare and receive the highest legal revenue it can
demonstrate. The higher red-offboard values apply immediately after the first
5-train is bought.

On a dividend, each 10% share receives 10% of total train revenue. Unsold Initial
Offering shares pay nothing. Dividends for Pool shares go to the corporation's
treasury. Private-company income owned by a corporation always goes to treasury
and is never part of train dividends.

On withholding, all train revenue goes to the corporation treasury.

## 16. Train ownership and purchases

A corporation that has a legal route must own a train by the end of its turn.
Trains bought during a turn cannot run until the corporation's next turn.

Bank trains become available in increasing order. A corporation may buy:

- A currently available Bank train at face value.
- A train from another corporation for any mutually agreed legal price.

Corporations sharing a president may transact for as little as $1.

Train limits are:

- Four before the first 4-train.
- Three after the first 4-train.
- Two after the first 5-train.

Excess trains are returned immediately to the Bank without compensation.

After the first 6-train, Diesels are available for $1,100 or for $800 with a 4,
5, or 6 traded in. The first Diesel removes all remaining 4-trains from play.

## 17. Phase events

Events occur immediately when the first train of a type is bought:

- 2: yellow tiles; four-train limit.
- 3: green tiles; corporations may buy private companies.
- 4: all 2-trains rust; three-train limit.
- 5: brown tiles; remaining privates close; two-train limit; high offboard
  revenue applies.
- 6: all 3-trains rust; Diesels become available.
- Diesel: all 4-trains rust.

Yellow tiles remain available throughout. Green and brown remain available once
introduced. Phase events affect every corporation and player.

## 18. Private-company sales and closure

Players may trade private companies with one another for any mutually agreed
price during either party's Stock Round turn, except in the first Stock Round.

After the first 3-train, a corporation may buy a private from a player during
its own Operating Round turn for between half and twice face value. A
corporation cannot sell a private.

- The B&O private closes when the B&O corporation buys its first train.
- M&H closes if exchanged for a 10% NYC share under its special ability.
- All other surviving privates close on the first 5-train.
- Privates cannot close voluntarily or enter the Bank Pool.

An open player-owned private counts at face value at game end. Closed or
corporation-owned privates have no final player value.

## 19. Forced train purchases and bankruptcy

If a corporation is required to own a train and cannot afford one:

1. It must spend all treasury cash.
2. Its president must contribute personal cash toward the cheapest available
   Bank train.
3. If necessary, the president must sell legal stock immediately and may sell
   private companies if a buyer exists.
4. Emergency sales may transfer presidencies of other corporations but may not
   transfer the presidency of the trainless corporation.
5. The president may arrange a train purchase from another corporation they
   control but is not required to do so.
6. Personal contributions cannot be used for optional trains or any other
   corporation expense.
7. A train bought from another corporation with president assistance may not
   cost more than face value.

If the required amount still cannot be raised, the president is bankrupt and
the game ends immediately.

## 20. End of game

### Bankruptcy

The game ends immediately. Corporations that have not yet operated in the
current Operating Round lose their turns. The bankrupt player scores remaining
stock they were unable to sell; all other players score normally.

### Bank exhaustion

Finish the complete Operating Round set associated with the current or just
completed Stock Round, then end before the next Stock Round.

- If the Bank empties in a Stock Round, finish that Stock Round and its full
  following Operating Round set.
- If it empties during an Operating Round set, finish every remaining Operating
  Round in that set.
- Unpayable Bank obligations are recorded and added to final scores, or players
  may replenish the Bank equally to keep physical payouts operating.

The player with the greatest final personal wealth wins.

