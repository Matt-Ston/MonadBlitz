// ARCHITECTURE.md §3.7, verbatim.

export type Hex = `0x${string}`;
export type Rarity = 0 | 1 | 2 | 3;
export const RARITY_NAMES = ['Common', 'Rare', 'Epic', 'Legendary'] as const;
export type Tier = 'BIG_LOSS' | 'CORE' | 'BIG_WIN' | 'JACKPOT'; // enum index 0..3
export const TIERS: Tier[] = ['BIG_LOSS', 'CORE', 'BIG_WIN', 'JACKPOT'];

export interface TokenInfo {
  index: number;
  address: Hex;
  symbol: string;
  name: string;
  decimals: 18;
  rarity: Rarity;
  color: string;
  priceWei: string; // MON wei per whole token
  priceUsd?: number; // only when the backend is up
}

export interface Pull {
  slot: number;
  token: Hex;
  symbol: string;
  rarity: Rarity;
  amount: string;
  valueWei: string;
}

export interface PackResult {
  requestId: string;
  buyer: Hex;
  txHash: Hex;
  openedAt: number;
  pricePaidWei: string;
  tier: Tier;
  multiplierBps: number;
  totalValueWei: string;
  seed: Hex;
  pulls: Pull[]; // length 10, contract slot order
}

export interface Holding {
  token: Hex;
  symbol: string;
  rarity: Rarity;
  balance: string;
  valueWei: string;
}

export interface OddsRow {
  tier: Tier;
  probabilityBps: number;
  minMultBps: number;
  maxMultBps: number;
  meanMultBps: number;
}

export interface Odds {
  rows: OddsRow[];
  expectedValueBps: number;
  withinFivePctBps: number;
  packPriceWei: string;
}

export interface FeedItem {
  requestId: string;
  buyer: Hex;
  tier: Tier;
  multiplierBps: number;
  totalValueWei: string;
  openedAt: number;
}
