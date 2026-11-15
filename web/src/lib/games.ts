import type { Odds, Tier } from '@/lib/sdk';
import { TIER_INFO } from '@/lib/ui';

/**
 * COSMETIC ONLY. The slot reels and the wheel are a different skin over the exact same on-chain draw as the
 * pack (useOpenPack → openPack → PackOpened). Symbols / the wheel segment are picked from `result.tier` AFTER the
 * draw has happened. They are never random on their own and never decide the payout: the payout is always
 * result.totalValueWei / result.pulls from the chain. Don't "optimise" this into independent randomness.
 */
export function reelSymbolsForTier(tier: Tier): [string, string, string] {
  switch (tier) {
    case 'ULTRA_LEGENDARY': return ['👑', '👑', '👑'];
    case 'LEGENDARY': return ['7️⃣', '7️⃣', '7️⃣'];
    case 'EPIC': return ['💎', '💎', '💎'];
    case 'RARE': return ['⭐', '⭐', '🍀'];
    case 'UNCOMMON': return ['🪙', '🔔', '🪙'];
    case 'COMMON': return ['🪙', '💀', '🍀'];
  }
}

/** Filler symbols that scroll past while the tx is pending (decoration only). */
export const REEL_FILLER = ['🪙', '💎', '7️⃣', '👑', '💀', '🍀', '⭐', '🔔'];

export interface WheelSegment { tier: Tier; label: string; startDeg: number; endDeg: number; color: string }


/** Segment sizes come from the live odds, never hardcoded: the wheel is as honest as the odds page. */
export function buildWheelSegments(odds: Odds): WheelSegment[] {
  let deg = 0;
  return odds.rows.map((r) => {
    const span = (r.probabilityBps / 10000) * 360;
    const seg = { tier: r.tier, label: TIER_INFO[r.tier].short, startDeg: deg, endDeg: deg + span, color: TIER_INFO[r.tier].glow };
    deg += span;
    return seg;
  });
}

/** Tier confetti, same look as the pack reveal. */
export async function celebrateTier(tier: Tier) {
  if (tier === 'COMMON' || tier === 'UNCOMMON' || tier === 'RARE') return;
  const confetti = (await import('canvas-confetti')).default;
  if (tier === 'EPIC') {
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: ['#d946ef', '#c084fc', '#ffffff'] });
    return;
  }
  if (tier === 'LEGENDARY') {
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
