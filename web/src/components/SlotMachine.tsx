'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { PackResult } from '@/lib/sdk';
import { REEL_FILLER, celebrateTier, reelSymbolsForTier } from '@/lib/games';

const STOP_MS = [900, 1300, 1800]; // reels stop left to right
const CELL = 112; // px per symbol row

/** One reel: loops filler symbols while spinning, then shows the final symbol. */
function Reel({ spinning, symbol, offset, landing }: { spinning: boolean; symbol: string; offset: number; landing: boolean }) {
  const strip = [...REEL_FILLER.slice(offset), ...REEL_FILLER.slice(0, offset)];
  return (
    <div className="relative h-[112px] w-24 overflow-hidden rounded-xl border-2 border-amber-300/60 bg-gradient-to-b from-zinc-900 via-zinc-700 to-zinc-900 shadow-[inset_0_0_18px_rgba(0,0,0,0.9)] sm:w-28">
      {spinning ? (
        <motion.div
          className="flex flex-col"
          animate={{ y: [0, -CELL * strip.length] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
        >
          {[...strip, ...strip].map((s, i) => (
            <div key={i} className="flex h-[112px] items-center justify-center text-6xl blur-[1px]">{s}</div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          key={symbol}
          initial={landing ? { y: -CELL * 0.6 } : false}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 14 }}
          className="flex h-[112px] items-center justify-center text-6xl drop-shadow-[0_0_14px_rgba(253,224,71,0.9)]"
        >
          {symbol}
        </motion.div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50" />
    </div>
  );
}

export function SlotMachine({
  busy, result, onLanded,
}: { busy: boolean; result?: PackResult; onLanded: () => void }): JSX.Element {
  const reduced = useReducedMotion();
  const [stopped, setStopped] = useState(0); // reels settled so far
  const landedRef = useRef<string | null>(null);
  const onLandedRef = useRef(onLanded);
  onLandedRef.current = onLanded;

  // Result arrived: stop the reels in sequence, then report the landing once.
  useEffect(() => {
    if (!result || landedRef.current === result.requestId) return;
    setStopped(0);
    const stops = reduced ? [0, 0, 0] : STOP_MS;
    const timers = stops.map((ms, i) => setTimeout(() => setStopped(i + 1), ms));
    const done = setTimeout(() => {
      landedRef.current = result.requestId;
      celebrateTier(result.tier);
      onLandedRef.current();
    }, stops[2] + 250);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, [result, reduced]);

  const symbols = result ? reelSymbolsForTier(result.tier) : (['🪙', '🪙', '🪙'] as const);
  const jackpot = result?.tier === 'ULTRA_LEGENDARY' && stopped === 3;

  return (
    <motion.div
      animate={jackpot && !reduced ? { x: [0, -10, 10, -8, 8, 0] } : { x: 0 }}
      transition={{ duration: 0.6 }}
      className={`relative rounded-[2rem] border-4 p-5 shadow-[0_20px_60px_rgba(131,110,249,0.45)] transition-colors duration-500 ${
        jackpot ? 'border-amber-300' : 'border-accent/70'
      } bg-gradient-to-b from-indigo-950 via-panel to-ink`}
    >
      <div className="ultra-text mb-3 text-center text-base font-black uppercase tracking-[0.35em]">CoinPack Slots</div>
      <div className="flex gap-2 sm:gap-3">
        {symbols.map((s, i) => (
          <Reel key={i} spinning={busy || (!!result && stopped <= i)} symbol={s} offset={i * 3} landing={!!result} />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-3 top-1/2 mt-3 h-1 rounded-full bg-rose-400 shadow-[0_0_14px_3px_rgba(251,113,133,0.9)]" />
    </motion.div>
  );
}
