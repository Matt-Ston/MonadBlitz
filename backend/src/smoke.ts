// `pnpm smoke [baseUrl]`: checks a running backend against the §3.8 contract. Exit code 1 on any failure.
export {};
const base = (process.argv[2] || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');

let failures = 0;
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures++;
}
const isDecimal = (s: unknown) => typeof s === 'string' && /^\d+$/.test(s);
const isAddr = (s: unknown) => typeof s === 'string' && /^0x[0-9a-f]{40}$/.test(s);

async function get(path: string): Promise<any> {
  const res = await fetch(base + path, { headers: { Origin: 'http://localhost:3000' }, signal: AbortSignal.timeout(5000) });
  check(`${path} HTTP 200`, res.ok, String(res.status));
  check(`${path} CORS`, !!res.headers.get('access-control-allow-origin'));
  return res.json();
}

try {
  const health = await get('/api/health');
  check('health.ok', health.ok === true);
  check('health.pricesUpdatedAt > 0', health.pricesUpdatedAt > 0, health.pricesUpdatedAt > 0 ? '' : 'CoinGecko not fetched yet?');

  const catalog = await get('/api/catalog');
  check('catalog has 12 tokens', Array.isArray(catalog) && catalog.length === 12);
  check('catalog in §3.4 order', catalog.every((t: any, i: number) => t.index === i));
  check('catalog addresses lowercase 0x', catalog.every((t: any) => isAddr(t.address)));
  check('catalog priceWei decimal strings > 0', catalog.every((t: any) => isDecimal(t.priceWei) && t.priceWei !== '0'));
  check('catalog priceUsd numbers', catalog.every((t: any) => typeof t.priceUsd === 'number'));

  const odds = await get('/api/odds');
  check('odds has 4 tiers', odds.rows?.length === 4);
  check('odds probabilities sum to 10000', odds.rows?.reduce((s: number, r: any) => s + r.probabilityBps, 0) === 10000);
  check('odds packPriceWei decimal', isDecimal(odds.packPriceWei));

  const feed = await get('/api/feed/recent?limit=5');
  check('feed is an array (≤5)', Array.isArray(feed) && feed.length <= 5, `${feed.length} items`);
  check('feed newest first', feed.every((f: any, i: number) => i === 0 || BigInt(feed[i - 1].requestId) > BigInt(f.requestId)));
} catch (err) {
  check(`backend reachable at ${base}`, false, (err as Error).message);
}

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
