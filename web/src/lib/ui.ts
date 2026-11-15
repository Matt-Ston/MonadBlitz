import type { Pull, Rarity, Tier, TokenInfo } from './sdk';

/**
 * Display rarity: the on-chain 0–3 plus two display-only tiers. The contract forces slot 9 to Legendary on
 * LEGENDARY / ULTRA_LEGENDARY packs (IR-2); we show that card as Mythic (1 in 40 packs) or Ultra Legendary (1 in 200).
 */
export type DisplayRarity = Rarity | 4 | 5;
export const MYTHIC = 4;
export const ULTRA = 5;

export function displayRarity(pull: Pull, tier: Tier): DisplayRarity {
  if (pull.rarity === 3 && pull.slot === 9) {
    if (tier === 'ULTRA_LEGENDARY') return ULTRA;
    if (tier === 'LEGENDARY') return MYTHIC;
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
 * Real coin units: "0.00000005263 BTC". Up to 4 significant digits, never scientific notation,
 * no sub-unit names. Ticker = symbol without the mock "m" prefix. Display only.
 */
export function formatCoin(symbol: string, amountWei: string): string {
  const n = Number(amountWei) / 1e18;
  const ticker = symbol.replace(/^m/, '');
  if (n === 0) return `0 ${ticker}`;
  const amount = n.toLocaleString('en-US', { maximumSignificantDigits: 4, maximumFractionDigits: 20 });
  return `${amount} ${ticker}`;
}

/** Pack tiers (IR-2). `short` fits on a wheel segment; `glow` is the tier's accent colour. */
export const TIER_INFO: Record<Tier, { label: string; short: string; className: string; glow: string }> = {
  COMMON: { label: 'Common pack', short: 'Common', className: 'bg-zinc-700 text-zinc-200', glow: '#71717a' },
  UNCOMMON: { label: 'Uncommon pack', short: 'Uncommon', className: 'bg-sky-600 text-white', glow: '#0ea5e9' },
  RARE: { label: 'Rare pack!', short: 'Rare', className: 'bg-emerald-500 text-black', glow: '#10b981' },
  EPIC: { label: 'Epic pack!', short: 'Epic', className: 'bg-fuchsia-500 text-white', glow: '#d946ef' },
  LEGENDARY: {
    label: 'Legendary!', short: 'Legend',
    className: 'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 text-black', glow: '#fbbf24',
  },
  ULTRA_LEGENDARY: {
    label: 'Ultra Legendary!', short: 'Ultra',
    className: 'bg-gradient-to-r from-pink-400 via-violet-400 to-sky-400 text-black', glow: '#f472b6',
  },
};

/** Packs that end on a boosted Mythic / Ultra Legendary card and get the big celebration. */
export const isBigWin = (tier: Tier) => tier === 'LEGENDARY' || tier === 'ULTRA_LEGENDARY';

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

/** Short, friendly text for useOpenPack errors (shared by the pack, slots and wheel pages). */
export function friendlyError(e?: Error): { text: string; needsMon: boolean } | null {
  if (!e) return null;
  const msg = e.message || String(e);
  if (/reject|denied|cancel/i.test(msg)) return { text: 'Transaction cancelled in wallet.', needsMon: false };
  // Custom errors from PackVault (viem puts the error name in the message).
  if (/NotEnoughGas/.test(msg))
    return { text: 'Gas limit too low. Let your wallet estimate gas (don’t set it manually) and try again.', needsMon: false };
  if (/ZeroPrice/.test(msg)) return { text: 'A token in this pack has no price yet. Try again in a minute.', needsMon: false };
  if (/CatalogEmpty/.test(msg)) return { text: 'The pack vault isn’t set up yet. Try again shortly.', needsMon: false };
  if (/insufficient funds|insufficient balance|exceeds (the )?balance/i.test(msg))
    return {
      text: 'Not enough testnet MON. Each pack costs about 0.16 MON including gas (0.1 MON pack + gas reserve).',
      needsMon: true,
    };
  return { text: msg.split('\n')[0].slice(0, 160), needsMon: false };
}
