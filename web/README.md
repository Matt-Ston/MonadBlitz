# @coinpack/web (Person 3, ARCHITECTURE §7)

Next.js 14 (app router) + Tailwind + Framer Motion + canvas-confetti. The app talks **only** to the sdk, and every import of it goes through `src/lib/sdk.ts`.

## Run it

```bash
cd web
pnpm install        # or npm install while the workspace root isn't there yet
pnpm dev:mock       # http://localhost:3000, no wallet/chain/backend needed
pnpm dev            # real mode (needs @coinpack/sdk + env vars)
pnpm build
```

## Routes
| Route | What |
|---|---|
| `/` | Hero, pack, Open Pack button (signing → mining → reveal), wrong-chain / not-connected states, faucet link on insufficient MON, recent-pulls ticker |
| `/collection` | Holdings grid with MON (and USD) value, total |
| `/odds` | Tier table, EV, ±5% share, how the draw works, testnet disclaimer |

Reveal: 10 face-down cards (5x2, 2x5 on phones) flip every 350 ms in `sortPullsForReveal` order, best card last. Tap to skip. Then a summary bar and tier banner. Pack tiers (IR-2): COMMON is muted, RARE/EPIC glow (EPIC adds confetti), LEGENDARY fires confetti, and ULTRA_LEGENDARY fires big confetti and shakes the grid.

## SDK

`src/lib/sdk.ts` re-exports `@coinpack/sdk` (workspace package; `next.config.js` transpiles it). Always `pnpm install` from the repo root.
`src/lib/sdk-stub.tsx` is unused and kept only until real mode passes §15.7, then delete it.

Env: copy these into `web/.env.local` (gitignored): `NEXT_PUBLIC_MOCK=1`, `NEXT_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz`, `NEXT_PUBLIC_BACKEND_URL=http://localhost:4000`.

## Notes for Person 4
- **Env vars:** Next.js reads `.env*` from `web/`, not the repo root. Either put `NEXT_PUBLIC_*` vars in `web/.env.local`, or set them in the root scripts (e.g. `"dev:mock": "pnpm --filter @coinpack/web dev:mock"`, which already sets `NEXT_PUBLIC_MOCK=1`).
- **Vercel:** root directory `web`, framework Next.js, and set `NEXT_PUBLIC_MOCK`, `NEXT_PUBLIC_RPC_URL`, `NEXT_PUBLIC_BACKEND_URL` and `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`.
- RainbowKit styles: if the sdk doesn't import `@rainbow-me/rainbowkit/styles.css` itself, tell me and I'll import it in `src/app/layout.tsx`.
- The web app reads `error.message` from `useOpenPack` to detect "insufficient funds" and user rejection, so please pass viem's error through unchanged.

## Files
```
src/app/            layout, providers (CoinPackProvider slot), page (/), collection/, odds/
src/components/     Nav, Pack, Card, TokenBadge, Reveal, FeedTicker
src/lib/sdk.ts      single sdk import point (stub ↔ @coinpack/sdk)
src/lib/sdk-stub.tsx  §3.9 signatures + §3.7 types + mock draw/holdings/feed
src/lib/ui.ts       rarity/tier styles, formatting, faucet/explorer URLs
```
