import type { PackResult, TokenInfo } from './sdk';
import { MOCK, formatMon } from './sdk';
import { displayRarity, findToken, formatCoin, isBigWin, usdForMon } from './ui';
import type { PullShare } from './shareData';

export * from './shareData';

/**
 * Shareable pull cards. A big win becomes a link (/pull?…) whose preview image (/api/pull-card?…) shows the card,
 * so it unfurls on X, Discord, iMessage. The numbers ride in the URL: demo pulls are labelled DEMO, real ones
 * carry the tx hash so anyone can check them on the explorer.
 */

/** Worth sharing: a Legendary-or-better card, a Legendary / Ultra pack, or at least 2x the price. */
export function shareWorthy(result: PackResult): boolean {
  const best = Math.max(...result.pulls.map((p) => displayRarity(p, result)));
  return best >= 3 || isBigWin(result.tier) || result.multiplierBps >= 20000;
}

/** The most share-worthy pack of a batch (highest multiplier), if any qualifies. */
export function bestShareable(results: PackResult[]): PackResult | undefined {
  return results.filter(shareWorthy).sort((x, y) => y.multiplierBps - x.multiplierBps)[0];
}

export function pullShare(result: PackResult, catalog?: TokenInfo[]): PullShare {
  const ranked = result.pulls
    .map((p) => ({ p, r: displayRarity(p, result) }))
    .sort((x, y) => y.r - x.r || (BigInt(y.p.valueWei) > BigInt(x.p.valueWei) ? 1 : -1));
  const { p, r } = ranked[0];
  const usd = usdForMon(result.totalValueWei, catalog);
  return {
    r,
    s: p.symbol,
    a: formatCoin(p.symbol, p.amount),
    c: (findToken(catalog, p.token)?.color ?? '#836EF9').replace('#', ''),
    v: formatMon(result.totalValueWei, 4),
    u: usd !== undefined ? usd.toFixed(usd < 0.01 ? 5 : 2) : undefined,
    m: (result.multiplierBps / 10000).toFixed(2),
    n: result.requestId,
    tx: MOCK ? undefined : result.txHash,
    d: MOCK ? '1' : undefined,
  };
}

