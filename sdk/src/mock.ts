// Mock-mode fixtures and in-memory draw simulator. ARCHITECTURE.md §3.3/§3.4/§3.10 shapes,
// Math.random-based (bit-exact parity with the contract isn't needed here).
import type { FeedItem, Hex, Odds, PackResult, Pull, Rarity, TokenInfo, Tier } from './types';

export const MOCK: boolean = process.env.NEXT_PUBLIC_MOCK === '1';

const E18 = 10n ** 18n;
export const PACK_PRICE = 100000000000000000n; // 0.1 MON
export const MOCK_ADDRESS: Hex = '0x1111111111111111111111111111111111111111';

const CATALOG_SRC: [string, string, Rarity, number, string][] = [
  ['mDOGE', 'Mock Doge', 0, 0.2, '#C2A633'],
  ['mADA', 'Mock Cardano', 0, 0.6, '#0033AD'],
  ['mXRP', 'Mock XRP', 0, 2, '#23292F'],
  ['mTRX', 'Mock Tron', 0, 0.25, '#EF0027'],
  ['mLINK', 'Mock Chainlink', 1, 15, '#2A5ADA'],
  ['mAVAX', 'Mock Avalanche', 1, 20, '#E84142'],
  ['mDOT', 'Mock Polkadot', 1, 4, '#E6007A'],
  ['mSOL', 'Mock Solana', 2, 150, '#9945FF'],
  ['mBNB', 'Mock BNB', 2, 900, '#F3BA2F'],
  ['mBTC', 'Mock Bitcoin', 3, 95000, '#F7931A'],
  ['mETH', 'Mock Ether', 3, 3200, '#627EEA'],
  ['mMON', 'Mock Monad', 3, 0.05, '#836EF9'],
];
const MOCK_ADDRS: Hex[] = [
  '0x00000000000000000000000000000000000000a0', '0x00000000000000000000000000000000000000a1',
  '0x00000000000000000000000000000000000000a2', '0x00000000000000000000000000000000000000a3',
  '0x00000000000000000000000000000000000000a4', '0x00000000000000000000000000000000000000a5',
  '0x00000000000000000000000000000000000000a6', '0x00000000000000000000000000000000000000a7',
  '0x00000000000000000000000000000000000000a8', '0x00000000000000000000000000000000000000b9',
  '0x00000000000000000000000000000000000000ba', '0x00000000000000000000000000000000000000bb',
];

export const CATALOG: TokenInfo[] = CATALOG_SRC.map(([symbol, name, rarity, usd, color], index) => ({
  index,
  address: MOCK_ADDRS[index],
  symbol,
  name,
  decimals: 18,
  rarity,
  color,
  // priceWei = usd / 0.05 * 1e18
  priceWei: ((BigInt(Math.round(usd * 1e6)) * 20n * E18) / 1_000_000n).toString(),
  priceUsd: usd,
}));

export const ODDS: Odds = {
  rows: [
    { tier: 'BIG_LOSS', probabilityBps: 500, minMultBps: 3000, maxMultBps: 7000, meanMultBps: 5000 },
    { tier: 'CORE', probabilityBps: 9200, minMultBps: 8600, maxMultBps: 11000, meanMultBps: 9800 },
    { tier: 'BIG_WIN', probabilityBps: 250, minMultBps: 13000, maxMultBps: 20000, meanMultBps: 16500 },
    { tier: 'JACKPOT', probabilityBps: 50, minMultBps: 30000, maxMultBps: 50000, meanMultBps: 40000 },
  ],
  expectedValueBps: 9880,
  withinFivePctBps: 8600,
  packPriceWei: PACK_PRICE.toString(),
};

const FIXTURE_CORE_PULLS: Pull[] = [
  { slot: 0, token: '0x00000000000000000000000000000000000000a0', symbol: 'mDOGE', rarity: 0, amount: '1600000000000000000', valueWei: '6400000000000000' },
  { slot: 1, token: '0x00000000000000000000000000000000000000a2', symbol: 'mXRP', rarity: 0, amount: '190000000000000000', valueWei: '7600000000000000' },
  { slot: 2, token: '0x00000000000000000000000000000000000000a4', symbol: 'mLINK', rarity: 1, amount: '40000000000000000', valueWei: '11000000000000000' },
  { slot: 3, token: '0x00000000000000000000000000000000000000a1', symbol: 'mADA', rarity: 0, amount: '550000000000000000', valueWei: '6900000000000000' },
  { slot: 4, token: '0x00000000000000000000000000000000000000a5', symbol: 'mAVAX', rarity: 1, amount: '16000000000000000', valueWei: '8800000000000000' },
  { slot: 5, token: '0x00000000000000000000000000000000000000a3', symbol: 'mTRX', rarity: 0, amount: '1000000000000000000', valueWei: '5800000000000000' },
  { slot: 6, token: '0x00000000000000000000000000000000000000a7', symbol: 'mSOL', rarity: 2, amount: '4200000000000000', valueWei: '16100000000000000' },
  { slot: 7, token: '0x00000000000000000000000000000000000000a0', symbol: 'mDOGE', rarity: 0, amount: '1900000000000000000', valueWei: '7600000000000000' },
  { slot: 8, token: '0x00000000000000000000000000000000000000a6', symbol: 'mDOT', rarity: 1, amount: '70000000000000000', valueWei: '9400000000000000' },
  { slot: 9, token: '0x00000000000000000000000000000000000000b9', symbol: 'mBTC', rarity: 3, amount: '12368421052', valueWei: '23500000000000000' },
];

// ---------- in-memory store (holdings + feed), shared across hook instances ----------
export const balances = new Map<string, bigint>();
for (const p of FIXTURE_CORE_PULLS) balances.set(p.token, (balances.get(p.token) ?? 0n) + BigInt(p.amount));
const now = () => Math.floor(Date.now() / 1000);
export let feed: FeedItem[] = [
  { requestId: '41', buyer: '0x2222222222222222222222222222222222222222', tier: 'BIG_WIN', multiplierBps: 17250, totalValueWei: '172500000000000000', openedAt: now() - 40 },
  { requestId: '40', buyer: '0x3333333333333333333333333333333333333333', tier: 'CORE', multiplierBps: 9930, totalValueWei: '99300000000000000', openedAt: now() - 95 },
  { requestId: '39', buyer: '0x4444444444444444444444444444444444444444', tier: 'BIG_LOSS', multiplierBps: 4300, totalValueWei: '43000000000000000', openedAt: now() - 160 },
  { requestId: '38', buyer: '0x5555555555555555555555555555555555555555', tier: 'JACKPOT', multiplierBps: 41200, totalValueWei: '412000000000000000', openedAt: now() - 300 },
];
let nextId = 42;
let version = 0;
const listeners = new Set<() => void>();
export const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const getVersion = () => version;
const emit = () => {
  version++;
  listeners.forEach((l) => l());
};

// ---------- mock draw (follows §3.3 shape with Math.random) ----------
const rnd = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const randHex = (): Hex => `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
const RARITY_MUL = [10, 15, 25, 40];

export function makeMockResult(): PackResult {
  const roll = Math.random() * 100; // demo mix: CORE 88, BIG_WIN 5, JACKPOT 3, BIG_LOSS 4
  const tier: Tier = roll < 88 ? 'CORE' : roll < 93 ? 'BIG_WIN' : roll < 96 ? 'JACKPOT' : 'BIG_LOSS';
  const multiplierBps =
    tier === 'CORE' ? rnd(9500, 10500) : tier === 'BIG_WIN' ? rnd(13000, 20000) : tier === 'JACKPOT' ? rnd(30000, 50000) : rnd(3000, 7000);
  const total = (PACK_PRICE * BigInt(multiplierBps)) / 10000n;
  const win = tier === 'BIG_WIN' || tier === 'JACKPOT';

  const picks = Array.from({ length: 10 }, (_, i) => {
    const x = rnd(0, 9999);
    let rarity: Rarity = x < 6000 ? 0 : x < 8800 ? 1 : x < 9800 ? 2 : 3;
    if (i === 9 && win) rarity = 3;
    const pool = CATALOG.filter((t) => t.rarity === rarity);
    const token = pool[rnd(0, pool.length - 1)];
    let w = BigInt(rnd(50, 150) * RARITY_MUL[rarity]);
    if (i === 9 && win) w *= 4n;
    return { token, rarity, w };
  });
  const sumW = picks.reduce((s, p) => s + p.w, 0n);
  let used = 0n;
  const pulls: Pull[] = picks.map((p, i) => {
    const valueWei = i < 9 ? (total * p.w) / sumW : total - used;
    used += valueWei;
    return {
      slot: i,
      token: p.token.address,
      symbol: p.token.symbol,
      rarity: p.rarity,
      amount: ((valueWei * E18) / BigInt(p.token.priceWei)).toString(),
      valueWei: valueWei.toString(),
    };
  });

  return {
    requestId: String(nextId++),
    buyer: MOCK_ADDRESS,
    txHash: randHex(),
    openedAt: now(),
    pricePaidWei: PACK_PRICE.toString(),
    tier,
    multiplierBps,
    totalValueWei: total.toString(),
    seed: randHex(),
    pulls,
  };
}

export function recordMockPull(res: PackResult): void {
  for (const p of res.pulls) balances.set(p.token, (balances.get(p.token) ?? 0n) + BigInt(p.amount));
  feed = [
    { requestId: res.requestId, buyer: res.buyer, tier: res.tier, multiplierBps: res.multiplierBps, totalValueWei: res.totalValueWei, openedAt: res.openedAt },
    ...feed,
  ].slice(0, 20);
  emit();
}

export { emit as emitMockUpdate };
