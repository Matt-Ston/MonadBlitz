'use client';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Tier } from '@/lib/sdk';
import { isBigWin } from '@/lib/ui';

/** Foreshadow colour: Epic and up glow hot before any card is shown; everything else gets the normal violet. */
const TEAR_GLOW: Record<Tier, string> = {
  COMMON: '#836EF9',
  UNCOMMON: '#836EF9',
  RARE: '#836EF9',
  EPIC: '#d946ef',
  LEGENDARY: '#fde047',
  ULTRA_LEGENDARY: '#f472b6',
};

/** The pack rips open: it trembles, glows, the top flap tears off, then it bursts into light. */
export function PackTear({ tier, onDone, priceLabel }: { tier: Tier; onDone: () => void; priceLabel?: string }) {
  const big = isBigWin(tier);
  const color = TEAR_GLOW[tier];
  const dur = big ? 2.0 : 1.3;

  useEffect(() => {
    const t = setTimeout(onDone, dur * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative flex h-96 items-center justify-center">
      {/* whole-screen flash the instant it bursts */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-50"
        style={{ background: `radial-gradient(circle at 50% 45%, #ffffff, ${color} 40%, transparent 80%)` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.95, 0] }}
        transition={{ duration: dur + 0.35, times: [0, 0.72, 0.84, 1] }}
      />
      {/* spinning rays that swell as the pack charges */}
      <motion.div
        className="absolute h-[60rem] w-[60rem] rounded-full"
        style={{
          background: `repeating-conic-gradient(${color}cc 0deg 6deg, transparent 6deg 18deg)`,
          maskImage: 'radial-gradient(circle, black 10%, transparent 60%)',
          WebkitMaskImage: 'radial-gradient(circle, black 10%, transparent 60%)',
        }}
        initial={{ scale: 0.1, opacity: 0, rotate: 0 }}
        animate={{ scale: [0.1, 0.6, 1.2], opacity: [0, 0.9, 0], rotate: 200 }}
        transition={{ duration: dur, ease: 'easeIn' }}
      />
      {/* sparks circling the pack, faster and faster */}
      <motion.div className="absolute h-80 w-80" animate={{ rotate: 1080, scale: [1, 0.75, 1.5] }} transition={{ duration: dur, ease: 'easeIn' }}>
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full"
            style={{
              background: '#fff',
              boxShadow: `0 0 14px 4px ${color}`,
              transform: `rotate(${i * 36}deg) translateY(-9.5rem)`,
            }}
          />
        ))}
      </motion.div>
      {/* shockwaves and a spark burst when it rips */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute h-40 w-40 rounded-full border-[6px]"
          style={{ borderColor: i === 1 ? '#ffffff' : color, boxShadow: `0 0 30px ${color}` }}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: [0.2, 0.2, 5 + i * 1.5], opacity: [0, 1, 0] }}
          transition={{ duration: dur + 0.3, times: [0, 0.74 + i * 0.03, 1], ease: 'easeOut' }}
        />
      ))}
      {Array.from({ length: 30 }, (_, i) => {
        const a = (i / 30) * Math.PI * 2;
        const d = 260 + (i % 5) * 70;
        return (
          <motion.span
            key={`spark-${i}`}
            className="absolute h-2.5 w-2.5 rounded-full"
            style={{ background: i % 3 ? color : '#ffffff', boxShadow: `0 0 12px ${color}` }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ x: [0, 0, Math.cos(a) * d], y: [0, 0, Math.sin(a) * d], opacity: [0, 1, 0] }}
            transition={{ duration: dur + 0.35, times: [0, 0.76, 1], ease: 'easeOut' }}
          />
        );
      })}
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
        <div className="text-5xl font-black tabular-nums">{priceLabel ? priceLabel.replace(/\s*MON$/, '') : ''}</div>
        <div className="text-sm font-bold uppercase tracking-widest text-white/80">MON</div>
      </motion.div>
    </div>
  );
}
