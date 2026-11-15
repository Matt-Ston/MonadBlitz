# CoinPack: Master Architecture Doc (3-hour build)

> Working name "CoinPack". Rename freely; nothing depends on the name.
> Target: Monad Blitz hackathon, Monad **testnet** (EVM), team of 4, **3 hours total**.
> Doc version: **v2.1** (2026-11-15). v2 cuts scope for a 3-hour build (see §13). v2.1 adds the §15 integration checklist (additive; §3 shapes unchanged). Bump the version when any §3 interface changes.

---

## 0. READ THIS FIRST (instructions for each teammate's Claude)

You are one of four Claude instances helping a 4-person team that has **3 hours** to ship. Each human owns exactly one section and one top-level folder.

1. **Find out which person you work for.** The human should start with "I am Person N". If they didn't, ask before writing code.
2. **Only create or modify files inside your own folder** (table below). You may *read* other folders (e.g. `contracts/abi/`), never write to them.
3. **§3 (Shared Interfaces) is frozen.** Build exactly to it. If it must change, write the proposal in `<your-folder>/INTERFACE_REQUESTS.md` and tell your human. Don't change it yourself.
4. **Build against mocks first** (§3.10) so nobody waits on anybody.
5. **[PROPOSAL]** marks a default chosen by the doc author. Use it as written.
6. **Time is the constraint.** Do the MVP list in order, hit your checkpoint times (§10), and prefer the simplest working code over polish. Don't add tests, abstractions or features beyond what's listed. Only start Stretch after your MVP works end to end.
7. **Read §15 (Integration checklist) before writing code, and again after every `git pull`.** Where §15 is more specific than §5–§8, §15 wins. Do the unchecked items for your person, and when you finish one, tick its box (`[x]`) in the same commit as the code. That one-line edit to §15 is the only change you may make outside your own folder.

| Person | Role | Owns folder | Section | On critical path? |
|---|---|---|---|---|
| Person 1 | Smart contracts + testnet deploy | `contracts/` | §5 | Yes |
| Person 2 | Prices, odds and live feed (small backend) + pitch numbers | `backend/` | §6 | No (app works without it) |
| Person 3 | Frontend: pack-opening experience | `web/` | §7 | Yes |
| Person 4 | Repo root, SDK (wallet + chain hooks), hosting | `sdk/` + repo root | §8 | Yes |

---

## 1. Product in one paragraph

A pack-opening app in the style of trading-card pack draws, except every pack holds **10 crypto tokens** instead of cards. The user pays a fixed price (0.1 testnet MON) per pack. The **total value of the 10 tokens** is random: most of the time it lands within **±5% of the pack price**, and occasionally the user hits a big loss or a big win. The tokens are minted to the user's wallet as testnet ERC-20s. Odds are public and the draw happens on-chain.

**Theme rule:** use the pack-draw *mechanic* only. No names, art, sounds or branding from any existing trading-card game. Rarity names are generic (Common, Rare, Epic, Legendary). Token art is our own generated badges (coloured circle + ticker), not official logos.

### Demo flow (what judges see)
1. Connect wallet (Monad testnet).
2. Click **Open Pack** (0.1 MON), confirm in wallet.
3. Pack-shake animation while the tx mines (Monad is fast, ~1 s).
4. 10 tokens flip one by one, lowest value first, best card last.
5. Summary: "You paid 0.1 MON, pulled 0.1031 MON (+3.1%)", tier banner, confetti on a big win.
6. Collection page shows token balances and their value.
7. Odds page shows the tier table.

---

## 2. System architecture

```
                ┌──────────────────── Monad testnet ────────────────────┐
  user wallet ──┼─ openPack(seed) + 0.1 MON ─▶ PackVault ──▶ PriceOracle │
      ▲         │      (draw happens in this     │  mints               │
      │         │       same transaction)        └─▶ MockToken x12      │
      │         │   event: PackOpened(...)                             │
      │         └──────────────┬───────────────────────▲────────────────┘
      │       receipt / logs   │                       │ setPrices (every 60 s)
  ┌───┴──────────────┐         │             ┌─────────┴──────────┐   CoinGecko
  │ web/ (P3)        │◀────────┘             │ backend/ (P2)      │◀── prices
  │ uses sdk/ (P4)   │── GET catalog/odds/feed ▶ tiny Fastify API │
  └──────────────────┘                       └────────────────────┘
```

- **One transaction per pack.** `openPack` takes payment, draws the outcome, mints 10 tokens and emits `PackOpened`. The sdk parses the result straight from the tx receipt. No keeper, no pending state.
- **The backend is optional.** It pushes live prices to the oracle and serves catalog USD prices, odds and a recent-pulls feed. If it's down, prices stay at their deploy-time values and the app still works.
- **The web app only talks to `@coinpack/sdk`**, never to viem/wagmi or the backend directly.

### Tech stack [PROPOSAL]
| Layer | Choice |
|---|---|
| Monorepo | pnpm workspaces, Node 20, TypeScript |
| Contracts | Solidity ^0.8.24, Foundry, OpenZeppelin 5 |
| Backend | Node + TypeScript, Fastify, viem, in-memory only |
| SDK | TypeScript, viem, wagmi v2, @tanstack/react-query, RainbowKit |
| Web | Next.js 14 (app router), Tailwind, Framer Motion, canvas-confetti |
| Hosting | Web on Vercel; backend on a teammate's laptop (or Railway if quick) |

### Network
| Key | Value |
|---|---|
| Chain | Monad Testnet |
| Chain ID | `10143` |
| RPC | `https://testnet-rpc.monad.xyz` |
| Explorer | `https://testnet.monadexplorer.com` |
| Native token | MON (testnet, from the faucet) |

**Everyone: get faucet MON into your wallet in the first 10 minutes.** Person 1 needs enough for deploy gas.

---

## 3. Shared interfaces (FROZEN, v2.0)

### 3.1 Repository layout and ownership

```
coinpack/
├── ARCHITECTURE.md          # this doc (team-owned; change only by agreement)
├── README.md                # P4
├── package.json             # P4 (pnpm workspace root)
├── pnpm-workspace.yaml      # P4  -> packages: [sdk, web, backend]
├── .env.example  .gitignore # P4
├── contracts/               # P1  (Foundry project, not a pnpm package)
│   ├── abi/                 #     committed: PackVault.json, PriceOracle.json, MockToken.json
│   └── deployments/         #     committed: monad-testnet.json
├── backend/                 # P2  ("@coinpack/backend")
├── web/                     # P3  ("@coinpack/web")
└── sdk/                     # P4  ("@coinpack/sdk")
```

Allowed cross-folder **reads**: `contracts/abi/*.json` and `contracts/deployments/*.json` by relative path. `web` and `backend` may import types from `@coinpack/sdk`. Nothing else.

### 3.2 Units and conventions
- On-chain amounts are `uint256` wei. **All mock tokens use 18 decimals.**
- Token prices are **MON wei per 1 whole token** (`priceWei`). E.g. BTC $95,000 and MON $0.05 → `priceWei = 1_900_000e18`.
- Multipliers are basis points (`10000 = 1.00x`).
- Over JSON every bigint is a **decimal string**; addresses are lowercase `0x`; times are unix seconds.
- `requestId` starts at 1 and increments.

### 3.3 The draw algorithm [PROPOSAL] (Solidity is the source of truth; Person 2's TS copy is only for the odds simulation)

**Seed.** `seed = keccak256(abi.encode(blockhash(block.number - 1), block.prevrandao, block.timestamp, userSeed, msg.sender, requestId))`

**Random words.** `r(k) = uint256(keccak256(abi.encode(seed, k)))`

**Step 1: tier.** `t = r(0) % 10000`

| Tier | Enum | Condition | Probability | Multiplier range | Mean |
|---|---|---|---|---|---|
| BIG_LOSS | 0 | `t < 500` | 5.0% | 0.30x – 0.70x | 0.50x |
| CORE | 1 | `500 ≤ t < 9700` | 92.0% | ≈ Normal(0.98x, σ 2%), bounded 0.86x – 1.10x | 0.98x |
| BIG_WIN | 2 | `9700 ≤ t < 9950` | 2.5% | 1.30x – 2.00x | 1.65x |
| JACKPOT | 3 | `t ≥ 9950` | 0.5% | 3.00x – 5.00x | 4.00x |

**Step 2: multiplier `multBps`.** Let `R = r(1)`.
- CORE: `S = Σ_{j=0..11} ((R >> (16*j)) & 0xFFFF)`; `multBps = 9800 + ((int(S) - 393210) * 200) / 65536` (signed, truncating toward zero).
- BIG_LOSS: `3000 + R % 4001` · BIG_WIN: `13000 + R % 7001` · JACKPOT: `30000 + R % 20001`

**Step 3.** `totalValueWei = packPrice * multBps / 10000`

**Step 4: tokens.** For slot `i = 0..9`: rarity roll `x = r(10+i) % 10000`: `< 6000` Common(0), `< 8800` Rare(1), `< 9800` Epic(2), else Legendary(3). If tier is BIG_WIN or JACKPOT, **slot 9 is forced Legendary**. Token = `tokensByRarity[rarity][ r(30+i) % len ]` (catalog order, §3.4).

**Step 5: split.** `w_i = (50 + r(50+i) % 101) * RARITY_MUL[rarity_i]`, `RARITY_MUL = [10, 15, 25, 40]`; on BIG_WIN/JACKPOT `w_9 *= 4`. `valueWei_i = totalValueWei * w_i / Σw` for `i < 9`; slot 9 gets the remainder. `amount_i = valueWei_i * 1e18 / priceWei(token_i)`.

**Stats** (400k-draw Monte Carlo of this exact algorithm): expected value ≈ **0.988x** (house edge ≈ 1.2%); **≈ 86%** of packs within ±5% of price; 1 in 40 is a 1.3–2x win, 1 in 200 a 3–5x jackpot, 1 in 20 a 0.3–0.7x loss. To centre exactly on the price, change `9800` to `10000` (EV ≈ 1.008; fine on testnet).

### 3.4 Token catalog [PROPOSAL]

12 mock ERC-20s (18 decimals, minted only by PackVault). Deploy-time USD prices are a snapshot; Person 2 refreshes them live. MON is priced at $0.05 for the snapshot (Person 2 replaces it with the live price if found).

| # | Symbol | Name | Rarity | CoinGecko id | Snapshot USD | Colour |
|---|---|---|---|---|---|---|
| 0 | mDOGE | Mock Doge | Common | dogecoin | 0.20 | `#C2A633` |
| 1 | mADA | Mock Cardano | Common | cardano | 0.60 | `#0033AD` |
| 2 | mXRP | Mock XRP | Common | ripple | 2.00 | `#23292F` |
| 3 | mTRX | Mock Tron | Common | tron | 0.25 | `#EF0027` |
| 4 | mLINK | Mock Chainlink | Rare | chainlink | 15 | `#2A5ADA` |
| 5 | mAVAX | Mock Avalanche | Rare | avalanche-2 | 20 | `#E84142` |
| 6 | mDOT | Mock Polkadot | Rare | polkadot | 4 | `#E6007A` |
| 7 | mSOL | Mock Solana | Epic | solana | 150 | `#9945FF` |
| 8 | mBNB | Mock BNB | Epic | binancecoin | 900 | `#F3BA2F` |
| 9 | mBTC | Mock Bitcoin | Legendary | bitcoin | 95000 | `#F7931A` |
| 10 | mETH | Mock Ether | Legendary | ethereum | 3200 | `#627EEA` |
| 11 | mMON | Mock Monad | Legendary | monad (verify) | 0.05 | `#836EF9` |

Snapshot `priceWei = usd / 0.05 * 1e18`. The table order is the constructor order.

### 3.5 Contract interface (Solidity)

Person 1 commits this as `contracts/src/interfaces/IPackVault.sol` **in the first 20 minutes** and exports ABIs from it, so Person 4 can code against it before deployment.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPackVault {
    enum Tier { BIG_LOSS, CORE, BIG_WIN, JACKPOT }

    struct Pull {
        address token;
        uint8   rarity;    // 0 Common, 1 Rare, 2 Epic, 3 Legendary
        uint256 amount;    // token wei
        uint256 valueWei;  // MON wei at draw-time price
    }

    struct TokenInfo { address token; uint8 rarity; }

    event PackOpened(
        uint256 indexed requestId,
        address indexed buyer,
        uint256 pricePaid,
        Tier tier,
        uint32 multiplierBps,
        uint256 totalValueWei,
        bytes32 seed,
        Pull[10] pulls
    );

    error WrongPayment();
    error NoContracts(); // msg.sender != tx.origin

    function packPrice() external view returns (uint256);
    function nextRequestId() external view returns (uint256);
    function catalog() external view returns (TokenInfo[] memory);

    /// Pay exactly packPrice(). userSeed: random bytes32 from the client. Draws, mints, emits PackOpened.
    function openPack(bytes32 userSeed) external payable returns (uint256 requestId);
}

interface IPriceOracle {
    function setPrices(address[] calldata tokens, uint256[] calldata pricesWei) external; // only updater
    function getPrice(address token) external view returns (uint256 priceWei, uint64 updatedAt);
    function updater() external view returns (address);
}
```

Owner-only admin (`setPackPrice`, `withdraw`) is Person 1's choice and not shared.

### 3.6 Deployment file

`contracts/deployments/monad-testnet.json` (Person 1 writes; Persons 2 and 4 read). Person 1 commits a placeholder with zero addresses in the first 20 minutes.

```json
{
  "network": "monad-testnet",
  "chainId": 10143,
  "deployBlock": 0,
  "packVault": "0x0000000000000000000000000000000000000000",
  "priceOracle": "0x0000000000000000000000000000000000000000",
  "packPriceWei": "100000000000000000",
  "tokens": [
    { "index": 0, "symbol": "mDOGE", "name": "Mock Doge", "rarity": 0, "address": "0x...", "coingeckoId": "dogecoin", "color": "#C2A633" }
  ]
}
```

### 3.7 Shared TypeScript types (`sdk/src/types.ts`, Person 4)

Persons 2 and 3 may paste these locally until the sdk lands, then switch to `import ... from '@coinpack/sdk'`.

```ts
export type Hex = `0x${string}`;
export type Rarity = 0 | 1 | 2 | 3;
export const RARITY_NAMES = ['Common', 'Rare', 'Epic', 'Legendary'] as const;
export type Tier = 'BIG_LOSS' | 'CORE' | 'BIG_WIN' | 'JACKPOT'; // enum index 0..3
export const TIERS: Tier[] = ['BIG_LOSS', 'CORE', 'BIG_WIN', 'JACKPOT'];

export interface TokenInfo {
  index: number; address: Hex; symbol: string; name: string; decimals: 18;
  rarity: Rarity; color: string;
  priceWei: string;     // MON wei per whole token
  priceUsd?: number;    // only when the backend is up
}

export interface Pull { slot: number; token: Hex; symbol: string; rarity: Rarity; amount: string; valueWei: string; }

export interface PackResult {
  requestId: string; buyer: Hex; txHash: Hex; openedAt: number;
  pricePaidWei: string; tier: Tier; multiplierBps: number; totalValueWei: string; seed: Hex;
  pulls: Pull[];        // length 10, contract slot order
}

export interface Holding { token: Hex; symbol: string; rarity: Rarity; balance: string; valueWei: string; }

export interface OddsRow { tier: Tier; probabilityBps: number; minMultBps: number; maxMultBps: number; meanMultBps: number; }
export interface Odds { rows: OddsRow[]; expectedValueBps: number; withinFivePctBps: number; packPriceWei: string; }

export interface FeedItem { requestId: string; buyer: Hex; tier: Tier; multiplierBps: number; totalValueWei: string; openedAt: number; }
```

### 3.8 Backend REST API (Person 2 serves, Person 4 consumes)

Base URL `NEXT_PUBLIC_BACKEND_URL` (default `http://localhost:4000`). JSON, CORS open.

| Method | Path | Returns |
|---|---|---|
| GET | `/api/health` | `{ ok: true, pricesUpdatedAt: number }` |
| GET | `/api/catalog` | `TokenInfo[]` with `priceUsd` (12 items, §3.4 order) |
| GET | `/api/odds` | `Odds` |
| GET | `/api/feed/recent?limit=20` | `FeedItem[]` newest first (from `PackOpened` logs) |

### 3.9 SDK API (Person 4 provides, Person 3 consumes)

```ts
export function CoinPackProvider(props: { children: React.ReactNode }): JSX.Element; // wagmi + react-query + RainbowKit
export { ConnectButton } from '@rainbow-me/rainbowkit';

export function useConnection(): { address?: Hex; isConnected: boolean; isWrongChain: boolean; switchChain(): Promise<void> };
export function usePackPrice(): { priceWei?: bigint };
export function useCatalog(): { data?: TokenInfo[] };   // backend, falls back to deployment file + on-chain prices
export function useOdds(): { data: Odds };              // backend, falls back to a constant built from §3.3

export function useOpenPack(): {
  open(): Promise<PackResult>;                           // resolves once the tx is mined and PackOpened is parsed
  status: 'idle' | 'signing' | 'mining' | 'done' | 'error';
  error?: Error;
  last?: PackResult;
};

export function useHoldings(address?: Hex): { data?: Holding[]; refetch(): void }; // on-chain balanceOf multicall
export function useRecentFeed(): { data?: FeedItem[] };                            // backend; empty if down

export function formatMon(wei: string | bigint, dp?: number): string;  // "0.1031"
export function pctChange(paidWei: string, gotWei: string): number;    // 3.1 means +3.1%
export function sortPullsForReveal(pulls: Pull[]): Pull[];             // ascending valueWei
export const MOCK: boolean;                                            // NEXT_PUBLIC_MOCK === '1'
```

**Mock mode** (`NEXT_PUBLIC_MOCK=1`): every hook works with no wallet, chain or backend. `open()` waits 1200 ms and returns a fixture (pick CORE 88%, BIG_WIN 5%, JACKPOT 3%, BIG_LOSS 4% so demos show variety). Person 4 ships this **by 0:45**.

### 3.10 Mock fixtures

```json
{
  "catalogEntry": { "index": 9, "address": "0x00000000000000000000000000000000000000b9", "symbol": "mBTC", "name": "Mock Bitcoin", "decimals": 18, "rarity": 3, "color": "#F7931A", "priceWei": "1900000000000000000000000", "priceUsd": 95000 },
  "packResultCore": {
    "requestId": "42", "buyer": "0x1111111111111111111111111111111111111111",
    "txHash": "0xaaaa000000000000000000000000000000000000000000000000000000000000", "openedAt": 1763233201,
    "pricePaidWei": "100000000000000000", "tier": "CORE", "multiplierBps": 10310, "totalValueWei": "103100000000000000",
    "seed": "0xcccc000000000000000000000000000000000000000000000000000000000000",
    "pulls": [
      { "slot": 0, "token": "0x00000000000000000000000000000000000000a0", "symbol": "mDOGE", "rarity": 0, "amount": "1600000000000000000", "valueWei": "6400000000000000" },
      { "slot": 1, "token": "0x00000000000000000000000000000000000000a2", "symbol": "mXRP",  "rarity": 0, "amount": "190000000000000000",  "valueWei": "7600000000000000" },
      { "slot": 2, "token": "0x00000000000000000000000000000000000000a4", "symbol": "mLINK", "rarity": 1, "amount": "40000000000000000",   "valueWei": "11000000000000000" },
      { "slot": 3, "token": "0x00000000000000000000000000000000000000a1", "symbol": "mADA",  "rarity": 0, "amount": "550000000000000000",  "valueWei": "6900000000000000" },
      { "slot": 4, "token": "0x00000000000000000000000000000000000000a5", "symbol": "mAVAX", "rarity": 1, "amount": "16000000000000000",   "valueWei": "8800000000000000" },
      { "slot": 5, "token": "0x00000000000000000000000000000000000000a3", "symbol": "mTRX",  "rarity": 0, "amount": "1000000000000000000", "valueWei": "5800000000000000" },
      { "slot": 6, "token": "0x00000000000000000000000000000000000000a7", "symbol": "mSOL",  "rarity": 2, "amount": "4200000000000000",    "valueWei": "16100000000000000" },
      { "slot": 7, "token": "0x00000000000000000000000000000000000000a0", "symbol": "mDOGE", "rarity": 0, "amount": "1900000000000000000", "valueWei": "7600000000000000" },
      { "slot": 8, "token": "0x00000000000000000000000000000000000000a6", "symbol": "mDOT",  "rarity": 1, "amount": "70000000000000000",   "valueWei": "9400000000000000" },
      { "slot": 9, "token": "0x00000000000000000000000000000000000000b9", "symbol": "mBTC",  "rarity": 3, "amount": "12368421052",         "valueWei": "23500000000000000" }
    ]
  }
}
```
Values sum to `totalValueWei`; amounts other than mBTC are illustrative. Also make a JACKPOT variant (`multiplierBps` 41200, slot 9 Legendary holding ~70% of the total) and a BIG_LOSS variant (`multiplierBps` 4300) by scaling the same pulls.

### 3.11 Environment variables (root `.env.example`, Person 4)

| Var | Used by | Example |
|---|---|---|
| `MONAD_RPC_URL` | contracts, backend | `https://testnet-rpc.monad.xyz` |
| `DEPLOYER_PRIVATE_KEY` | contracts | secret, never commit |
| `UPDATER_ADDRESS` | contracts deploy | Person 2's price-pusher address |
| `UPDATER_PRIVATE_KEY` | backend | secret, never commit |
| `BACKEND_PORT` | backend | `4000` |
| `MON_USD_FALLBACK` | backend | `0.05` |
| `NEXT_PUBLIC_RPC_URL` | sdk/web | `https://testnet-rpc.monad.xyz` |
| `NEXT_PUBLIC_BACKEND_URL` | sdk/web | `http://localhost:4000` |
| `NEXT_PUBLIC_MOCK` | sdk/web | `1` = mock mode |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | sdk | from cloud.walletconnect.com (any string works for injected wallets only) |

`.gitignore` includes `.env*` (except `.env.example`), `contracts/broadcast/`, `contracts/cache/`, `contracts/out/`, `node_modules`, `.next`. Ports: backend 4000, web 3000.

---

## 4. Randomness and pricing (why it's built this way)

**Randomness [PROPOSAL]: single-transaction draw.** The seed mixes the previous blockhash, `prevrandao`, timestamp, a client-supplied `userSeed`, the sender and the request id. It's one transaction, so there is no keeper and no pending state, which is what makes 3 hours realistic. `msg.sender == tx.origin` blocks the easiest exploit (a contract that opens a pack and reverts if it doesn't like the result). This is **demo-grade, not production-grade**: a validator could bias it, and a determined user could simulate before sending. Say so in the pitch and name the fix: a two-step commit/reveal or Pyth Entropy (stretch, §11).

**Pricing.** Tokens are testnet mocks whose price tracks the real coin. Person 1's deploy script sets snapshot prices (§3.4). Person 2's backend refreshes them from CoinGecko every 60 s if it's running. There is no staleness check, so the demo never breaks on old prices.

**Solvency.** Nothing pays out MON in the MVP (tokens are just minted), so the vault needs no funding. Paid MON accumulates in the vault; the owner can withdraw.

---

## 5. Person 1: Smart contracts (`contracts/`)

**You provide:** deployed contracts on Monad testnet, `contracts/abi/*.json`, `contracts/deployments/monad-testnet.json`.
**You consume:** Person 2's updater address (any address works; you can set yours and hand Person 2 the key later via `setUpdater`).

### Files
```
contracts/
├── foundry.toml
├── src/interfaces/IPackVault.sol   # §3.5 verbatim
├── src/PackVault.sol               # openPack + §3.3 draw inline (or a small library)
├── src/PriceOracle.sol             # owner, updater, setPrices, getPrice
├── src/MockToken.sol               # OZ ERC20, mint only by vault
├── script/Deploy.s.sol             # oracle -> 12 tokens -> vault -> set token minter -> snapshot prices
├── test/PackVault.t.sol            # 3 tests max (see below)
├── abi/  deployments/
└── README.md
```

### MVP (in order, with checkpoints)
1. **By 0:20:** commit `IPackVault.sol`, ABIs exported with `forge inspect <Contract> abi > abi/<Contract>.json` (from interface/stub contracts), placeholder `deployments/monad-testnet.json`. Tell the team "ABIs are up".
2. **By 1:00:** `MockToken`, `PriceOracle`, `PackVault` with §3.3. Tokens' minter is set to the vault after deploy (or deploy tokens from the vault constructor, your call). Default `packPrice = 0.1 ether`.
3. Tests (keep it to these): (a) `openPack` with the right payment mints 10 pulls whose `valueWei` sum to `totalValueWei`; (b) wrong payment reverts; (c) loop 2,000 seeds through an internal/exposed draw function and assert average multiplier in [0.97, 1.0].
4. **By 1:15:** deploy to Monad testnet, write the real deployment JSON (script or by hand), commit, announce. Re-export ABIs from the real contracts if they changed (they shouldn't).
5. Then help Person 4 debug integration.

### Stretch
Two-step commit/reveal or Pyth Entropy; `sellBack(token, amount)` that burns tokens and pays MON at oracle price minus 1% (fund the vault); verify contracts on the explorer.

### Acceptance
`cast send <vault> "openPack(bytes32)" 0x01 --value 0.1ether` on testnet emits `PackOpened` and the buyer holds the 10 pulled tokens.

---

## 6. Person 2: Prices, odds and live feed (`backend/`)

**You provide:** the API in §3.8, live oracle prices, and the odds numbers for the pitch.
**You consume:** `contracts/abi/*.json`, `contracts/deployments/monad-testnet.json`, §3.7 types.
**Not on the critical path.** The app works without you, so you also own the **pitch numbers and the odds explanation** (a short `backend/PITCH.md` the presenter can read from).

### Files
```
backend/
├── package.json  tsconfig.json  README.md  PITCH.md
└── src/
    ├── index.ts      # Fastify on BACKEND_PORT, starts the price loop and feed poller
    ├── config.ts     # env + deployment file
    ├── prices.ts     # CoinGecko simple/price for the 12 ids (+ MON) -> priceWei -> PriceOracle.setPrices every 60 s
    ├── feed.ts       # poll PackOpened logs every 2 s from deployBlock (chunk getLogs by 1,000 blocks), keep last 50
    ├── odds.ts       # Odds object from §3.3 constants
    └── sim.ts        # `pnpm sim`: 200k draws of §3.3 in TS -> EV, P(±5%), tier frequencies
```

### MVP (in order, with checkpoints)
1. **By 0:30:** Fastify up with `/api/health`, `/api/odds`, and `/api/catalog` returning the §3.4 snapshot (placeholder addresses). This unblocks Person 4.
2. **By 1:00:** `sim.ts` confirming §3.3 stats (EV ≈ 0.988, ≈ 86% within ±5%). Use `Math.random`-based draws that follow the same tier/multiplier rules; bit-exact parity isn't needed. Put the results in `PITCH.md`.
3. **By 1:30:** once the deployment JSON lands, `/api/catalog` uses real addresses + live USD prices; the price loop pushes to the oracle with `UPDATER_PRIVATE_KEY`.
4. **By 2:00:** `/api/feed/recent` from `PackOpened` logs.

### Stretch
Leaderboard of biggest pulls; SSE stream of new pulls; share-image endpoint.

### Acceptance
`curl localhost:4000/api/catalog` shows 12 tokens with live USD prices; a pack opened on testnet appears in `/api/feed/recent` within a few seconds.

---

## 7. Person 3: Frontend pack-opening experience (`web/`)

**You consume:** only `@coinpack/sdk` (§3.9). Until it lands (~0:45), use a local stub `web/src/lib/sdk-stub.ts` with the same signatures returning the §3.10 fixtures, then swap the import.

### Screens (MVP)
| Route | What |
|---|---|
| `/` | Hero, pack with price, **Open Pack** button. After opening, the reveal plays **on the same page** (no routing needed). Small recent-pulls ticker if `useRecentFeed` has data. |
| `/collection` | Grid of holdings with value (`useHoldings`). |
| `/odds` | Tier table from `useOdds` + 3 sentences on how the draw works + "testnet demo, no real value". |

### Card design (original theme)
- Rounded card, rarity frame: Common grey, Rare blue, Epic purple, Legendary gold with a shimmer. Our own badge (circle in the token colour + ticker), amount, value in MON (and USD if `priceUsd`).
- Card back: simple abstract pattern. Nothing from existing trading-card games.
- Reveal: cards face-down in a 5x2 grid (2x5 on phones), flip one at a time every 350 ms in `sortPullsForReveal` order (tap to skip). Then a summary bar: paid vs pulled, coloured % change, tier banner. BIG_WIN: glow + confetti. JACKPOT: big confetti + shake. BIG_LOSS: muted "rough pack".

### MVP (in order, with checkpoints)
1. **By 0:20:** Next.js + Tailwind scaffold, layout, nav, `<CoinPackProvider>` slot and `ConnectButton` slot (use the stub until the sdk lands).
2. **By 1:00:** Card component (4 rarities, flip) + the full reveal sequence on `/` driven by fixtures, for CORE, JACKPOT and BIG_LOSS.
3. **By 1:30:** wired to `useOpenPack` (button states from `status`: signing → mining → reveal), wrong-chain and not-connected states, faucet link if the tx fails for lack of MON.
4. **By 2:00:** `/collection` and `/odds`.
5. **2:00–2:30:** polish only.

### Stretch
Sound (own or CC0), pack-shake/tear animation, share-your-pull image.

### Acceptance
With `NEXT_PUBLIC_MOCK=1` the whole demo flow (§1) works with no wallet; in real mode it works on testnet.

---

## 8. Person 4: Repo root, SDK and hosting (`sdk/` + root)

**You own:** `sdk/` and the root files (`package.json`, `pnpm-workspace.yaml`, `.env.example`, `.gitignore`, `README.md`).
**You consume:** `contracts/abi/*.json`, `contracts/deployments/monad-testnet.json`, backend §3.8.

### Files
```
sdk/
├── package.json   # "main"/"types" point at src/index.ts (no build step; Next transpiles it)
└── src/
    ├── index.ts     # re-exports §3.7 and §3.9
    ├── types.ts     # §3.7 verbatim
    ├── chain.ts     # monadTestnet via viem defineChain
    ├── contracts.ts # imports ../../contracts/abi/*.json and ../../contracts/deployments/monad-testnet.json
    ├── provider.tsx # wagmi config + RainbowKit + react-query
    ├── hooks.ts     # all hooks in §3.9 (one file is fine)
    ├── mock.ts      # fixtures + mock implementations
    └── format.ts    # formatMon, pctChange, sortPullsForReveal
```
In `web/next.config.js` Person 3 adds `transpilePackages: ['@coinpack/sdk']` (tell them).

### MVP (in order, with checkpoints)
1. **By 0:15:** create the GitHub repo, add everyone, push the root workspace (`pnpm-workspace.yaml` with `sdk`, `web`, `backend`), `.env.example`, `.gitignore`, empty folders with a `README.md` each. Root scripts: `pnpm dev` (backend + web in parallel), `pnpm dev:mock` (web only, mock on).
2. **By 0:45:** sdk types, helpers and full **mock mode**. Tell Person 3 to switch from their stub.
3. **By 1:20:** real mode: chain + provider, `usePackPrice` (contract read), `useOpenPack` (random `userSeed` via `crypto.getRandomValues`, `writeContract` with `value: packPrice`, wait for receipt, decode `PackOpened` with viem `parseEventLogs`, map to `PackResult` using the catalog for symbols), `useHoldings` (multicall `balanceOf` × 12, value via `priceWei` from the oracle or backend), `useCatalog`/`useOdds`/`useRecentFeed` with fallbacks.
4. **1:30–2:00: run the integration** (§10) on testnet with Person 1.
5. **By 2:30:** deploy web to Vercel (root dir `web`, env vars set, `NEXT_PUBLIC_MOCK=0`), plus a second Vercel deploy or local build with `NEXT_PUBLIC_MOCK=1` as the backup demo. Short root README.

### Acceptance
Fresh clone → `pnpm install && pnpm dev:mock` runs the full UI. Real mode on the hosted URL opens a pack on testnet.

---

## 9. Git workflow (kept minimal for 3 hours)

- One repo, branch `main`. Person 4 creates it at 0:00 and adds everyone.
- **Everyone pushes straight to `main`, but only files in their own folder.** Folders don't overlap, so this is safe and skips PR overhead. Use `git pull --rebase` before each push.
- The only likely conflict is `pnpm-lock.yaml`. If it conflicts: take `main`'s version, run `pnpm install`, commit.
- Push at least every 30 minutes so others can pull your interfaces.
- Interface change: write it in `<folder>/INTERFACE_REQUESTS.md`, agree out loud, Person 4 edits `ARCHITECTURE.md` and bumps the version, everyone tells their Claude to re-read the changed section.
- New contract addresses: Person 1 commits `deployments/monad-testnet.json` and says so; everyone pulls.
- Secrets only in local `.env` files and the Vercel dashboard.

---

## 10. Timeline (3 hours)

| Time | P1 contracts | P2 backend | P3 web | P4 sdk / integration |
|---|---|---|---|---|
| 0:00–0:20 | Faucet MON, interface + ABIs + placeholder deployment pushed | Faucet MON, Fastify scaffold | Next.js scaffold + stub | Repo + workspace pushed (by 0:15) |
| 0:20–1:00 | Tokens, oracle, vault + draw | `/odds` `/catalog` static (0:30), `pnpm sim` | Card + reveal sequence on fixtures | sdk mock mode (0:45) |
| 1:00–1:20 | 3 tests, **deploy to testnet (1:15)** | PITCH.md numbers, price loop ready | Switch to sdk, wire buttons | Real-mode hooks |
| **1:30–2:00** | **Integration: open a real pack from the browser on testnet.** P1 + P4 drive; P2 hooks up live prices and feed; P3 fixes UI issues found. | | | |
| 2:00–2:30 | Stretch or help | Feed + live prices done | Collection, odds, polish | Vercel deploy + mock backup |
| **2:30–3:00** | **Freeze.** Bug fixes only. Rehearse the demo twice. Open a few packs beforehand so the collection and feed have content. | | | |

**Fallback rule:** if the testnet deploy isn't working by 1:45, demo on the mock-mode build and show the contract code and `cast` output on the explorer instead.

**Definition of done:** on the hosted URL a judge connects a wallet on Monad testnet, opens a pack, watches 10 tokens reveal with the right total, sees them in the collection, and can read the odds.

---

## 11. Stretch goals (only after MVP works end to end)

In value order: sell-back to MON (contract + collection button), two-step commit/reveal or Pyth Entropy randomness, leaderboard of biggest pulls, pack-tear animation and sound, share-your-pull image, multiple pack prices.

---

## 12. Gambling and regulatory note (short, honest)

Paying money for a random payout is gambling or close to it in most places (loot-box rules, gaming licences, consumer protection), and real tokens would make it a financial product too. For the hackathon, **run only on testnet with free faucet MON and mock tokens**, say "testnet demo, no real value" on the site, and publish the odds (we do). Anything beyond the demo needs legal advice on licensing, age checks and geo-restrictions first. It's a flag for the pitch, not a blocker.

---

## 13. What v2 cut from v1 (for the 3-hour limit)

- **Keeper and two-step reveal → single-transaction draw.** Removes the pending state, refunds, expiry handling and the backend from the critical path.
- **Sell-back → stretch.** Tokens are just minted; no vault funding needed.
- **Backend trimmed to 4 routes** (health, catalog, odds, feed). Dropped: indexer, pack history, holdings API (sdk reads balances on-chain), stats, SSE.
- **Pages trimmed to 3** (home with in-page reveal, collection, odds). Dropped: history and per-pack result pages.
- **Price staleness checks removed**; snapshot prices at deploy, live refresh optional.
- **Testing trimmed** to 3 contract tests and a TS simulation; no parity vectors, no CI.
- **No local anvil integration**; integrate directly on testnet at 1:30.
- **No PRs**; push to `main`, own folder only.

---

## 14. Prompt to paste into your Claude

> I am Person N on a 4-person hackathon team with a 3-hour build. Attached is our ARCHITECTURE.md. Build only Section [5/6/7/8] and only write files inside `[contracts/ | backend/ | web/ | sdk/ and root files]`. Treat Section 3 as frozen. Read Section 15 first and do my person's unchecked items there; it overrides conflicting details in my section. Work through the MVP list in order and keep to the checkpoint times, use the mocks in 3.10 until the other sections are ready, and ask me instead of changing another folder.

---

## 15. Integration checklist (v2.1, read before coding)

These rules exist so the four folders fit together on the first try. They're additive: no §3 shape changes. Tick `[x]` when an item is done (rule 0.7).

### 15.1 Status snapshot (update when you push)
| Person | Pushed | Still missing |
|---|---|---|
| P1 contracts | **deployed to Monad testnet** (vault `0x9a8f…81cf`, block 80040771), real `deployments/monad-testnet.json`, ABIs, 3 passing tests, acceptance pack opened | nothing for MVP; helping P4 integrate |
| P2 backend | all 4 routes, price loop (serves **on-chain oracle prices** once live), feed, sim, PITCH.md | switch to sdk types (15.4) |
| P3 web | all 3 pages, reveal, running on `web/src/lib/sdk-stub.tsx` | switch to `@coinpack/sdk` (15.5) |
| P4 sdk + root | workspace, root files, sdk in mock mode | shared constants + ABI (15.2), real mode (15.3), env, Vercel |

### 15.2 One source of truth (P4 creates, everyone imports)
Today the catalog, odds table and §3.7 types are copy-pasted in `backend/src/{config,types,odds}.ts`, `web/src/lib/sdk-stub.tsx` and `sdk/src/mock.ts`. Stop copying; import instead.
- [ ] **P4:** `sdk/src/constants.ts`: `CATALOG_SNAPSHOT` (§3.4 rows incl. `coingeckoId`, `usd`, `color`), `ODDS_TABLE` / `ODDS` (§3.3), `PACK_PRICE_WEI`, `CHAIN_ID = 10143`. No React imports.
- [ ] **P4:** `sdk/src/abi.ts`: viem `as const` (or `parseAbi`) for `openPack`, `packPrice`, `nextRequestId`, `catalog`, `PackOpened`, `getPrice`, `setPrices`, `updater`, ERC-20 `balanceOf`. Typed `as const` ABIs give typed event decoding; JSON imports from `contracts/abi/` don't. The sdk then needs only the **addresses** from P1, not the ABI files.
- [ ] **P4:** `sdk/package.json` `"exports"`: `"."` → `src/index.ts`, `"./types"` → `src/types.ts`, `"./constants"` → `src/constants.ts`, `"./abi"` → `src/abi.ts`. The subpaths must stay **React/wagmi-free** so the Node backend can import them.
- **Rule for everyone:** if you need a catalog row, tier number, type or ABI fragment, import it from `@coinpack/sdk/{types,constants,abi}`. Never paste it again.

### 15.3 SDK real mode (P4), behaviours the web already relies on
- [ ] `useOpenPack`: pass viem's error through **unchanged** (web matches `error.message` for "insufficient funds" / "rejected"). Don't pad the gas limit: Monad charges the full gas limit, so let viem estimate.
- [ ] After `PackOpened` is parsed: **invalidate the `useHoldings` query** and **prepend the result to `useRecentFeed` locally**. The backend only polls every 2 s, and the web never calls `refetch()` itself.
- [ ] `useHoldings` and `useCatalog` (fallback path): take `priceWei` from `PriceOracle.getPrice` via multicall, not from CoinGecko, so collection values match what the vault minted. Use the backend only for `priceUsd` (it already serves on-chain prices once live).
- [ ] Provider: wagmi `ssr: true`; import `@rainbow-me/rainbowkit/styles.css` inside the sdk; re-export RainbowKit's `ConnectButton` in real mode.
- [ ] `MOCK` must read `process.env.NEXT_PUBLIC_MOCK` **literally** (Next only inlines literal reads, including inside transpiled packages).
- [ ] **Env location:** Next reads `.env*` from `web/`, not the repo root. Either have the root `dev` script pass the vars, or document `web/.env.local`. (Tell P3 if `next.config.js` needs a line, because P3 owns it.) Fix the root README, which currently says `cp .env.example .env` at the root.
- [ ] Rename `READMEmonad.md` → `ARCHITECTURE.md` (the name §3.1 and the sdk comments use) and update the README link.
- [ ] **Do one Vercel deploy as soon as the sdk switch is in, not at 2:30.** Root dir `web`, install from the workspace root, "include files outside root directory" on (the sdk imports `../../contracts/deployments/*.json`).

### 15.4 Backend (P2)
- [ ] Once 15.2 lands: replace `backend/src/types.ts` and the copied `SNAPSHOT` / tier table with imports from `@coinpack/sdk/types` and `@coinpack/sdk/constants`; add `"@coinpack/sdk": "workspace:*"`. Keep backend-only fields (e.g. `upperBound`) local.
- [ ] Share `packOpenedEvent` / oracle ABI from `@coinpack/sdk/abi` instead of local `parseAbi` strings, so an event change can't drift.

### 15.5 Web (P3)
- [ ] When P4 says real mode is ready: in `web/src/lib/sdk.ts` swap to `export * from '@coinpack/sdk'`, add `"@coinpack/sdk": "workspace:*"` to `web/package.json`, `pnpm install` **from the root**.
- [ ] Delete any local `web/node_modules`, `web/package-lock.json` and `web/.next` from pre-workspace npm installs before the first root `pnpm install` (mixed lockfiles break resolution).
- [ ] Keep `sdk-stub.tsx` until real mode passes 15.7, then delete it.

### 15.6 Contracts (P1)
- [x] Push `IPackVault.sol`, ABIs and placeholder deployment JSON **first**; everyone else is waiting on the shape.
- [x] Deploy script sets snapshot prices **before** any `openPack` (a `priceWei` of 0 divides by zero inside `openPack`). Consider `require(price > 0)` with a clear error.
- [x] Oracle updater = `0x1FD608aa75ec266B98002B3a0f9B2Ea1bd712784` (P2's published address).
- [x] Write the real `deployBlock`, because the backend feed scans from it in 100-block chunks.
- [x] Deployment JSON `tokens[]` must include `symbol`, `name`, `rarity`, `address`, `coingeckoId`, `color` in §3.4 order; sdk and backend both read it, with lowercase addresses.

### 15.7 Integration order and smoke test
1. P1 pushes the interface → P4 finishes 15.2 → P2 and P3 switch imports (mock mode must still work: `pnpm dev:mock`).
2. P1 deploys and commits the real JSON → everyone `git pull` (the backend hot-reloads it; restart `pnpm dev` for web).
3. Smoke test: `pnpm typecheck` at the root passes; `curl localhost:4000/api/catalog` shows real addresses; open one pack in the browser on testnet; the reveal total equals `totalValueWei`; the collection shows the 10 tokens without a reload; the ticker shows the pack.
4. Vercel deploy (real) + mock backup build.
