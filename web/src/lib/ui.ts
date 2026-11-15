import type { Pull, Rarity, Tier, TokenInfo } from './sdk';

/**
 * Display rarity: the on-chain 0–3 plus two display-only tiers. The contract forces slot 9 to Legendary on
 * BIG_WIN / JACKPOT packs; we show that card as Mythic (1 in 40 packs) or Ultra Legendary (1 in 200).
 */
export type DisplayRarity = Rarity | 4 | 5;
export const MYTHIC = 4;
export const ULTRA = 5;

export function displayRarity(pull: Pull, tier: Tier): DisplayRarity {
  if (pull.rarity === 3 && pull.slot === 9) {
    if (tier === 'JACKPOT') return ULTRA;
    if (tier === 'BIG_WIN') return MYTHIC;
  }
  return pull.rarity;
}

export const RARITY_LABEL = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Ultra Legendary'] as const;

export const RARITY_FRAME: Record<DisplayRarity, string> = {
  0: 'border-zinc-400/70 from-zinc-700/60 to-zinc-900',
  1: 'border-sky-400 from-sky-800/60 to-zinc-900 shadow-[0_0_18px_rgba(56,189,248,0.25)]',
  2: 'border-fuchsia-400 from-purple-800/70 to-zinc-900 shadow-[0_0_22px_rgba(192,132,252,0.35)]',
  3: 'border-amber-300 from-amber-700/60 to-zinc-900 shadow-[0_0_28px_rgba(252,211,77,0.45)]',
  4: 'border-rose-400 from-rose-700/70 via-red-900/60 to-zinc-900 shadow-[0_0_40px_rgba(251,113,133,0.6)]',
  5: 'ultra-frame from-violet-700/70 via-fuchsia-800/60 to-zinc-900',
};

export const RARITY_TEXT: Record<DisplayRarity, string> = {
  0: 'text-zinc-300',
  1: 'text-sky-300',
  2: 'text-fuchsia-300',
  3: 'text-amber-300',
  4: 'text-rose-300',
  5: 'ultra-text',
};

/** Glow / particle colours per display rarity (for charge-up, bursts and the flash). */
export const RARITY_GLOW: Record<DisplayRarity, string[]> = {
  0: ['#a1a1aa'],
  1: ['#38bdf8', '#7dd3fc'],
  2: ['#c084fc', '#e879f9', '#ffffff'],
  3: ['#fcd34d', '#f59e0b', '#ffffff'],
  4: ['#fb7185', '#f43f5e', '#fde68a', '#ffffff'],
  5: ['#f472b6', '#a78bfa', '#38bdf8', '#34d399', '#fde047', '#ffffff'],
};

/**
 * Whole-unit denominations: a pack is worth a fraction of a cent, far less than one whole coin, so each token
 * is shown as a whole number of a small unit (real sub-units where the chain has one). Display only;
 * on-chain amounts are unchanged. `exp` = decimals of one unit relative to one whole token.
 */
export const DENOMINATIONS: Record<string, { unit: string; exp: number }> = {
  mDOGE: { unit: 'µDOGE', exp: 6 },
  mADA: { unit: 'lovelace', exp: 6 },
  mXRP: { unit: 'drops', exp: 6 },
  mTRX: { unit: 'sun', exp: 6 },
  mLINK: { unit: 'µLINK', exp: 6 },
  mAVAX: { unit: 'µAVAX', exp: 6 },
  mDOT: { unit: 'µDOT', exp: 6 },
  mSOL: { unit: 'lamports', exp: 9 },
  mBNB: { unit: 'nBNB', exp: 9 },
  mBTC: { unit: 'msats', exp: 11 },
  mETH: { unit: 'gwei', exp: 9 },
  mMON: { unit: 'µMON', exp: 6 },
};

/** Token amount as a whole count of its display unit, e.g. { count: "2,631", unit: "µDOGE" }. */
export function wholeUnits(symbol: string, amountWei: string): { count: string; unit: string } {
  const d = DENOMINATIONS[symbol] ?? { unit: symbol, exp: 0 };
  const n = BigInt(amountWei) / 10n ** BigInt(18 - d.exp);
  return { count: n === 0n && BigInt(amountWei) > 0n ? '<1' : n.toLocaleString('en-US'), unit: d.unit };
}

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
  // Packs are worth fractions of a cent: keep 2 significant digits there instead of rounding to $0.0000.
  if (n > 0 && n < 0.01) return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumSignificantDigits: 2 });
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n < 1 ? 4 : 2 });
}

/** USD per MON, from the catalog's mMON row (only when the backend is up). */
export function monUsd(catalog: TokenInfo[] | undefined): number | undefined {
  return catalog?.find((t) => t.symbol === 'mMON')?.priceUsd;
}

/** USD value of a MON wei amount, if the MON price is known. */
export function usdForMon(wei: string | bigint, catalog: TokenInfo[] | undefined): number | undefined {
  const p = monUsd(catalog);
  return p === undefined ? undefined : (Number(BigInt(wei)) / 1e18) * p;
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
