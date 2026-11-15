'use client';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Tier } from '@/lib/sdk';

/** Foreshadow colour: wins glow hot before any card is shown; everything else gets the normal violet. */
const TEAR_GLOW: Record<Tier, string> = {
  BIG_LOSS: '#836EF9',
  CORE: '#836EF9',
  BIG_WIN: '#fb7185',
  JACKPOT: '#fde047',
};

/** The pack rips open: it trembles, glows, the top flap tears off, then it bursts into light. */
export function PackTear({ tier, onDone }: { tier: Tier; onDone: () => void }) {
  const big = tier === 'BIG_WIN' || tier === 'JACKPOT';
  const color = TEAR_GLOW[tier];
  const dur = big ? 2.0 : 1.3;

  useEffect(() => {
    const t = setTimeout(onDone, dur * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative flex h-80 items-center justify-center">
      {/* light burst behind the pack */}
      <motion.div
        className="absolute h-64 w-64 rounded-full"
        style={{ background: `radial-gradient(circle, ${color}dd, ${color}55 40%, transparent 70%)` }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0.9, 1.2, big ? 5 : 3.5], opacity: [0, 0.7, 1, 0] }}
        transition={{ duration: dur, times: [0, 0.55, 0.78, 1], ease: 'easeIn' }}
      />

      <motion.div
        className="pack-face relative flex h-64 w-44 flex-col items-center justify-center overflow-visible rounded-3xl border border-white/20 sm:h-72 sm:w-48"
        animate={{
          x: big ? [0, -3, 3, -6, 6, -9, 9, -12, 12, 0] : [0, -2, 2, -4, 4, -5, 5, 0],
          rotate: big ? [0, -2, 2, -3, 3, -4, 4, 0] : [0, -1, 1, -2, 2, 0],
          scale: [1, 1, 1.06, 1.4],
          opacity: [1, 1, 1, 0],
          boxShadow: [`0 0 20px ${color}55`, `0 0 50px ${color}aa`, `0 0 90px ${color}`, `0 0 140px ${color}`],
        }}
        transition={{
          x: { duration: dur * 0.75 },
          rotate: { duration: dur * 0.75 },
          scale: { duration: dur, times: [0, 0.7, 0.82, 1] },
          opacity: { duration: dur, times: [0, 0.8, 0.88, 1] },
          boxShadow: { duration: dur * 0.85 },
        }}
      >
        {/* top flap tears away */}
        <motion.div
          className="pack-face absolute inset-x-0 top-0 h-12 rounded-t-3xl border-b-2 border-dashed border-white/50"
          animate={{ y: [0, 0, -160], x: [0, 0, 70], rotate: [0, 0, -40], opacity: [1, 1, 0] }}
          transition={{ duration: dur * 0.8, times: [0, 0.62, 1], ease: 'easeOut' }}
        >
          <div className="h-3 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.35)_0_6px,transparent_6px_12px)]" />
        </motion.div>
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">CoinPack</div>
        <div className="text-5xl font-black">10</div>
        <div className="text-xs uppercase tracking-widest text-white/70">tokens inside</div>
      </motion.div>
    </div>
  );
}
