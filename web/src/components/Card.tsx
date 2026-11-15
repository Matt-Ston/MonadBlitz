'use client';
import { motion } from 'framer-motion';
import type { Pull, TokenInfo } from '@/lib/sdk';
import { formatMon } from '@/lib/sdk';
import {
  MYTHIC, RARITY_FRAME, RARITY_GLOW, RARITY_LABEL, RARITY_TEXT, ULTRA,
  formatCoin, formatUsd, usdFor, type DisplayRarity,
} from '@/lib/ui';
import { TokenBadge } from './TokenBadge';

/** Charge-up shake: builds from a tremble (Legendary) to a violent rattle (Ultra Legendary). */
function chargeShake(r: DisplayRarity) {
  if (r === ULTRA) {
    return {
      animate: { scale: [1, 1.06, 1.1, 1.14], x: [0, -10, 12, -14, 14, -12, 10, 0], rotate: [0, -6, 7, -8, 8, -6, 5, 0] },
      transition: { duration: 0.32, repeat: Infinity, repeatType: 'mirror' as const },
    };
  }
  if (r === MYTHIC) {
    return {
      animate: { scale: [1, 1.05, 1.09], x: [0, -6, 6, -8, 8, -5, 0], rotate: [0, -3, 3, -4, 4, 0] },
      transition: { duration: 0.4, repeat: Infinity, repeatType: 'mirror' as const },
    };
  }
  return {
    animate: { scale: [1, 1.05, 1.02, 1.07], x: [0, -2, 2, -3, 3, -2, 2, 0] },
    transition: { duration: 0.5, repeat: Infinity, repeatType: 'mirror' as const },
  };
}

export function Card({
  pull, token, flipped, rarity, charging = false, big = false,
}: {
  pull: Pull;
  token?: TokenInfo;
  flipped: boolean;
  /** Display rarity (adds Mythic / Ultra Legendary); defaults to the on-chain rarity. */
  rarity?: DisplayRarity;
  /** Card is about to flip and is rare: glow and shake on its back. */
  charging?: boolean;
  /** Spotlight size: bigger badge and text. */
  big?: boolean;
}) {
  const r = rarity ?? pull.rarity;
  const usd = usdFor(token, pull.amount);
  const coin = formatCoin(pull.symbol, pull.amount);
  const glows = RARITY_GLOW[r];
  const glow = glows[0];
  const epic = r >= MYTHIC;
  const shake = chargeShake(r);

  return (
    <div className="perspective aspect-[3/4] w-full">
      <motion.div
        className="preserve-3d relative h-full w-full"
        // Face-up cards mount already flipped (no flip replay); face-down ones must start from rest so a
        // card that mounts already charging actually runs its shake instead of snapping to the last keyframe.
        initial={flipped ? false : { rotateY: 0, scale: 1, x: 0, rotate: 0 }}
        animate={
          flipped
            ? { rotateY: 180, scale: r >= 3 ? [1, epic ? 1.18 : 1.08, 1] : 1, x: 0, rotate: 0 }
            : charging
              ? { rotateY: 0, ...shake.animate }
              : { rotateY: 0, scale: 1, x: 0, rotate: 0 }
        }
        transition={flipped ? { duration: epic ? 0.9 : 0.5, ease: 'easeOut' } : charging ? shake.transition : { duration: 0.3 }}
      >
        {/* back: glows in the coming rarity's colour(s) while charging */}
        <motion.div
          className="backface-hidden card-back absolute inset-0 rounded-2xl border-2 border-white/10 shadow-lg"
          animate={
            charging
              ? {
                  boxShadow: glows.slice(0, 4).map((c, i) => `0 0 ${epic ? 40 + i * 15 : 20 + i * 12}px ${c}`),
                  borderColor: glows.slice(0, 4),
                }
              : { boxShadow: '0 0 0px rgba(0,0,0,0)' }
          }
          transition={charging ? { duration: r === ULTRA ? 0.8 : 0.6, repeat: Infinity, repeatType: 'mirror' } : { duration: 0.2 }}
        />

        {/* front */}
        <div
          className={`backface-hidden rotate-y-180 absolute inset-0 flex flex-col items-center justify-between overflow-hidden rounded-2xl border-2 bg-gradient-to-b p-2 sm:p-3 ${RARITY_FRAME[r]}`}
        >
          {epic && <div className={`pointer-events-none absolute inset-[-50%] ${r === ULTRA ? 'rays-ultra' : 'rays-mythic'}`} />}
          {r >= 3 && (
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          )}
          <span
            className={`relative text-center font-semibold uppercase leading-none tracking-widest ${RARITY_TEXT[r]} ${
              epic ? 'text-[9px] font-black sm:text-[11px]' : 'text-[10px]'
            }`}
          >
            {RARITY_LABEL[r]}
          </span>
          <div className="relative">
            <TokenBadge symbol={pull.symbol} color={token?.color ?? '#555'} size={big ? 92 : 52} />
          </div>
          <div className="relative w-full text-center leading-tight">
            <div className={`break-all font-black tabular-nums ${big ? 'text-lg' : 'text-[11px] sm:text-xs'}`}>{coin}</div>
            {usd !== undefined && (
              <div className={`font-semibold text-emerald-300/90 ${big ? 'text-sm' : 'text-[10px]'}`}>{formatUsd(usd)}</div>
            )}
            <div className="mt-0.5 text-[10px] text-white/50 sm:text-[11px]">{formatMon(pull.valueWei)} MON</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
