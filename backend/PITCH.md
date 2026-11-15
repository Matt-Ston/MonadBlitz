# CoinPack: pitch numbers and odds explainer

Read-aloud notes for the presenter. Numbers come from `pnpm sim 400000` (400k simulated packs of the exact §3.3 v3 rules).

## The one-liner

> Open a pack for 0.1 MON, get 10 crypto tokens. About 1 in 4 packs beats its price, 1 in 200 is a 3–5x jackpot, and the house edge is a published 4%. The odds are public and drawn on-chain.

## Live on Monad testnet (show this to judges)

| Contract | Address |
|---|---|
| PackVault (draws + mints) | [`0x9a8fb673ac069c8dcbc1dd0b4d44fd35a77d81cf`](https://testnet.monadexplorer.com/address/0x9a8fb673ac069c8dcbc1dd0b4d44fd35a77d81cf) |
| PriceOracle (live prices) | [`0x15285aa8248390d45abf0a4522e0677d7fae05ee`](https://testnet.monadexplorer.com/address/0x15285aa8248390d45abf0a4522e0677d7fae05ee) |

Every pack is a `PackOpened` event on the vault: open the vault on the explorer, pick any transaction, and the seed, tier, multiplier and all 10 cards are right there in the logs.

## Headline numbers

| | |
|---|---|
| Pack price | **0.1 MON** (testnet) |
| Expected value | **0.960x** the price → house edge **≈ 4%** |
| Packs within ±5% of the price | **≈ 36%** |
| Packs worth more than you paid | **≈ 28%** (about 1 in 4) |
| Median pack | **0.95x** (5th–95th percentile 0.70x – 1.11x) |
| Best possible / worst possible | **5.0x / 0.3x** |
| Packs with at least one Legendary card | **≈ 7.8%** (1 in 13) |

## The odds table (what's on the Odds page)

| Tier | Chance | Roughly | Pack value |
|---|---|---|---|
| Core | 92% | most packs | 0.62x – 1.29x, centred on 0.95x |
| Big Loss | 5% | 1 in 20 | 0.30x – 0.70x |
| Big Win | 2.5% | 1 in 40 | 1.30x – 2.00x |
| Jackpot | 0.5% | 1 in 200 | 3.00x – 5.00x |

Card rarities (per card): Common 75%, Rare 20%, Epic 4.5%, Legendary 0.5%. A Legendary is worth about 1.1x the whole pack on average (value weights 4 / 12 / 60 / 250). On a Big Win or Jackpot the last card is always Legendary and carries most of the value, which is why the reveal saves the best card for last.

## How it works (30 seconds)

1. **One transaction.** You pay 0.1 MON; the contract draws the result, mints the 10 tokens straight to your wallet and emits the result, all in the same transaction. Monad confirms in about a second, so there's no "pending" screen.
2. **Value is real-priced.** Each mock token tracks its real coin's price from CoinGecko, pushed on-chain every 60 seconds. The contract converts each card's share of the pack value into a token amount at that price.
3. **Odds are public.** The tier table above lives in the contract, and the full draw (seed, tier, multiplier, every card) is in the on-chain event, so anyone can check a pull on the explorer.

## Why Monad

- ~1 s blocks make the draw-and-reveal feel instant; on a slow chain this UX needs a two-step "come back later" flow.
- Cheap gas means minting 10 tokens per pack is affordable.
- Full EVM: standard Solidity, OpenZeppelin, viem and wallets work unchanged.

## Be upfront about (judges will ask)

- **Randomness is demo-grade.** The seed mixes the previous blockhash, `prevrandao`, timestamp, a user-supplied seed and the request id, and we block contract callers. A validator could still bias it. The production fix is commit/reveal or Pyth Entropy; it's on our roadmap.
- **This is gambling-adjacent.** Testnet only, free faucet MON, mock tokens, odds published. Going live would need licensing, age checks and geo-restrictions first, and real tokens would make it a financial product.
- **Published house edge.** 4% (EV 0.96x) keeps it sustainable, and it's set by one constant in the Core formula (`9500`); `10000` would centre the EV on 1.0x.

## If something breaks during the demo

- Backend down: the app still works; prices stay at their last on-chain values and the live feed is just empty.
- Testnet down: run the mock-mode build and show the contract code plus a past `PackOpened` event on the explorer.
