# @coinpack/backend (Person 2)

Small Fastify API: live token prices (CoinGecko → `PriceOracle`), the odds table, and a recent-pulls feed from `PackOpened` logs. Optional: the app works without it.

## Run

```bash
cd backend
pnpm install          # or from the repo root once the workspace exists
cp .env.example .env  # optional; the root .env is also read
pnpm dev              # http://localhost:4000, restarts on file changes
pnpm sim              # odds simulation (pass a draw count: pnpm sim 2000000)
```

## API (§3.8)

| Route | Returns |
|---|---|
| `GET /api/health` | `{ ok: true, pricesUpdatedAt }` (0 until the first CoinGecko fetch) |
| `GET /api/catalog` | 12 `TokenInfo` with live `priceUsd` and `priceWei` (§3.4 order) |
| `GET /api/odds` | `Odds` from the §3.3 tier table |
| `GET /api/feed/recent?limit=20` | `FeedItem[]`, newest first, max 50 |

## Behaviour

- **Deployment file.** Reads `contracts/deployments/monad-testnet.json` and re-reads it whenever it changes, so after Person 1 deploys just `git pull`; no restart. Until it has real addresses, the catalog uses placeholder addresses `0x…a0`–`0x…ab` and the feed is empty.
- **Prices.** Every 60 s fetches the 12 coins plus MON (`monad` on CoinGecko; falls back to `MON_USD_FALLBACK`). `priceWei = usd / monUsd × 1e18`. If `UPDATER_PRIVATE_KEY` is set and contracts are live, calls `PriceOracle.setPrices`. That key's address must be the oracle's updater (give it to Person 1, or have them call `setUpdater`), and it needs a little faucet MON for gas.
- **Feed.** Polls `PackOpened` every 2 s from `deployBlock`. Monad testnet rejects `eth_getLogs` ranges over ~100 blocks, so logs are fetched in 100-block chunks (not the 1,000 in §6), and it never looks back more than ~20k blocks.

## Env

`MONAD_RPC_URL`, `BACKEND_PORT` (4000), `MON_USD_FALLBACK` (0.05), `UPDATER_PRIVATE_KEY`. See `.env.example`.
