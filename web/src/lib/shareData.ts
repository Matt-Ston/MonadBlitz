// Pure share-link helpers: no wallet / sdk imports, so the /pull page and the /api/pull-card image route can use them.

export type ShareRarity = 0 | 1 | 2 | 3 | 4 | 5;
export const SHARE_RARITY_LABEL = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Ultra Legendary'] as const;

export interface PullShare {
  r: ShareRarity; // best card's display rarity
  s: string; // token symbol, e.g. mBTC
  a: string; // coin amount, e.g. "0.0000123 BTC"
  c: string; // token colour, hex without '#'
  v: string; // pack value in MON
  u?: string; // pack value in USD
  m: string; // multiplier, e.g. "4.12"
  n: string; // pack number
  tx?: string; // real-mode tx hash
  d?: '1'; // demo (mock-mode) pull
}

export function shareQuery(share: PullShare): string {
  const q = new URLSearchParams();
  Object.entries(share).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
  return q.toString();
}

/** Parse untrusted query params back into a PullShare (used by the page and the image route). */
export function readShare(q: URLSearchParams | Record<string, string | string[] | undefined>): PullShare {
  const get = (k: string) => {
    const v = q instanceof URLSearchParams ? q.get(k) : q[k];
    return (Array.isArray(v) ? v[0] : v ?? '').slice(0, 80);
  };
  const r = Math.min(5, Math.max(0, Number(get('r')) || 0)) as ShareRarity;
  const hex = get('c').replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
  return {
    r,
    s: get('s').replace(/[^A-Za-z0-9]/g, '').slice(0, 10) || 'MON',
    a: get('a'),
    c: hex.length === 6 ? hex : '836EF9',
    v: get('v').replace(/[^0-9.,]/g, ''),
    u: get('u').replace(/[^0-9.,]/g, '') || undefined,
    m: get('m').replace(/[^0-9.]/g, '') || '1.00',
    n: get('n').replace(/[^0-9]/g, ''),
    tx: /^0x[0-9a-fA-F]{64}$/.test(get('tx')) ? get('tx') : undefined,
    d: get('d') === '1' ? '1' : undefined,
  };
}

export function shareText(share: PullShare): string {
  const label = SHARE_RARITY_LABEL[share.r];
  const article = /^[AEIOU]/.test(label) ? 'an' : 'a';
  return `I just pulled ${article} ${label} ${share.s.replace(/^m/, '')} on CoinPack 🦆 ${share.m}x my pack!`;
}
