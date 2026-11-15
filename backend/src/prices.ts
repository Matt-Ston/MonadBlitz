import { createPublicClient, createWalletClient, formatEther, http, parseAbi, type Account } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  env, getDeployment, isLive, monadTestnet, tokenAddress,
  MON_COINGECKO_ID, SNAPSHOT, SNAPSHOT_MON_USD, type Deployment,
} from './config.js';
import type { Hex, Rarity, TokenInfo } from './types.js';

const PRICE_LOOP_MS = 60_000;
// Monad charges the full gas limit (~0.015 MON per setPrices at 100 gwei), so only push real moves.
const PUSH_THRESHOLD_BPS = 100n; // 1%
const LOW_BALANCE_WEI = 50_000_000_000_000_000n; // 0.05 MON

const oracleAbi = parseAbi([
  'function setPrices(address[] tokens, uint256[] pricesWei) external',
  'function getPrice(address token) external view returns (uint256 priceWei, uint64 updatedAt)',
  'function updater() external view returns (address)',
]);

const client = createPublicClient({ chain: monadTestnet, transport: http(env.rpcUrl) });
const account: Account | undefined = env.updaterKey ? privateKeyToAccount(env.updaterKey) : undefined;

// Live CoinGecko state; falls back to the §3.4 snapshot until the first successful fetch.
let usd: number[] = SNAPSHOT.map((t) => t.usd);
let monUsd = SNAPSHOT_MON_USD;
let updatedAt = 0;
// On-chain oracle prices: what the contract actually mints at, so the catalog serves these once live.
let onchain: { oracle: Hex; prices: (bigint | undefined)[] } | undefined;
let updaterChecked: Hex | undefined;

export const pricesUpdatedAt = () => updatedAt;

/** MON wei per 1 whole token = usd / monUsd * 1e18, in integer math. */
export function toPriceWei(tokenUsd: number, monUsdPrice: number): bigint {
  const SCALE = 1e8;
  return (BigInt(Math.round(tokenUsd * SCALE)) * 10n ** 18n) / BigInt(Math.round(monUsdPrice * SCALE));
}

const livePriceWei = () => usd.map((p) => toPriceWei(p, monUsd));

export function getCatalog(): TokenInfo[] {
  const dep = getDeployment();
  const live = livePriceWei();
  const chain = isLive(dep) && onchain?.oracle === dep.priceOracle.toLowerCase() ? onchain.prices : [];
  return SNAPSHOT.map((t, i) => ({
    index: i,
    address: tokenAddress(dep, i),
    symbol: t.symbol,
    name: t.name,
    decimals: 18,
    rarity: t.rarity as Rarity,
    color: t.color,
    priceWei: (chain[i] || live[i]).toString(),
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

async function readOracle(dep: Deployment): Promise<void> {
  const oracle = dep.priceOracle.toLowerCase() as Hex;
  const results = await client.multicall({
    contracts: SNAPSHOT.map((_, i) => ({
      address: oracle, abi: oracleAbi, functionName: 'getPrice' as const, args: [tokenAddress(dep, i)] as const,
    })),
  });
  onchain = {
    oracle,
    prices: results.map((r) => (r.status === 'success' && r.result[0] > 0n ? r.result[0] : undefined)),
  };
}

/** Returns false (and logs why) if pushing would certainly fail or waste gas. */
async function canPush(dep: Deployment): Promise<boolean> {
  if (!account) return false;
  if (updaterChecked !== dep.priceOracle) {
    const updater = await client.readContract({ address: dep.priceOracle, abi: oracleAbi, functionName: 'updater' });
    if (updater.toLowerCase() !== account.address.toLowerCase()) {
      console.warn(`[prices] oracle updater is ${updater}, not ours (${account.address}); ask Person 1 to call setUpdater. Not pushing.`);
      return false;
    }
    updaterChecked = dep.priceOracle;
  }
  const balance = await client.getBalance({ address: account.address });
  if (balance < LOW_BALANCE_WEI) {
    console.warn(`[prices] updater balance ${formatEther(balance)} MON is low; fund ${account.address} from the faucet. Not pushing.`);
    return false;
  }
  return true;
}

async function pushToOracle(dep: Deployment): Promise<void> {
  const live = livePriceWei();
  const moved = live.some((p, i) => {
    const cur = onchain?.prices[i];
    if (!cur) return true;
    const diff = p > cur ? p - cur : cur - p;
    return diff * 10_000n >= cur * PUSH_THRESHOLD_BPS;
  });
  if (!moved || !(await canPush(dep))) return;

  const wallet = createWalletClient({ account: account!, chain: monadTestnet, transport: http(env.rpcUrl) });
  const hash = await wallet.writeContract({
    address: dep.priceOracle,
    abi: oracleAbi,
    functionName: 'setPrices',
    args: [SNAPSHOT.map((_, i) => tokenAddress(dep, i)), live],
  });
  const receipt = await client.waitForTransactionReceipt({ hash, timeout: 30_000 });
  console.log(`[prices] setPrices ${receipt.status} ${hash}`);
  await readOracle(dep);
}

let running = false;
async function tick() {
  if (running) return;
  running = true;
  try {
    try {
      await fetchCoinGecko();
      console.log(`[prices] CoinGecko: MON $${monUsd}, BTC $${usd[9]}`);
    } catch (err) {
      console.warn('[prices] CoinGecko failed, keeping previous prices:', (err as Error).message);
    }
    const dep = getDeployment();
    if (isLive(dep)) {
      await readOracle(dep);
      if (updatedAt) await pushToOracle(dep);
    }
  } catch (err) {
    console.warn('[prices]', (err as { shortMessage?: string }).shortMessage ?? (err as Error).message);
  } finally {
    running = false;
  }
}

export function startPriceLoop() {
  console.log(account
    ? `[prices] updater ${account.address}`
    : '[prices] UPDATER_PRIVATE_KEY not set; serving prices without pushing to the oracle');
  void tick();
  setInterval(tick, PRICE_LOOP_MS);
}
