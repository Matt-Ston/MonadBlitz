# CoinPack

A pack-opening app where every pack holds 10 crypto tokens instead of cards, drawn on-chain on Monad testnet. See [`READMEmonad.md`](./READMEmonad.md) for the full architecture doc (ownership, interfaces, timeline).

## Quickstart

```bash
pnpm install       # always from the repo root
pnpm dev:mock      # web only, mock mode: no wallet, chain or backend needed
```

Open http://localhost:3000.

## Real mode (Monad testnet)

```bash
pnpm dev           # backend (:4000) + web (:3000), real mode
pnpm dev:web       # web only, real mode (works without the backend; no USD prices or shared feed)
```

Connect a wallet on Monad testnet (chain 10143), get testnet MON from https://faucet.monad.xyz (about 0.16 MON per pack including gas), and open a pack.

The root scripts set `NEXT_PUBLIC_MOCK` for you, and the sdk falls back to the public RPC (`https://testnet-rpc.monad.xyz`) and `http://localhost:4000` for the backend, so no env file is needed. To override, put `NEXT_PUBLIC_*` vars in **`web/.env.local`** (Next.js reads `.env*` from `web/`, not the repo root); see [`.env.example`](./.env.example). Variables set by the root scripts win over `web/.env.local`.

## Contracts (Monad testnet)

| Contract | Address |
|---|---|
| PackVault | [`0x9a8fb673ac069c8dcbc1dd0b4d44fd35a77d81cf`](https://testnet.monadexplorer.com/address/0x9a8fb673ac069c8dcbc1dd0b4d44fd35a77d81cf) |
| PriceOracle | [`0x15285aa8248390d45abf0a4522e0677d7fae05ee`](https://testnet.monadexplorer.com/address/0x15285aa8248390d45abf0a4522e0677d7fae05ee) |

The 12 mock token addresses are in [`contracts/deployments/monad-testnet.json`](./contracts/deployments/monad-testnet.json).

## Layout

| Folder | Owner | Package |
|---|---|---|
| `contracts/` | Person 1 | Foundry project |
| `backend/` | Person 2 | `@coinpack/backend` |
| `web/` | Person 3 | `@coinpack/web` |
| `sdk/` + root | Person 4 | `@coinpack/sdk` |

Each person writes only inside their own folder. Section 3 of `READMEmonad.md` is the frozen shared interface.
