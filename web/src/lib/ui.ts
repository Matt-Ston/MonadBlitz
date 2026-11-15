import type { Rarity, Tier, TokenInfo } from './sdk';

export const RARITY_LABEL = ['Common', 'Rare', 'Epic', 'Legendary'] as const;

export const RARITY_FRAME: Record<Rarity, string> = {
  0: 'border-zinc-400/70 from-zinc-700/60 to-zinc-900',
  1: 'border-sky-400 from-sky-800/60 to-zinc-900 shadow-[0_0_18px_rgba(56,189,248,0.25)]',
  2: 'border-fuchsia-400 from-purple-800/70 to-zinc-900 shadow-[0_0_22px_rgba(192,132,252,0.35)]',
  3: 'border-amber-300 from-amber-700/60 to-zinc-900 shadow-[0_0_28px_rgba(252,211,77,0.45)]',
};

export const RARITY_TEXT: Record<Rarity, string> = {
  0: 'text-zinc-300',
  1: 'text-sky-300',
  2: 'text-fuchsia-300',
  3: 'text-amber-300',
};

export const TIER_INFO: Record<Tier, { label: string; className: string }> = {
  BIG_LOSS: { label: 'Rough pack', className: 'bg-zinc-700 text-zinc-200' },
  CORE: { label: 'Solid pack', className: 'bg-sky-600 text-white' },
  BIG_WIN: { label: 'Big win!', className: 'bg-emerald-500 text-black' },
  JACKPOT: { label: 'JACKPOT!', className: 'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 text-black' },
};

/** Human-readable token amount from 18-decimal wei string. */
export function formatAmount(wei: string): string {
  const n = Number(wei) / 1e18;
  if (n === 0) return '0';
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return n.toLocaleString('en-US', { maximumSignificantDigits: 4 });
}

export function formatUsd(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n < 1 ? 4 : 2 });
}

/** USD value of a token amount, if the catalog has a USD price. */
export function usdFor(token: TokenInfo | undefined, amountWei: string): number | undefined {
  if (!token?.priceUsd) return undefined;
  return (Number(amountWei) / 1e18) * token.priceUsd;
}

export function findToken(catalog: TokenInfo[] | undefined, address: string): TokenInfo | undefined {
  const a = address.toLowerCase();
  return catalog?.find((t) => t.address.toLowerCase() === a);
}

/** Black or white text depending on badge colour brightness. */
export function contrastText(hex: string): string {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#000' : '#fff';
}

export const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export const FAUCET_URL = 'https://faucet.monad.xyz';
export const EXPLORER_URL = 'https://testnet.monadexplorer.com';
