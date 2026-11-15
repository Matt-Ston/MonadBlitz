import { DEFAULT_PACK_PRICE_WEI, getDeployment } from './config.js';
import type { Odds, OddsRow, Tier } from './types.js';

/**
 * §3.3 tier table (IR-2: six tiers). `upperBound` is the exclusive cutoff on `r(0) % 10000`; the multiplier is
 * uniform in [min, max], so the mean is the midpoint.
 */
export const TIER_TABLE: (OddsRow & { upperBound: number })[] = [
  { tier: 'COMMON',          upperBound: 4500,   probabilityBps: 4500, minMultBps: 4000,  maxMultBps: 8000,   meanMultBps: 6000 },
  { tier: 'UNCOMMON',        upperBound: 7500,   probabilityBps: 3000, minMultBps: 8000,  maxMultBps: 10500,  meanMultBps: 9250 },
  { tier: 'RARE',            upperBound: 9100,   probabilityBps: 1600, minMultBps: 10500, maxMultBps: 14000,  meanMultBps: 12250 },
  { tier: 'EPIC',            upperBound: 9700,   probabilityBps: 600,  minMultBps: 14000, maxMultBps: 22000,  meanMultBps: 18000 },
  { tier: 'LEGENDARY',       upperBound: 9950,   probabilityBps: 250,  minMultBps: 22000, maxMultBps: 40000,  meanMultBps: 31000 },
  { tier: 'ULTRA_LEGENDARY', upperBound: 10_000, probabilityBps: 50,   minMultBps: 50000, maxMultBps: 100000, meanMultBps: 75000 },
];

/** Tiers whose slot-9 card is forced Legendary and boosted (§3.3 step 4, IR-2). */
export const BOOSTED_TIERS: Tier[] = ['LEGENDARY', 'ULTRA_LEGENDARY'];

// EV is exact from the table (0.9665x); within-±5% is from `pnpm sim 1000000`. Re-run sim if §3.3 changes.
export const EXPECTED_VALUE_BPS = Math.round(
  TIER_TABLE.reduce((ev, r) => ev + (r.probabilityBps * r.meanMultBps) / 10000, 0),
);
export const WITHIN_FIVE_PCT_BPS = 1190;

export function getOdds(): Odds {
  return {
    rows: TIER_TABLE.map(({ upperBound: _, ...row }) => row),
    expectedValueBps: EXPECTED_VALUE_BPS,
    withinFivePctBps: WITHIN_FIVE_PCT_BPS,
    packPriceWei: getDeployment()?.packPriceWei || DEFAULT_PACK_PRICE_WEI,
  };
}
