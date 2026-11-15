'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import type { Odds, PackResult } from '@/lib/sdk';
import { buildWheelSegments, celebrateTier } from '@/lib/games';
import { TIER_INFO } from '@/lib/ui';

const LAND_MS = 2200;
const EXTRA_SPINS = 5;

export function WheelSpin({
  busy, result, odds, onLanded,
}: { busy: boolean; result?: PackResult; odds: Odds; onLanded: () => void }): JSX.Element {
  const reduced = useReducedMotion();
  const segments = useMemo(() => buildWheelSegments(odds), [odds]);
  const wheel = useAnimationControls();
  const pointer = useAnimationControls();
  const angle = useRef(0); // current rotation, so each spin continues from where the last one stopped
  const landedRef = useRef<string | null>(null);
  const onLandedRef = useRef(onLanded);
  onLandedRef.current = onLanded;
  const [landedTier, setLandedTier] = useState<string | null>(null);

  const gradient = `conic-gradient(${segments.map((s) => `${s.color} ${s.startDeg}deg ${s.endDeg}deg`).join(', ')})`;

  // Pending tx: spin continuously (no deceleration yet).
  useEffect(() => {
    if (!busy || result) return;
    setLandedTier(null);
    const from = angle.current % 360;
    wheel.set({ rotate: from });
    wheel.start({ rotate: from + 360 }, { duration: 0.8, ease: 'linear', repeat: Infinity });
  }, [busy, result, wheel]);

  // Result: decelerate so the pointer (12 o'clock) stops mid-segment of the drawn tier. Cosmetic only.
  useEffect(() => {
    if (!result || landedRef.current === result.requestId) return;
    const seg = segments.find((s) => s.tier === result.tier) ?? segments[0];
    const mid = (seg.startDeg + seg.endDeg) / 2;
    const target = 360 * EXTRA_SPINS + (360 - mid);
    const ms = reduced ? 0 : LAND_MS;
    wheel.stop();
    wheel.set({ rotate: 0 });
    // Pointer "ticks": bumps that slow down toward the end, to read as ratcheting to a stop.
    if (!reduced) {
      const ticks = 14;
      const times = Array.from({ length: ticks * 2 + 1 }, (_, i) => 1 - Math.pow(1 - i / (ticks * 2), 2.2));
      pointer.start({ rotate: times.map((_, i) => (i % 2 ? -18 : 0)) }, { duration: ms / 1000, times });
    }
    wheel.start({ rotate: target }, { duration: ms / 1000, ease: [0.12, 0.8, 0.2, 1] }).then(() => {
      angle.current = target;
      landedRef.current = result.requestId;
      setLandedTier(result.tier);
      celebrateTier(result.tier);
      onLandedRef.current();
    });
  }, [result, segments, reduced, wheel, pointer]);

  return (
    <div className="relative flex flex-col items-center">
      {/* pointer at 12 o'clock */}
      <motion.div
        animate={pointer}
        style={{ originY: 0 }}
        className="z-10 -mb-3 h-0 w-0 border-x-[14px] border-t-[26px] border-x-transparent border-t-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
      />
      <motion.div
        animate={wheel}
        className="relative h-72 w-72 rounded-full border-[6px] border-white/20 shadow-[0_20px_60px_rgba(131,110,249,0.45)] sm:h-80 sm:w-80"
        style={{ background: gradient }}
      >
        {segments.map((s) => {
          const mid = (s.startDeg + s.endDeg) / 2;
          const span = s.endDeg - s.startDeg;
          return (
            <div
              key={s.tier}
              className="absolute left-1/2 top-1/2 h-1/2 w-0 origin-top"
              style={{ transform: `rotate(${mid + 180}deg)` }}
            >
              <span
                className={`absolute left-1/2 top-[62%] -translate-x-1/2 whitespace-nowrap font-black uppercase text-white drop-shadow ${
                  span < 30 ? 'text-[8px]' : 'text-xs'
                }`}
                style={{ transform: 'translateX(-50%) rotate(180deg)', writingMode: span < 30 ? 'vertical-rl' : undefined }}
              >
                {/* the 0.5% sliver is too thin for a word */}
                {span < 5 ? '★' : s.label}
              </span>
            </div>
          );
        })}
        <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white/30 bg-ink" />
      </motion.div>
      {landedTier && <span className="sr-only">Landed on {landedTier}</span>}
    </div>
  );
}
