# CoinPack

A pack-opening app where every pack holds 10 crypto tokens instead of cards, drawn on-chain on Monad testnet. See [`READMEmonad.md`](./READMEmonad.md) for the full architecture doc (ownership, interfaces, timeline).

## Quickstart

```bash
pnpm install
pnpm dev:mock   # web only, mock mode — no wallet, chain or backend needed
```

Open http://localhost:3000.

For real mode (once contracts are deployed and the backend is running):

```bash
cp .env.example .env
# fill in NEXT_PUBLIC_MOCK=0 and the RPC/backend URLs
pnpm dev        # backend + web together
```

## Layout

| Folder | Owner | Package |
|---|---|---|
| `contracts/` | Person 1 | Foundry project |
| `backend/` | Person 2 | `@coinpack/backend` |
| `web/` | Person 3 | `@coinpack/web` |
| `sdk/` + root | Person 4 | `@coinpack/sdk` |

Each person writes only inside their own folder. Section 3 of `READMEmonad.md` is the frozen shared interface.
