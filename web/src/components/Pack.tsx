'use client';
import { motion } from 'framer-motion';

/** The sealed pack. Shakes while the tx is signing / mining. */
export function Pack({ busy, priceLabel }: { busy: boolean; priceLabel: string }) {
  return (
    <motion.div
      className="pack-face relative mx-auto flex h-64 w-44 flex-col items-center justify-between overflow-hidden rounded-3xl border border-white/20 p-4 shadow-[0_20px_60px_rgba(131,110,249,0.45)] sm:h-72 sm:w-48"
      animate={
        busy
          ? { rotate: [0, -4, 4, -3, 3, 0], x: [0, -3, 3, -2, 2, 0] }
          : { rotate: 0, x: 0, y: [0, -6, 0] }
      }
      transition={busy ? { duration: 0.45, repeat: Infinity } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="absolute inset-x-0 top-0 h-4 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.35)_0_6px,transparent_6px_12px)]" />
      <div className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">CoinPack</div>
      <div className="flex flex-col items-center">
        <div className="text-5xl font-black">3–5</div>
        <div className="text-xs uppercase tracking-widest text-white/70">tokens inside</div>
      </div>
      <div className="rounded-full bg-black/30 px-3 py-1 text-sm font-semibold">{priceLabel}</div>
      <div className="absolute inset-x-0 bottom-0 h-4 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.35)_0_6px,transparent_6px_12px)]" />
    </motion.div>
  );
}
