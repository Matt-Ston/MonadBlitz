'use client';
import { motion } from 'framer-motion';
import { MYTHIC, RARITY_GLOW, RARITY_LABEL, RARITY_TEXT, ULTRA, type DisplayRarity } from '@/lib/ui';

/**
 * One-shot effects around the spotlight card the moment it flips, escalating with rarity:
 * Common: dust puff · Rare: shockwave + sparkles · Epic: double shockwave, spinning rays, title slam
 * Legendary: golden light pillar, coin rain · Mythic: blood-red vignette, rising embers
 * Ultra Legendary: blackout → rainbow detonation, prism rays, star burst.
 * Mount it with a fresh `key` per card; it plays once on mount. Decoration only.
 */

const SPEC: Record<DisplayRarity, { rings: number; particles: number; dist: number; size: number }> = {
  0: { rings: 0, particles: 8, dist: 90, size: 5 },
  1: { rings: 1, particles: 14, dist: 160, size: 6 },
  2: { rings: 2, particles: 20, dist: 210, size: 7 },
  3: { rings: 3, particles: 26, dist: 260, size: 8 },
  4: { rings: 3, particles: 32, dist: 300, size: 8 },
  5: { rings: 4, particles: 44, dist: 360, size: 9 },
};

// Deterministic pseudo-random so a card's effect looks the same on re-render.
const jitter = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export function RarityFX({ rarity: r }: { rarity: DisplayRarity }) {
  const spec = SPEC[r];
  const colors = RARITY_GLOW[r];
  const ultra = r === ULTRA;

  return (
    <>
      {/* full-screen mood: Mythic dims to a red vignette, Ultra blacks out then detonates */}
      {r >= MYTHIC && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[44]"
          style={{
            background: ultra
              ? 'radial-gradient(circle at 50% 40%, transparent 10%, rgba(0,0,0,0.92) 60%)'
              : 'radial-gradient(circle at 50% 40%, transparent 15%, rgba(80,0,20,0.75) 70%)',
          }}
          initial={{ opacity: ultra ? 1 : 0 }}
          animate={{ opacity: ultra ? [1, 1, 0.55, 0] : [0, 0.9, 0.6, 0] }}
          transition={{ duration: ultra ? 2.6 : 2, times: [0, 0.15, 0.5, 1], ease: 'easeOut' }}
        />
      )}

      <div className="pointer-events-none absolute left-1/2 top-1/2 z-[44] h-0 w-0">
        {/* light pillar (Legendary and up) */}
        {r >= 3 && (
          <motion.div
            className="absolute -left-16 bottom-0 h-[160vh] w-32 origin-bottom blur-md"
            style={{
              translateY: '50%',
              background: ultra
                ? 'linear-gradient(to top, transparent, #f472b6aa, #a78bfaaa, #38bdf8aa, transparent)'
                : `linear-gradient(to top, transparent, ${colors[0]}bb, transparent)`,
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: [0, 1.4, 1, 0], opacity: [0, 1, 0.8, 0] }}
            transition={{ duration: r >= MYTHIC ? 2.2 : 1.6, times: [0, 0.15, 0.6, 1], ease: 'easeOut' }}
          />
        )}

        {/* spinning ray burst (Epic and up) */}
        {r >= 2 && (
          <motion.div
            className="absolute -left-[22rem] -top-[22rem] h-[44rem] w-[44rem] rounded-full"
            style={{
              background: ultra
                ? 'repeating-conic-gradient(#f472b6 0deg 6deg, transparent 6deg 15deg, #a78bfa 15deg 21deg, transparent 21deg 30deg, #38bdf8 30deg 36deg, transparent 36deg 45deg, #fde047 45deg 51deg, transparent 51deg 60deg)'
                : `repeating-conic-gradient(${colors[0]} 0deg 7deg, transparent 7deg 22deg)`,
              maskImage: 'radial-gradient(circle, black 15%, transparent 65%)',
              WebkitMaskImage: 'radial-gradient(circle, black 15%, transparent 65%)',
            }}
            initial={{ scale: 0.2, opacity: 0, rotate: 0 }}
            animate={{ scale: [0.2, 1, 1.15], opacity: [0, 0.85, 0], rotate: ultra ? 220 : 90 }}
            transition={{ duration: ultra ? 2.4 : 1.6, ease: 'easeOut' }}
          />
        )}

        {/* shockwave rings */}
        {Array.from({ length: spec.rings }, (_, i) => (
          <motion.div
            key={`ring-${i}`}
            className="absolute -left-24 -top-24 h-48 w-48 rounded-full"
            style={{
              border: `${ultra ? 6 : 4}px solid ${ultra ? RARITY_GLOW[5][i % RARITY_GLOW[5].length] : colors[i % colors.length]}`,
              boxShadow: `0 0 30px ${colors[0]}`,
            }}
            initial={{ scale: 0.3, opacity: 0.95 }}
            animate={{ scale: 2.4 + i * 0.9, opacity: 0 }}
            transition={{ duration: 0.9 + i * 0.25, delay: (ultra ? 0.35 : 0) + i * 0.14, ease: 'easeOut' }}
          />
        ))}

        {/* particles: dust, sparkles, coins, embers or stars */}
        {Array.from({ length: spec.particles }, (_, i) => {
          const angle = (i / spec.particles) * Math.PI * 2 + jitter(i, 1) * 0.5;
          const dist = spec.dist * (0.55 + jitter(i, 2) * 0.6);
          const dx = Math.cos(angle) * dist;
          // Mythic embers float upward; Legendary coins fall; everything else bursts outward.
          const dy = r === MYTHIC ? -Math.abs(Math.sin(angle) * dist) - 120 : r === 3 ? Math.sin(angle) * dist * 0.5 + 140 : Math.sin(angle) * dist;
          const color = colors[i % colors.length];
          const s = spec.size * (0.7 + jitter(i, 3) * 0.8);
          return (
            <motion.span
              key={`p-${i}`}
              className={`absolute ${r === 3 ? 'rounded-full border border-amber-200/80' : ultra || r === 2 ? 'rotate-45' : 'rounded-full'}`}
              style={{
                width: s, height: s, left: -s / 2, top: -s / 2, background: color,
                boxShadow: r >= 1 ? `0 0 ${s * 2}px ${color}` : undefined,
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: r === 0 ? 0.6 : 1 }}
              animate={{ x: dx, y: dy, opacity: 0, scale: r === 0 ? 1.6 : ultra ? [1, 1.8, 0.4] : 0.5, rotate: ultra ? 360 : 0 }}
              transition={{ duration: (r === 0 ? 0.7 : 1.1) + jitter(i, 4) * 0.6, delay: (ultra ? 0.35 : 0) + jitter(i, 5) * 0.12, ease: 'easeOut' }}
            />
          );
        })}
      </div>

      {/* title slam (Epic and up) */}
      {r >= 2 && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 z-[47] flex justify-center"
          initial={{ scale: 3, opacity: 0, y: -10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 16, delay: ultra ? 0.35 : 0.05 }}
        >
          <span
            className={`whitespace-nowrap font-black uppercase tracking-[0.25em] drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] ${RARITY_TEXT[r]} ${
              r >= MYTHIC ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'
            }`}
          >
            {RARITY_LABEL[r]}
          </span>
        </motion.div>
      )}
    </>
  );
}
