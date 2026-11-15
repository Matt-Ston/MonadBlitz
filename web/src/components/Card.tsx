'use client';
import { motion } from 'framer-motion';
import type { Pull, TokenInfo } from '@/lib/sdk';
import { formatMon } from '@/lib/sdk';
import { RARITY_FRAME, RARITY_LABEL, RARITY_TEXT, formatAmount, formatUsd, usdFor } from '@/lib/ui';
import { TokenBadge } from './TokenBadge';

export function Card({ pull, token, flipped }: { pull: Pull; token?: TokenInfo; flipped: boolean }) {
  const usd = usdFor(token, pull.amount);
  const legendary = pull.rarity === 3;
  return (
    <div className="perspective aspect-[3/4] w-full">
      <motion.div
        className="preserve-3d relative h-full w-full"
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0, scale: flipped && legendary ? [1, 1.08, 1] : 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* back */}
        <div className="backface-hidden card-back absolute inset-0 rounded-2xl border-2 border-white/10 shadow-lg" />

        {/* front */}
        <div
          className={`backface-hidden rotate-y-180 absolute inset-0 flex flex-col items-center justify-between overflow-hidden rounded-2xl border-2 bg-gradient-to-b p-2 sm:p-3 ${RARITY_FRAME[pull.rarity]}`}
        >
          {legendary && (
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          )}
          <span className={`text-[10px] font-semibold uppercase tracking-widest ${RARITY_TEXT[pull.rarity]}`}>
            {RARITY_LABEL[pull.rarity]}
          </span>
          <TokenBadge symbol={pull.symbol} color={token?.color ?? '#555'} size={52} />
          <div className="w-full text-center leading-tight">
            <div className="truncate text-xs font-bold sm:text-sm">
              {formatAmount(pull.amount)} <span className="text-white/60">{pull.symbol}</span>
            </div>
            <div className="text-[11px] text-white/80 sm:text-xs">{formatMon(pull.valueWei)} MON</div>
            {usd !== undefined && <div className="text-[10px] text-white/50">{formatUsd(usd)}</div>}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
