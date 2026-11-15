'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import type { PackResult, TokenInfo } from '@/lib/sdk';
import { formatMon, pctChange, sortPullsForReveal } from '@/lib/sdk';
import {
  EXPLORER_URL, MYTHIC, RARITY_GLOW, RARITY_LABEL, RARITY_TEXT, TIER_INFO, ULTRA,
  displayRarity, findToken, wholeUnits, type DisplayRarity,
} from '@/lib/ui';
import { Card } from './Card';
import { PackTear } from './PackTear';

const FLIP_MS = 380;      // normal flip pace
const SLOW_FLIP_MS = 650; // last three cards slow down
const CHARGE_MS: Record<DisplayRarity, number> = { 0: 0, 1: 0, 2: 0, 3: 1100, 4: 1600, 5: 2200 };

async function celebrate(tier: PackResult['tier']) {
  if (tier !== 'BIG_WIN' && tier !== 'JACKPOT') return;
  const confetti = (await import('canvas-confetti')).default;
  if (tier === 'BIG_WIN') {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    return;
  }
  const end = Date.now() + 1800;
  const colors = ['#FCD34D', '#836EF9', '#ffffff', '#F7931A'];
  (function frame() {
    confetti({ particleCount: 8, angle: 60, spread: 70, origin: { x: 0 }, colors });
    confetti({ particleCount: 8, angle: 120, spread: 70, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 250, spread: 160, startVelocity: 45, origin: { y: 0.5 }, colors });
}

/** Particle burst from a card the moment it flips (Epic and up). */
async function burst(el: HTMLElement | null, r: DisplayRarity) {
  if (!el || r < 2) return;
  const confetti = (await import('canvas-confetti')).default;
  const box = el.getBoundingClientRect();
  const origin = { x: (box.left + box.width / 2) / window.innerWidth, y: (box.top + box.height / 2) / window.innerHeight };
  const colors = RARITY_GLOW[r];
  const count = { 2: 30, 3: 60, 4: 130, 5: 220 }[r as 2 | 3 | 4 | 5];
  confetti({ particleCount: count, spread: r >= MYTHIC ? 360 : 70, startVelocity: r >= MYTHIC ? 38 : 22, scalar: 0.8, ticks: 120, origin, colors });
  if (r === ULTRA) {
    confetti({ particleCount: 80, spread: 360, startVelocity: 55, shapes: ['star'], scalar: 1.3, origin, colors });
  }
}

type Phase = 'tear' | 'deal' | 'flip';

export function Reveal({ result, catalog, onAgain }: { result: PackResult; catalog?: TokenInfo[]; onAgain: () => void }) {
  const reduced = useReducedMotion();
  const ordered = useMemo(() => sortPullsForReveal(result.pulls), [result]);
  const rarities = useMemo(() => ordered.map((p) => displayRarity(p, result.tier)), [ordered, result.tier]);
  const best = Math.max(...rarities) as DisplayRarity;

  const [phase, setPhase] = useState<Phase>(reduced ? 'flip' : 'tear');
  const [shown, setShown] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const [flash, setFlash] = useState<{ id: number; color: string } | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const done = shown >= ordered.length;
  const shake = useAnimationControls();

  // Deal: cards fly in, then flipping starts.
  useEffect(() => {
    if (phase !== 'deal') return;
    const t = setTimeout(() => setPhase('flip'), 900);
    return () => clearTimeout(t);
  }, [phase]);

  // Flip one card at a time; rare cards charge up first, the last three slow down.
  const charge = phase === 'flip' && !done && !skipped && !reduced ? CHARGE_MS[rarities[shown]] : 0;
  useEffect(() => {
    if (phase !== 'flip' || done) return;
    const wait = shown === 0 ? 250 : charge || (shown >= ordered.length - 3 ? SLOW_FLIP_MS : FLIP_MS);
    const t = setTimeout(() => setShown((n) => n + 1), wait);
    return () => clearTimeout(t);
  }, [phase, shown, done, charge, ordered.length]);

  // Effects for the card that just flipped.
  useEffect(() => {
    if (shown === 0 || skipped || reduced) return;
    const i = shown - 1;
    const r = rarities[i];
    burst(cardRefs.current[i], r);
    if (r >= MYTHIC) {
      setFlash({ id: shown, color: RARITY_GLOW[r][0] });
      shake.start({ x: [0, -10, 10, -8, 8, -4, 4, 0], transition: { duration: 0.6 } });
    }
  }, [shown, skipped, reduced, rarities, shake]);

  useEffect(() => {
    if (!done) return;
    celebrate(result.tier);
    if (result.tier === 'JACKPOT' && !reduced) {
      shake.start({ x: [0, -12, 12, -10, 10, -6, 6, 0], transition: { duration: 0.7 } });
    }
  }, [done, result.tier, shake, reduced]);

  function skip() {
    if (done) return;
    setSkipped(true);
    setPhase('flip');
    setShown(ordered.length);
  }

  const pct = pctChange(result.pricePaidWei, result.totalValueWei);
  const tier = TIER_INFO[result.tier];
  const muted = done && result.tier === 'BIG_LOSS';
  const bestPull = ordered[rarities.indexOf(best)];
  const bestUnits = wholeUnits(bestPull.symbol, bestPull.amount);

  if (phase === 'tear') {
    return (
      <div onClick={skip} className="cursor-pointer" title="Tap to reveal all">
        <PackTear tier={result.tier} onDone={() => setPhase('deal')} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <AnimatePresence>
        {flash && (
          <motion.div
            key={flash.id}
            className="pointer-events-none fixed inset-0 z-50"
            style={{ background: `radial-gradient(circle at 50% 45%, #ffffff, ${flash.color}cc 35%, transparent 75%)` }}
            initial={{ opacity: 0.95 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            onAnimationComplete={() => setFlash(null)}
          />
        )}
      </AnimatePresence>

      <motion.div
        animate={shake}
        onClick={skip}
        className={`grid w-full cursor-pointer grid-cols-2 gap-3 transition duration-700 sm:grid-cols-5 sm:gap-4 ${
          muted ? 'opacity-60 saturate-50' : ''
        } ${done && result.tier === 'BIG_WIN' ? 'drop-shadow-[0_0_30px_rgba(16,185,129,0.45)]' : ''}`}
        title={done ? undefined : 'Tap to reveal all'}
      >
        {ordered.map((p, i) => (
          <motion.div
            key={`${result.requestId}-${p.slot}`}
            ref={(el) => { cardRefs.current[i] = el; }}
            initial={reduced ? false : { opacity: 0, y: -120, scale: 0.4, rotate: (i % 2 ? 1 : -1) * 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            transition={{ delay: i * 0.06, type: 'spring', stiffness: 260, damping: 20 }}
          >
            <Card
              pull={p}
              token={findToken(catalog, p.token)}
              flipped={i < shown}
              rarity={rarities[i]}
              charging={i === shown && charge > 0}
            />
          </motion.div>
        ))}
      </motion.div>

      {!done && <p className="text-xs text-white/40">Tap the cards to reveal all</p>}

      {done && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full flex-col items-center gap-4 rounded-2xl border border-line bg-panel/80 p-5 text-center"
        >
          <motion.span
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 12 }}
            className={`rounded-full px-5 py-1.5 text-lg font-black uppercase tracking-wider ${tier.className}`}
          >
            {tier.label}
          </motion.span>
          {best >= MYTHIC && (
            <motion.p
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 250, damping: 14 }}
              className="text-sm font-bold uppercase tracking-widest"
            >
              <span className={RARITY_TEXT[best]}>{RARITY_LABEL[best]} pull</span>
              <span className="text-white/70"> · {bestUnits.count} {bestUnits.unit}</span>
            </motion.p>
          )}
          <p className="text-base sm:text-lg">
            You paid <b>{formatMon(result.pricePaidWei)} MON</b>, pulled <b>{formatMon(result.totalValueWei)} MON</b>{' '}
            <span className={`font-bold ${pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ({pct >= 0 ? '+' : ''}
              {pct.toFixed(1)}%)
            </span>
          </p>
          <p className="text-xs text-white/40">
            Pack #{result.requestId} · {(result.multiplierBps / 10000).toFixed(2)}x ·{' '}
            <a className="underline hover:text-white" href={`${EXPLORER_URL}/tx/${result.txHash}`} target="_blank" rel="noreferrer">
              view tx
            </a>
          </p>
          <button
            onClick={onAgain}
            className="rounded-full bg-accent px-6 py-2.5 font-semibold text-white transition hover:brightness-110"
          >
            Open another
          </button>
        </motion.div>
      )}
    </div>
  );
}
