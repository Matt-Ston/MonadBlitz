import type { Odds, Tier } from '@/lib/sdk';

/**
 * COSMETIC ONLY. The slot reels and the wheel are a different skin over the exact same on-chain draw as the
 * pack (useOpenPack → openPack → PackOpened). Symbols / the wheel segment are picked from `result.tier` AFTER the
 * draw has happened. They are never random on their own and never decide the payout: the payout is always
 * result.totalValueWei / result.pulls from the chain. Don't "optimise" this into independent randomness.
 */
export function reelSymbolsForTier(tier: Tier): [string, string, string] {
  switch (tier) {
    case 'JACKPOT': return ['👑', '👑', '👑'];
    case 'BIG_WIN': return ['💎', '💎', '7️⃣'];
    case 'CORE': return ['🪙', '7️⃣', '🪙'];
    case 'BIG_LOSS': return ['🪙', '💀', '🪙'];
  }
}

/** Filler symbols that scroll past while the tx is pending (decoration only). */
export const REEL_FILLER = ['🪙', '💎', '7️⃣', '👑', '💀', '🍀', '⭐', '🔔'];

export interface WheelSegment { tier: Tier; label: string; startDeg: number; endDeg: number; color: string }

const WHEEL_COLOR: Record<Tier, string> = {
  BIG_LOSS: '#52525b', CORE: '#0ea5e9', BIG_WIN: '#10b981', JACKPOT: '#fbbf24',
};

/** Segment sizes come from the live odds, never hardcoded: the wheel is as honest as the odds page. */
export function buildWheelSegments(odds: Odds): WheelSegment[] {
  let deg = 0;
  return odds.rows.map((r) => {
    const span = (r.probabilityBps / 10000) * 360;
    const seg = { tier: r.tier, label: r.tier, startDeg: deg, endDeg: deg + span, color: WHEEL_COLOR[r.tier] };
    deg += span;
    return seg;
  });
}

/** Tier confetti, same look as the pack reveal. */
export async function celebrateTier(tier: Tier) {
  if (tier !== 'BIG_WIN' && tier !== 'JACKPOT') return;
  const confetti = (await import('canvas-confetti')).default;
  if (tier === 'BIG_WIN') {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    return;
  }
  const end = Date.now() + 1800;
  const colors = ['#FCD34D', '#836EF9', '#ffffff', '#F7931A'];
  (function frame() {
    confetti({ particleCount: 8, angle: 60, spread: 70, origin: { x: 0 }, colors });
    confetti({ particleCount: 8, angle: 120, spread: 70, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 250, spread: 160, startVelocity: 45, origin: { y: 0.5 }, colors });
}
