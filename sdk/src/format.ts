import type { Pull } from './types';

const E18 = 10n ** 18n;

export function formatMon(wei: string | bigint, dp = 4): string {
  const v = BigInt(wei);
  const neg = v < 0n;
  const abs = neg ? -v : v;
  const scale = 10n ** BigInt(dp);
  const rounded = (abs * scale + E18 / 2n) / E18;
  const whole = rounded / scale;
  const frac = (rounded % scale).toString().padStart(dp, '0');
  return `${neg ? '-' : ''}${whole}${dp > 0 ? '.' + frac : ''}`;
}

export function pctChange(paidWei: string, gotWei: string): number {
  const paid = BigInt(paidWei);
  if (paid === 0n) return 0;
  return Number(((BigInt(gotWei) - paid) * 100000n) / paid) / 1000;
}

export function sortPullsForReveal(pulls: Pull[]): Pull[] {
  return [...pulls].sort((a, b) => {
    const d = BigInt(a.valueWei) - BigInt(b.valueWei);
    return d < 0n ? -1 : d > 0n ? 1 : 0;
  });
}
