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
    { tier: 'COMMON', probabilityBps: 4500, minMultBps: 4000, maxMultBps: 8000, meanMultBps: 6000 },
    { tier: 'UNCOMMON', probabilityBps: 3000, minMultBps: 8000, maxMultBps: 10500, meanMultBps: 9250 },
    { tier: 'RARE', probabilityBps: 1600, minMultBps: 10500, maxMultBps: 14000, meanMultBps: 12250 },
    { tier: 'EPIC', probabilityBps: 600, minMultBps: 14000, maxMultBps: 22000, meanMultBps: 18000 },
    { tier: 'LEGENDARY', probabilityBps: 250, minMultBps: 22000, maxMultBps: 40000, meanMultBps: 31000 },
    { tier: 'ULTRA_LEGENDARY', probabilityBps: 50, minMultBps: 50000, maxMultBps: 100000, meanMultBps: 75000 },
  ],
  expectedValueBps: 9665,
  withinFivePctBps: 1190,
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
  { requestId: '41', buyer: '0x2222222222222222222222222222222222222222', tier: 'EPIC', multiplierBps: 17250, totalValueWei: '172500000000000000', openedAt: now() - 40 },
  { requestId: '40', buyer: '0x3333333333333333333333333333333333333333', tier: 'UNCOMMON', multiplierBps: 9930, totalValueWei: '99300000000000000', openedAt: now() - 95 },
  { requestId: '39', buyer: '0x4444444444444444444444444444444444444444', tier: 'COMMON', multiplierBps: 4300, totalValueWei: '43000000000000000', openedAt: now() - 160 },
  { requestId: '38', buyer: '0x5555555555555555555555555555555555555555', tier: 'LEGENDARY', multiplierBps: 31200, totalValueWei: '312000000000000000', openedAt: now() - 300 },
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
// Value-split weight per rarity: a Legendary card is worth about 800x a Common in the same pack.
const RARITY_MUL = [1, 8, 80, 800];

// ---------- mock-only settings (demo odds, pack price); real mode ignores them ----------
export const MOCK_PACK_PRICES: bigint[] = [PACK_PRICE, 10n * PACK_PRICE, 50n * PACK_PRICE]; // 0.1, 1 and 5 MON
let mockPackPrice = PACK_PRICE;
let demoBoost = false;
export const getMockPackPrice = () => mockPackPrice;
export const getDemoBoost = () => demoBoost;
export function setMockPackPrice(wei: bigint): void {
  mockPackPrice = wei;
  emit();
}
export function setDemoBoost(on: boolean): void {
  demoBoost = on;
  emit();
}

// Demo mode: Legendary / Mythic / Ultra packs come up roughly 20x as often as the real odds. Mock mode only.
const DEMO_WEIGHTS = [700, 800, 1000, 2000, 4500, 1000];

function pickTierIdx(): number {
  const weights = demoBoost ? DEMO_WEIGHTS : ODDS.rows.map((r) => r.probabilityBps);
  let roll = Math.random() * weights.reduce((x, y) => x + y, 0);
  for (let i = 0; i < weights.length; i++) if ((roll -= weights[i]) < 0) return i;
  return 0;
}

// The pack's best card always matches its tier, so a good pack never turns out to be all Commons:
// Common / Uncommon packs hold Commons, a Rare pack has a Rare, Epic an Epic, Legendary and Ultra a Legendary.
const BEST_RARITY: Rarity[] = [0, 0, 1, 2, 3, 3];

export function makeMockResult(): PackResult {
  const tierIdx = pickTierIdx();
  const tier: Tier = ODDS.rows[tierIdx].tier;
  const multiplierBps = rnd(ODDS.rows[tierIdx].minMultBps, ODDS.rows[tierIdx].maxMultBps);
  const price = mockPackPrice;
  const total = (price * BigInt(multiplierBps)) / 10000n;
  const win = tier === 'LEGENDARY' || tier === 'ULTRA_LEGENDARY';
  const best = BEST_RARITY[tierIdx];

  const n = rnd(3, 5); // 3–5 cards; the last slot is the pack's best card
  const picks = Array.from({ length: n }, (_, i) => {
    let rarity: Rarity = best;
    if (i < n - 1) {
      // The other cards stay below the best one.
      const x = rnd(0, 9999);
      const rolled = x < 7500 ? 0 : x < 9500 ? 1 : 2;
      rarity = Math.min(rolled, Math.max(0, best - 1)) as Rarity;
    }
    const pool = CATALOG.filter((t) => t.rarity === rarity);
    const token = pool[rnd(0, pool.length - 1)];
    let w = BigInt(rnd(50, 150) * RARITY_MUL[rarity]);
    if (i === n - 1 && win) w *= 4n;
    if (i === n - 1 && tier === 'UNCOMMON') w *= 3n; // the pack's Uncommon card
    return { token, rarity, w };
  });
  const sumW = picks.reduce((s, p) => s + p.w, 0n);
  let used = 0n;
  const pulls: Pull[] = picks.map((p, i) => {
    const valueWei = i < n - 1 ? (total * p.w) / sumW : total - used;
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
    pricePaidWei: price.toString(),
    tier,
    multiplierBps,
    totalValueWei: total.toString(),
    seed: randHex(),
    pulls,
  };
}

// ---------- mock bank (IR-4): MON deposited once, packs paid from it with no wallet popup ----------
let bankWei = 0n;
export const getMockBank = () => bankWei;
export function mockBankAdd(wei: bigint): void {
  bankWei += wei;
  emit();
}
export function mockBankTake(wei: bigint): void {
  if (wei > bankWei) throw new Error('InsufficientBank: not enough MON in your bank');
  bankWei -= wei;
  emit();
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
