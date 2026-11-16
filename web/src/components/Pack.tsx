'use client';
import { motion } from 'framer-motion';

/** The sealed pack. Shakes while the tx is signing / mining. */
export function Pack({ busy, priceLabel }: { busy: boolean; priceLabel: string }) {
  return (
    <motion.div
      className="pack-face relative mx-auto flex h-64 w-44 flex-col items-center justify-between overflow-hidden rounded-3xl border border-white/20 p-4 shadow-[0_20px_60px_rgba(131,110,249,0.45)] sm:h-72 sm:w-48"
      animate={
        busy
          ? {
              rotate: [0, -8, 8, -6, 6, 0], x: [0, -7, 7, -5, 5, 0], scale: [1, 1.08, 1, 1.1, 1],
              boxShadow: ['0 0 30px rgba(255,255,255,0.5)', '0 0 90px rgba(253,224,71,0.95)', '0 0 30px rgba(255,255,255,0.5)'],
            }
          : { rotate: [0, -1.5, 1.5, 0], x: 0, y: [0, -10, 0], scale: 1 }
      }
      whileHover={busy ? undefined : { scale: 1.07, rotate: -3 }}
      transition={busy ? { duration: 0.32, repeat: Infinity } : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* shine sweeping across the wrapper */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-white/45 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-4 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.35)_0_6px,transparent_6px_12px)]" />
      <div className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">CoinPack</div>
      <div className="flex flex-col items-center">
        <div className="text-5xl font-black tabular-nums">{priceLabel.replace(/\s*MON$/, '')}</div>
        <div className="text-sm font-bold uppercase tracking-widest text-white/80">MON</div>
      </div>
      <div className="h-6" />
      <div className="absolute inset-x-0 bottom-0 h-4 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.35)_0_6px,transparent_6px_12px)]" />
    </motion.div>
  );
}
