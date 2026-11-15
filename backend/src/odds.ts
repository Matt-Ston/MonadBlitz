import { DEFAULT_PACK_PRICE_WEI, getDeployment } from './config.js';
import type { Odds, OddsRow } from './types.js';

/** §3.3 tier table. `upperBound` is the exclusive cutoff on `r(0) % 10000`. */
export const TIER_TABLE: (OddsRow & { upperBound: number })[] = [
  { tier: 'BIG_LOSS', upperBound: 500,    probabilityBps: 500,  minMultBps: 3000,  maxMultBps: 7000,  meanMultBps: 5000 },
  { tier: 'CORE',     upperBound: 9700,   probabilityBps: 9200, minMultBps: 6200,  maxMultBps: 12900, meanMultBps: 9500 },
  { tier: 'BIG_WIN',  upperBound: 9950,   probabilityBps: 250,  minMultBps: 13000, maxMultBps: 20000, meanMultBps: 16500 },
  { tier: 'JACKPOT',  upperBound: 10_000, probabilityBps: 50,   minMultBps: 30000, maxMultBps: 50000, meanMultBps: 40000 },
];

// EV is exact from the table; within-±5% is from `pnpm sim 400000` (v3: 36.1%). Re-run sim if §3.3 changes.
export const EXPECTED_VALUE_BPS = Math.round(
  TIER_TABLE.reduce((ev, r) => ev + (r.probabilityBps * r.meanMultBps) / 10000, 0),
);
export const WITHIN_FIVE_PCT_BPS = 3610;

export function getOdds(): Odds {
  return {
    rows: TIER_TABLE.map(({ upperBound: _, ...row }) => row),
    expectedValueBps: EXPECTED_VALUE_BPS,
    withinFivePctBps: WITHIN_FIVE_PCT_BPS,
    packPriceWei: getDeployment()?.packPriceWei || DEFAULT_PACK_PRICE_WEI,
  };
}
