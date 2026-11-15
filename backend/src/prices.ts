import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  env, getDeployment, isLive, monadTestnet, tokenAddress,
  MON_COINGECKO_ID, SNAPSHOT, SNAPSHOT_MON_USD,
} from './config.js';
import type { Hex, Rarity, TokenInfo } from './types.js';

const PRICE_LOOP_MS = 60_000;
const oracleAbi = parseAbi(['function setPrices(address[] tokens, uint256[] pricesWei) external']);

// Live state; falls back to the §3.4 snapshot until the first successful fetch.
let usd: number[] = SNAPSHOT.map((t) => t.usd);
let monUsd = SNAPSHOT_MON_USD;
let updatedAt = 0;

export const pricesUpdatedAt = () => updatedAt;

/** MON wei per 1 whole token = usd / monUsd * 1e18, in integer math. */
export function toPriceWei(tokenUsd: number, monUsdPrice: number): bigint {
  const SCALE = 1e8;
  return (BigInt(Math.round(tokenUsd * SCALE)) * 10n ** 18n) / BigInt(Math.round(monUsdPrice * SCALE));
}

export function getCatalog(): TokenInfo[] {
  const dep = getDeployment();
  return SNAPSHOT.map((t, i) => ({
    index: i,
    address: tokenAddress(dep, i),
    symbol: t.symbol,
    name: t.name,
    decimals: 18,
    rarity: t.rarity as Rarity,
    color: t.color,
    priceWei: toPriceWei(usd[i], monUsd).toString(),
    priceUsd: usd[i],
  }));
}

async function fetchCoinGecko(): Promise<void> {
  const ids = [...new Set([...SNAPSHOT.map((t) => t.coingeckoId), MON_COINGECKO_ID])].join(',');
  const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
  const body = (await res.json()) as Record<string, { usd?: number }>;

  const liveMon = body[MON_COINGECKO_ID]?.usd;
  monUsd = liveMon && liveMon > 0 ? liveMon : env.monUsdFallback;
  // Keep the previous value for any coin CoinGecko didn't return.
  usd = SNAPSHOT.map((t, i) => {
    const p = body[t.coingeckoId]?.usd;
    return p && p > 0 ? p : usd[i];
  });
  updatedAt = Math.floor(Date.now() / 1000);
}

async function pushToOracle(): Promise<void> {
  const dep = getDeployment();
  if (!isLive(dep) || !env.updaterKey) return;

  const account = privateKeyToAccount(env.updaterKey);
  const wallet = createWalletClient({ account, chain: monadTestnet, transport: http(env.rpcUrl) });
  const client = createPublicClient({ chain: monadTestnet, transport: http(env.rpcUrl) });

  const catalog = getCatalog();
  const hash = await wallet.writeContract({
    address: dep.priceOracle,
    abi: oracleAbi,
    functionName: 'setPrices',
    args: [catalog.map((t) => t.address as Hex), catalog.map((t) => BigInt(t.priceWei))],
  });
  const receipt = await client.waitForTransactionReceipt({ hash, timeout: 30_000 });
  console.log(`[prices] setPrices ${receipt.status} ${hash}`);
}

let running = false;
async function tick() {
  if (running) return;
  running = true;
  try {
    await fetchCoinGecko();
    console.log(`[prices] updated; MON $${monUsd}, BTC $${usd[9]}`);
    await pushToOracle();
  } catch (err) {
    console.warn('[prices]', (err as Error).message);
  } finally {
    running = false;
  }
}

export function startPriceLoop() {
  if (!env.updaterKey) console.log('[prices] UPDATER_PRIVATE_KEY not set; serving prices without pushing to the oracle');
  void tick();
  setInterval(tick, PRICE_LOOP_MS);
}
