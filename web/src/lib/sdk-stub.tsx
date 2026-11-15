'use client';
/**
 * Local stand-in for @coinpack/sdk (ARCHITECTURE §3.9), used until Person 4's sdk lands.
 * Same exported names and signatures; always behaves like mock mode.
 * Delete this file (or just stop importing it) once src/lib/sdk.ts points at '@coinpack/sdk'.
 */
import React, { useCallback, useState, useSyncExternalStore } from 'react';

// ---------- §3.7 types (verbatim) ----------
export type Hex = `0x${string}`;
export type Rarity = 0 | 1 | 2 | 3;
export const RARITY_NAMES = ['Common', 'Rare', 'Epic', 'Legendary'] as const;
export type Tier = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'ULTRA_LEGENDARY';
export const TIERS: Tier[] = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'ULTRA_LEGENDARY'];

export interface TokenInfo {
  index: number; address: Hex; symbol: string; name: string; decimals: 18;
  rarity: Rarity; color: string;
  priceWei: string;
  priceUsd?: number;
}
export interface Pull { slot: number; token: Hex; symbol: string; rarity: Rarity; amount: string; valueWei: string; }
export interface PackResult {
  requestId: string; buyer: Hex; txHash: Hex; openedAt: number;
  pricePaidWei: string; tier: Tier; multiplierBps: number; totalValueWei: string; seed: Hex;
  pulls: Pull[];
}
export interface Holding { token: Hex; symbol: string; rarity: Rarity; balance: string; valueWei: string; }
export interface OddsRow { tier: Tier; probabilityBps: number; minMultBps: number; maxMultBps: number; meanMultBps: number; }
export interface Odds { rows: OddsRow[]; expectedValueBps: number; withinFivePctBps: number; packPriceWei: string; }
export interface FeedItem { requestId: string; buyer: Hex; tier: Tier; multiplierBps: number; totalValueWei: string; openedAt: number; }

// ---------- constants ----------
export const MOCK = true; // the stub is always mock
const E18 = 10n ** 18n;
const PACK_PRICE = 100000000000000000n; // 0.1 MON
const MOCK_ADDRESS: Hex = '0x1111111111111111111111111111111111111111';

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
const CATALOG: TokenInfo[] = CATALOG_SRC.map(([symbol, name, rarity, usd, color], index) => ({
  index, address: MOCK_ADDRS[index], symbol, name, decimals: 18, rarity, color,
  // priceWei = usd / 0.05 * 1e18
  priceWei: ((BigInt(Math.round(usd * 1e6)) * 20n * E18) / 1_000_000n).toString(),
  priceUsd: usd,
}));

const ODDS: Odds = {
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

// §3.10 core fixture, used to seed the mock collection
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

// ---------- tiny in-memory store (holdings + feed) ----------
const balances = new Map<string, bigint>();
for (const p of FIXTURE_CORE_PULLS) balances.set(p.token, (balances.get(p.token) ?? 0n) + BigInt(p.amount));
const now = () => Math.floor(Date.now() / 1000);
let feed: FeedItem[] = [
  { requestId: '41', buyer: '0x2222222222222222222222222222222222222222', tier: 'EPIC', multiplierBps: 17250, totalValueWei: '172500000000000000', openedAt: now() - 40 },
  { requestId: '40', buyer: '0x3333333333333333333333333333333333333333', tier: 'UNCOMMON', multiplierBps: 9930, totalValueWei: '99300000000000000', openedAt: now() - 95 },
  { requestId: '39', buyer: '0x4444444444444444444444444444444444444444', tier: 'COMMON', multiplierBps: 4300, totalValueWei: '43000000000000000', openedAt: now() - 160 },
  { requestId: '38', buyer: '0x5555555555555555555555555555555555555555', tier: 'LEGENDARY', multiplierBps: 31200, totalValueWei: '312000000000000000', openedAt: now() - 300 },
];
let nextId = 42;
let version = 0;
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const getVersion = () => version;
const emit = () => { version++; listeners.forEach((l) => l()); };
const useStore = () => useSyncExternalStore(subscribe, getVersion, getVersion);

// ---------- mock draw (follows §3.3 shape with Math.random) ----------
const rnd = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const randHex = (): Hex => `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
const RARITY_MUL = [4, 12, 60, 250];

function makeMockResult(): PackResult {
  // Demo mix (more wins than the real 45/30/16/6/2.5/0.5 so every tier shows up in a demo); ranges are IR-2's.
  const roll = Math.random() * 100;
  const tierIdx = roll < 30 ? 0 : roll < 58 ? 1 : roll < 78 ? 2 : roll < 90 ? 3 : roll < 97 ? 4 : 5;
  const tier: Tier = ODDS.rows[tierIdx].tier;
  const multiplierBps = rnd(ODDS.rows[tierIdx].minMultBps, ODDS.rows[tierIdx].maxMultBps);
  const total = (PACK_PRICE * BigInt(multiplierBps)) / 10000n;
  const win = tier === 'LEGENDARY' || tier === 'ULTRA_LEGENDARY';

  const picks = Array.from({ length: 10 }, (_, i) => {
    const x = rnd(0, 9999);
    let rarity: Rarity = x < 7500 ? 0 : x < 9500 ? 1 : x < 9950 ? 2 : 3;
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
      slot: i, token: p.token.address, symbol: p.token.symbol, rarity: p.rarity,
      amount: ((valueWei * E18) / BigInt(p.token.priceWei)).toString(), valueWei: valueWei.toString(),
    };
  });

  return {
    requestId: String(nextId++), buyer: MOCK_ADDRESS, txHash: randHex(), openedAt: now(),
    pricePaidWei: PACK_PRICE.toString(), tier, multiplierBps, totalValueWei: total.toString(), seed: randHex(), pulls,
  };
}

// ---------- §3.9 API ----------
export function CoinPackProvider(props: { children: React.ReactNode }): JSX.Element {
  return <>{props.children}</>;
}

export function ConnectButton(): JSX.Element {
  return (
    <button className="rounded-full border border-line bg-panel px-4 py-2 text-sm font-medium text-white/90">
      {MOCK_ADDRESS.slice(0, 6)}…{MOCK_ADDRESS.slice(-4)} <span className="ml-1 text-xs text-accent">mock</span>
    </button>
  );
}

export function useConnection(): { address?: Hex; isConnected: boolean; isWrongChain: boolean; switchChain(): Promise<void> } {
  return { address: MOCK_ADDRESS, isConnected: true, isWrongChain: false, switchChain: async () => {} };
}

export function usePackPrice(): { priceWei?: bigint } {
  return { priceWei: PACK_PRICE };
}

export function useCatalog(): { data?: TokenInfo[] } {
  return { data: CATALOG };
}

export function useOdds(): { data: Odds } {
  return { data: ODDS };
}

export function useOpenPack(): {
  open(): Promise<PackResult>;
  status: 'idle' | 'signing' | 'mining' | 'done' | 'error';
  error?: Error;
  last?: PackResult;
} {
  const [status, setStatus] = useState<'idle' | 'signing' | 'mining' | 'done' | 'error'>('idle');
  const [error, setError] = useState<Error>();
  const [last, setLast] = useState<PackResult>();
  const open = useCallback(async () => {
    setError(undefined);
    setStatus('signing');
    await new Promise((r) => setTimeout(r, 300));
    setStatus('mining');
    await new Promise((r) => setTimeout(r, 1200));
    const res = makeMockResult();
    for (const p of res.pulls) balances.set(p.token, (balances.get(p.token) ?? 0n) + BigInt(p.amount));
    feed = [
      { requestId: res.requestId, buyer: res.buyer, tier: res.tier, multiplierBps: res.multiplierBps, totalValueWei: res.totalValueWei, openedAt: res.openedAt },
      ...feed,
    ].slice(0, 20);
    emit();
    setLast(res);
    setStatus('done');
    return res;
  }, []);
  return { open, status, error, last };
}

export function useHoldings(address?: Hex): { data?: Holding[]; refetch(): void } {
  useStore();
  if (!address) return { data: undefined, refetch: () => {} };
  const data: Holding[] = CATALOG.filter((t) => (balances.get(t.address) ?? 0n) > 0n).map((t) => {
    const balance = balances.get(t.address)!;
    return { token: t.address, symbol: t.symbol, rarity: t.rarity, balance: balance.toString(), valueWei: ((balance * BigInt(t.priceWei)) / E18).toString() };
  });
  return { data, refetch: emit };
}

export function useRecentFeed(): { data?: FeedItem[] } {
  useStore();
  return { data: feed };
}

// ---------- helpers ----------
export function formatMon(wei: string | bigint, dp = 4): string {
  const v = BigInt(wei);
  const neg = v < 0n;
  const abs = neg ? -v : v;
  const scale = 10n ** BigInt(dp);
  const rounded = (abs * scale + E18 / 2n) / E18;
  const whole = rounded / scale;
  const frac = (rounded % scale).toString().padStart(dp, '0');
  return `${neg ? '-' : ''}${whole}${dp > 0 ? '.' + frac : ''}`;
}

export function pctChange(paidWei: string, gotWei: string): number {
  const paid = BigInt(paidWei);
  if (paid === 0n) return 0;
  return Number(((BigInt(gotWei) - paid) * 100000n) / paid) / 1000;
}

export function sortPullsForReveal(pulls: Pull[]): Pull[] {
  return [...pulls].sort((a, b) => {
    const d = BigInt(a.valueWei) - BigInt(b.valueWei);
    return d < 0n ? -1 : d > 0n ? 1 : 0;
  });
}
