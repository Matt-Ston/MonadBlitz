# @coinpack/backend (Person 2)

Small Fastify API: live token prices (CoinGecko → `PriceOracle`), the odds table, and a recent-pulls feed from `PackOpened` logs. Optional: the app works without it.

## Run

```bash
cd backend
pnpm install          # or from the repo root once the workspace exists
cp .env.example .env  # optional; the root .env is also read
pnpm dev              # http://localhost:4000, restarts on file changes
pnpm sim              # odds simulation (pass a draw count: pnpm sim 2000000)
pnpm smoke            # checks a running backend against §3.8 (pass a URL to check a hosted one)
```

Anyone on the team can run `pnpm smoke` before integrating to confirm the API is up and shaped right.

## API (§3.8)

| Route | Returns |
|---|---|
| `GET /api/health` | `{ ok: true, pricesUpdatedAt }` (0 until the first CoinGecko fetch) |
| `GET /api/catalog` | 12 `TokenInfo` with live `priceUsd` and `priceWei` (§3.4 order) |
| `GET /api/odds` | `Odds` from the §3.3 tier table |
| `GET /api/feed/recent?limit=20` | `FeedItem[]`, newest first, max 50 |

## Behaviour

- **Deployment file.** Reads `contracts/deployments/monad-testnet.json` and re-reads it whenever it changes, so after Person 1 deploys just `git pull`; no restart. Until it has real addresses, the catalog uses placeholder addresses `0x…a0`–`0x…a8`, `0x…b9`–`0x…bb` (same as the web mocks) and the feed is empty.
- **Prices.** Every 60 s fetches the 12 coins plus MON (`monad` on CoinGecko; falls back to `MON_USD_FALLBACK`). `priceWei = usd / monUsd × 1e18`. If CoinGecko fails, the last prices are kept.
- **Catalog `priceWei` = on-chain oracle once live.** That's what the contract mints at, so collection values always agree with the pack reveal. Falls back to the CoinGecko value for any token the oracle can't answer.
- **Pushing to the oracle (gas-safe).** Only when contracts are live, `UPDATER_PRIVATE_KEY` is set, some price moved ≥ 1% from the on-chain value, our address *is* the oracle's `updater()`, and the wallet holds ≥ 0.05 MON. Otherwise it logs why and sends nothing. Monad charges the full gas limit, so pushing every minute would burn ~0.9 MON/hour.
- **Feed.** Polls `PackOpened` every 2 s from `deployBlock`. Monad testnet rejects `eth_getLogs` ranges over ~100 blocks, so logs are fetched in 100-block chunks (not the 1,000 in §6), at most 10 chunks per poll to stay under RPC rate limits, and never further back than ~20k blocks.
- **Testing without contracts.** `DEPLOYMENT_FILE=/path/to/fake.json pnpm dev` reads a different deployment file; nothing in `contracts/` is touched.

## Updater address (for Person 1)

`UPDATER_ADDRESS=0x1FD608aa75ec266B98002B3a0f9B2Ea1bd712784`. Set it as the `PriceOracle` updater at deploy (or `setUpdater` afterwards). The key lives only in Person 2's local `backend/.env`.

## Env

`MONAD_RPC_URL`, `BACKEND_PORT` (4000), `MON_USD_FALLBACK` (0.05), `UPDATER_PRIVATE_KEY`. See `.env.example`.
