# CoinPack: pitch numbers and odds explainer

Read-aloud notes for the presenter. Numbers come from `pnpm sim 1000000` (1 million simulated packs of the §3.3 rules with IR-2's six tiers); they match Person 1's 100k draws of the contract's own `drawMultiplier`.

## The one-liner

> Open a pack for 0.1 MON, get 3 to 5 crypto tokens. About 1 in 3 packs beats its price, 1 in 200 is a 5–10x Ultra Legendary, and the house edge is a published ~3%. The odds are public and drawn on-chain.

## Live on Monad testnet (show this to judges)

| Contract | Address |
|---|---|
| PackVault (draws + mints) | [`0x9a8fb673ac069c8dcbc1dd0b4d44fd35a77d81cf`](https://testnet.monadexplorer.com/address/0x9a8fb673ac069c8dcbc1dd0b4d44fd35a77d81cf) |
| PriceOracle (live prices) | [`0x15285aa8248390d45abf0a4522e0677d7fae05ee`](https://testnet.monadexplorer.com/address/0x15285aa8248390d45abf0a4522e0677d7fae05ee) |

Every pack is a `PackOpened` event on the vault: open the vault on the explorer, pick any transaction, and the seed, tier, multiplier and every card are right there in the logs.

## Headline numbers

| | |
|---|---|
| Pack price | **0.1 MON** (testnet) |
| Expected value | **0.967x** the price → house edge **≈ 3.3%** |
| Packs within ±5% of the price | **≈ 12%** (outcomes are spread out on purpose) |
| Packs worth more than you paid | **≈ 31%** (about 1 in 3) |
| Median pack | **0.84x** (5th–95th percentile 0.44x – 1.93x) |
| Best possible / worst possible | **10.0x / 0.4x** |
| Packs with at least one Legendary card | **≈ 4.9%** (1 in 20) |
| Cards per pack | **3, 4 or 5** (equal chance); the best card holds about half the pack's value |

## The odds table (what's on the Odds page)

| Tier | Chance | Roughly | Pack value |
|---|---|---|---|
| Common | 45% | about 1 in 2 | 0.40x – 0.80x |
| Uncommon | 30% | about 1 in 3 | 0.80x – 1.05x |
| Rare | 16% | about 1 in 6 | 1.05x – 1.40x |
| Epic | 6% | 1 in 17 | 1.40x – 2.20x |
| Legendary | 2.5% | 1 in 40 | 2.20x – 4.00x |
| Ultra Legendary | 0.5% | 1 in 200 | 5.00x – 10.00x |

Inside each tier the pack value is uniform between the two bounds.

Card rarities (per card): Common 75%, Rare 20%, Epic 4.5%, Legendary 0.5%. A Legendary card is worth about 2.6x the whole pack on average (value weights 4 / 12 / 60 / 250). On a Legendary or Ultra Legendary pack the last card is always Legendary (shown as Mythic / Ultra Legendary) and carries most of the value, which is why the reveal saves the best card for last.

## How it works (30 seconds)

1. **One transaction.** You pay 0.1 MON; the contract draws the result, mints the 3–5 tokens straight to your wallet and emits the result, all in the same transaction. Monad confirms in about a second, so there's no "pending" screen.
2. **Value is real-priced.** Each mock token tracks its real coin's price from CoinGecko, pushed on-chain every 60 seconds. The contract converts each card's share of the pack value into a token amount at that price.
3. **Odds are public.** The tier table above lives in the contract, and the full draw (seed, tier, multiplier, every card) is in the on-chain event, so anyone can check a pull on the explorer.

## Why Monad

- ~1 s blocks make the draw-and-reveal feel instant; on a slow chain this UX needs a two-step "come back later" flow.
- Cheap gas means minting 3–5 tokens per pack is affordable.
- Full EVM: standard Solidity, OpenZeppelin, viem and wallets work unchanged.

## Be upfront about (judges will ask)

- **Randomness is demo-grade.** The seed mixes the previous blockhash, `prevrandao`, timestamp, a user-supplied seed and the request id, and we block contract callers. A validator could still bias it. The production fix is commit/reveal or Pyth Entropy; it's on our roadmap.
- **This is gambling-adjacent.** Testnet only, free faucet MON, mock tokens, odds published. Going live would need licensing, age checks and geo-restrictions first, and real tokens would make it a financial product.
- **Published house edge.** ~3.3% (EV 0.967x) keeps it sustainable; it comes straight from the public tier table, so shifting any tier's range moves it.

## If something breaks during the demo

- Backend down: the app still works; prices stay at their last on-chain values and the live feed is just empty.
- Testnet down: run the mock-mode build and show the contract code plus a past `PackOpened` event on the explorer.
