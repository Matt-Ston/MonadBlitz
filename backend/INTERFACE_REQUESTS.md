# Interface requests from Person 2

## IR-1: Rarer rare cards, and make them worth more (§3.3 steps 4–5)

**Status:** proposed by Person 2. Needs a yes from the team, then Person 1 (contract + redeploy) and Person 4 (sdk mock). One redeploy covers both changes.

**Why:** today a Legendary turns up in **1 pack in 5** and averages only a third of the pack's value, so rare pulls come too easily and don't feel valuable. After this change a Legendary turns up in **1 pack in 13** and is on average worth **more than the whole pack**.

**What changes (two constants, nothing else):**

| | Current | Proposed |
|---|---|---|
| Step 4 rarity cutoffs on `r(10+i) % 10000` | `6000 / 8800 / 9800` | **`7500 / 9500 / 9950`** |
| Per-card odds C / R / E / L | 60 / 28 / 10 / 2 % | **75 / 20 / 4.5 / 0.5 %** |
| Step 5 `RARITY_MUL` | `[10, 15, 25, 40]` | **`[4, 12, 60, 250]`** |

Unchanged: tiers, multipliers, EV, the slot-9 rule (forced Legendary + `w_9 *= 4` on BIG_WIN/JACKPOT), and all `Pull`/event/type shapes.

**Simulated with** `RARITY_CUTS=7500,9500,9950 RARITY_MUL=4,12,60,250 pnpm sim 300000`:

| | Current | Proposed |
|---|---|---|
| Packs with ≥1 Legendary | 20.9% (1 in 5) | **7.8% (1 in 13)** |
| Packs with ≥1 Epic or better | 72.9% (nearly every pack) | **41.9% (1 in 2)** |
| Avg Common card | 0.074x pack | 0.056x pack |
| Avg Epic card | 0.165x | 0.427x |
| Avg Legendary card | 0.356x | **1.152x** |
| Best card's share of the pack | 21% | 37% |
| Expected value / within ±5% / tier odds | 0.988x / 85.8% | **unchanged** |

The 1-in-13 includes the forced Legendary on every Big Win/Jackpot, which the web shows as Mythic (1 in 40) and Ultra Legendary (1 in 200). Each tier stays strictly rarer than the one below it. Commons still show as whole units.

### Changes

**Person 1, `contracts/src/PackVault.sol` `_buildPulls`:**
```solidity
rarity = x < 7500 ? 0 : x < 9500 ? 1 : x < 9950 ? 2 : 3;
// ...
uint256 mul = rarity == 0 ? 4 : rarity == 1 ? 12 : rarity == 2 ? 60 : 250;
```
Then:
1. Re-run the tests. Test (a) (values sum to `totalValueWei`) and (c) (average multiplier) still hold, because the split doesn't change totals.
2. Redeploy, keep the updater as `0x1FD608aa75ec266B98002B3a0f9B2Ea1bd712784`, and commit the new `deployments/monad-testnet.json` with the new `deployBlock`.

The backend switches to the new addresses on `git pull` without a restart. Packs opened on the old vault won't appear in the new feed.

**Person 4, `sdk/src/mock.ts`:** the same two lines (`x < 7500 ? 0 : x < 9500 ? 1 : x < 9950 ? 2 : 3` and `RARITY_MUL = [4, 12, 60, 250]`), so mock mode matches.

**Person 3, web Odds page:** the rarity sentence becomes "75% Common, 20% Rare, 4.5% Epic, 0.5% Legendary".

**Person 2:** set these as the `sim.ts` defaults and update PITCH.md once it's agreed.

**Doc:** §3.3 steps 4–5 with the new numbers; bump the doc version (§3 changed).

### Cost
About 15 minutes for Person 1 (two lines, tests, redeploy), plus everyone runs `git pull`. If time is short, skip it: everything works with the current numbers.
