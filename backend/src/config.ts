import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { defineChain } from 'viem';
import type { Hex, Rarity } from './types.js';

const backendDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(backendDir, '..');

// dotenv never overrides, so backend/.env wins over the root .env.
dotenv.config({ path: resolve(backendDir, '.env') });
dotenv.config({ path: resolve(repoRoot, '.env') });

export const env = {
  rpcUrl: process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz',
  port: Number(process.env.BACKEND_PORT || 4000),
  monUsdFallback: Number(process.env.MON_USD_FALLBACK || 0.05),
  updaterKey: (process.env.UPDATER_PRIVATE_KEY || '') as Hex | '',
};

export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [env.rpcUrl] } },
  blockExplorers: { default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' } },
});

export const ZERO: Hex = '0x0000000000000000000000000000000000000000';
export const DEFAULT_PACK_PRICE_WEI = '100000000000000000';

/** §3.4 token catalog, in constructor order. Snapshot USD prices assume MON = $0.05. */
export const SNAPSHOT = [
  { symbol: 'mDOGE', name: 'Mock Doge',      rarity: 0, coingeckoId: 'dogecoin',    usd: 0.2,   color: '#C2A633' },
  { symbol: 'mADA',  name: 'Mock Cardano',   rarity: 0, coingeckoId: 'cardano',     usd: 0.6,   color: '#0033AD' },
  { symbol: 'mXRP',  name: 'Mock XRP',       rarity: 0, coingeckoId: 'ripple',      usd: 2,     color: '#23292F' },
  { symbol: 'mTRX',  name: 'Mock Tron',      rarity: 0, coingeckoId: 'tron',        usd: 0.25,  color: '#EF0027' },
  { symbol: 'mLINK', name: 'Mock Chainlink', rarity: 1, coingeckoId: 'chainlink',   usd: 15,    color: '#2A5ADA' },
  { symbol: 'mAVAX', name: 'Mock Avalanche', rarity: 1, coingeckoId: 'avalanche-2', usd: 20,    color: '#E84142' },
  { symbol: 'mDOT',  name: 'Mock Polkadot',  rarity: 1, coingeckoId: 'polkadot',    usd: 4,     color: '#E6007A' },
  { symbol: 'mSOL',  name: 'Mock Solana',    rarity: 2, coingeckoId: 'solana',      usd: 150,   color: '#9945FF' },
  { symbol: 'mBNB',  name: 'Mock BNB',       rarity: 2, coingeckoId: 'binancecoin', usd: 900,   color: '#F3BA2F' },
  { symbol: 'mBTC',  name: 'Mock Bitcoin',   rarity: 3, coingeckoId: 'bitcoin',     usd: 95000, color: '#F7931A' },
  { symbol: 'mETH',  name: 'Mock Ether',     rarity: 3, coingeckoId: 'ethereum',    usd: 3200,  color: '#627EEA' },
  { symbol: 'mMON',  name: 'Mock Monad',     rarity: 3, coingeckoId: 'monad',       usd: 0.05,  color: '#836EF9' },
] as const satisfies readonly { symbol: string; name: string; rarity: Rarity; coingeckoId: string; usd: number; color: string }[];

export const SNAPSHOT_MON_USD = 0.05;
export const MON_COINGECKO_ID = 'monad';

/** Placeholder addresses until Person 1's deployment lands; same as the §3.10 fixture and web mocks (0x…a0–a8, 0x…b9–bb). */
export const placeholderAddress = (i: number): Hex => `0x${((i < 9 ? 0xa0 : 0xb0) + i).toString(16).padStart(40, '0')}`;

export interface Deployment {
  network: string;
  chainId: number;
  deployBlock: number;
  packVault: Hex;
  priceOracle: Hex;
  packPriceWei: string;
  tokens: { index: number; symbol: string; name: string; rarity: Rarity; address: Hex; coingeckoId: string; color: string }[];
}

const deploymentPath = resolve(repoRoot, 'contracts/deployments/monad-testnet.json');
let cached: { mtimeMs: number; dep: Deployment | null } | undefined;

/** Re-reads the deployment file whenever it changes on disk, so a `git pull` is picked up without a restart. */
export function getDeployment(): Deployment | null {
  if (!existsSync(deploymentPath)) return null;
  const { mtimeMs } = statSync(deploymentPath);
  if (cached?.mtimeMs === mtimeMs) return cached.dep;
  let dep: Deployment | null = null;
  try {
    dep = JSON.parse(readFileSync(deploymentPath, 'utf8'));
  } catch (err) {
    console.warn(`[config] could not parse ${deploymentPath}:`, (err as Error).message);
  }
  cached = { mtimeMs, dep };
  return dep;
}

/** True once Person 1 has written real (non-zero) contract addresses. */
export function isLive(dep: Deployment | null): dep is Deployment {
  return !!dep && dep.packVault?.toLowerCase() !== ZERO && dep.priceOracle?.toLowerCase() !== ZERO;
}

export function tokenAddress(dep: Deployment | null, i: number): Hex {
  const addr = dep?.tokens?.find((t) => t.index === i)?.address;
  return addr && /^0x[0-9a-fA-F]{40}$/.test(addr) && addr.toLowerCase() !== ZERO
    ? (addr.toLowerCase() as Hex)
    : placeholderAddress(i);
}
