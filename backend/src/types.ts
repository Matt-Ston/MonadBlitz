// Pasted from ARCHITECTURE §3.7 until @coinpack/sdk lands; then switch to `import ... from '@coinpack/sdk'`.
export type Hex = `0x${string}`;
export type Rarity = 0 | 1 | 2 | 3;
export type Tier = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'ULTRA_LEGENDARY'; // enum index 0..5 (IR-2)
export const TIERS: Tier[] = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'ULTRA_LEGENDARY'];

export interface TokenInfo {
  index: number; address: Hex; symbol: string; name: string; decimals: 18;
  rarity: Rarity; color: string;
  priceWei: string;     // MON wei per whole token
  priceUsd?: number;    // only when the backend is up
}

export interface OddsRow { tier: Tier; probabilityBps: number; minMultBps: number; maxMultBps: number; meanMultBps: number; }
export interface Odds { rows: OddsRow[]; expectedValueBps: number; withinFivePctBps: number; packPriceWei: string; }

export interface FeedItem { requestId: string; buyer: Hex; tier: Tier; multiplierBps: number; totalValueWei: string; openedAt: number; }
