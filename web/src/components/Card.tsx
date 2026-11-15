'use client';
import { motion } from 'framer-motion';
import type { Pull, TokenInfo } from '@/lib/sdk';
import { formatMon } from '@/lib/sdk';
import {
  MYTHIC, RARITY_FRAME, RARITY_GLOW, RARITY_LABEL, RARITY_TEXT, ULTRA,
  formatUsd, usdFor, wholeUnits, type DisplayRarity,
} from '@/lib/ui';
import { TokenBadge } from './TokenBadge';

export function Card({
  pull, token, flipped, rarity, charging = false,
}: {
  pull: Pull;
  token?: TokenInfo;
  flipped: boolean;
  /** Display rarity (adds Mythic / Ultra Legendary); defaults to the on-chain rarity. */
  rarity?: DisplayRarity;
  /** Card is about to flip and is rare: glow and tremble on its back. */
  charging?: boolean;
}) {
  const r = rarity ?? pull.rarity;
  const usd = usdFor(token, pull.amount);
  const { count, unit } = wholeUnits(pull.symbol, pull.amount);
  const glow = RARITY_GLOW[r][0];
  const epic = r >= MYTHIC;

  return (
    <div className="perspective aspect-[3/4] w-full">
      <motion.div
        className="preserve-3d relative h-full w-full"
        initial={false}
        animate={
          flipped
            ? { rotateY: 180, scale: r >= 3 ? [1, epic ? 1.18 : 1.08, 1] : 1, x: 0 }
            : charging
              ? { rotateY: 0, scale: [1, 1.05, 1.02, 1.07], x: [0, -2, 2, -3, 3, -2, 2, 0] }
              : { rotateY: 0, scale: 1, x: 0 }
        }
        transition={
          flipped
            ? { duration: epic ? 0.9 : 0.5, ease: 'easeOut' }
            : charging
              ? { duration: 0.5, repeat: Infinity, repeatType: 'mirror' }
              : { duration: 0.3 }
        }
      >
        {/* back */}
        <motion.div
          className="backface-hidden card-back absolute inset-0 rounded-2xl border-2 border-white/10 shadow-lg"
          animate={
            charging
              ? { boxShadow: [`0 0 0px ${glow}`, `0 0 45px ${glow}`, `0 0 20px ${glow}`], borderColor: glow }
              : { boxShadow: '0 0 0px rgba(0,0,0,0)' }
          }
          transition={charging ? { duration: 0.6, repeat: Infinity, repeatType: 'mirror' } : { duration: 0.2 }}
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
            <TokenBadge symbol={pull.symbol} color={token?.color ?? '#555'} size={52} />
          </div>
          <div className="relative w-full text-center leading-tight">
            <div className="truncate text-sm font-black sm:text-base">{count}</div>
            {/* not uppercase: "µ" would become "Μ" and read as "M" */}
            <div className="truncate text-[11px] font-semibold text-white/60">{unit}</div>
            <div className="mt-0.5 text-[11px] text-white/80 sm:text-xs">{formatMon(pull.valueWei)} MON</div>
            {usd !== undefined && <div className="text-[10px] text-white/50">{formatUsd(usd)}</div>}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
