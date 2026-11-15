'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import type { PackResult, TokenInfo } from '@/lib/sdk';
import { formatMon, pctChange, sortPullsForReveal } from '@/lib/sdk';
import {
  EXPLORER_URL, MYTHIC, RARITY_GLOW, RARITY_LABEL, RARITY_TEXT, TIER_INFO, ULTRA,
  displayRarity, findToken, formatCoin, formatUsd, usdForMon, type DisplayRarity,
} from '@/lib/ui';
import { Card } from './Card';
import { PackTear } from './PackTear';

// Manual spotlight per card: face-down → (tap) → charge if rare → face-up → (tap/swipe) → fly into the grid.
const CHARGE_MS: Record<DisplayRarity, number> = { 0: 0, 1: 0, 2: 350, 3: 1100, 4: 1700, 5: 2600 };
const SWIPE_PX = 80;
type Phase = 'down' | 'charging' | 'up';

async function celebrate(tier: PackResult['tier']) {
  if (tier === 'COMMON' || tier === 'UNCOMMON' || tier === 'RARE') return;
  const confetti = (await import('canvas-confetti')).default;
  if (tier === 'EPIC') {
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: ['#d946ef', '#c084fc', '#ffffff'] });
    return;
  }
  if (tier === 'LEGENDARY') {
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

export function Reveal({ result, catalog, onAgain }: { result: PackResult; catalog?: TokenInfo[]; onAgain: () => void }) {
  const reduced = useReducedMotion();
  const ordered = useMemo(() => sortPullsForReveal(result.pulls), [result]);
  const rarities = useMemo(() => ordered.map((p) => displayRarity(p, result.tier)), [ordered, result.tier]);
  const best = Math.max(...rarities) as DisplayRarity;

  const [torn, setTorn] = useState(!!reduced);
  const [cur, setCur] = useState(0);            // index of the card in the spotlight
  const [phase, setPhase] = useState<Phase>('down'); // spotlight card state
  const [skipped, setSkipped] = useState(false);
  const [flash, setFlash] = useState<{ id: number; color: string } | null>(null);
  const spotRef = useRef<HTMLDivElement | null>(null);
  const shake = useAnimationControls();
  const done = cur >= ordered.length;
  const r = rarities[cur];
  const flipped = phase === 'up';
  const charging = torn && !done && phase === 'charging';

  // Rare cards charge up after the tap, then flip on their own.
  useEffect(() => {
    if (phase !== 'charging') return;
    const t = setTimeout(() => setPhase('up'), CHARGE_MS[r]);
    return () => clearTimeout(t);
  }, [phase, r]);

  // Effects the moment the spotlight card flips.
  useEffect(() => {
    if (!flipped || reduced) return;
    burst(spotRef.current, r);
    if (r >= MYTHIC) {
      setFlash({ id: cur, color: RARITY_GLOW[r][0] });
      shake.start({ x: [0, -10, 10, -8, 8, -4, 4, 0], transition: { duration: 0.6 } });
    }
  }, [flipped, cur, r, reduced, shake]);

  useEffect(() => {
    if (!done) return;
    if (!skipped) celebrate(result.tier);
    if (result.tier === 'ULTRA_LEGENDARY' && !reduced && !skipped) {
      shake.start({ x: [0, -12, 12, -10, 10, -6, 6, 0], transition: { duration: 0.7 } });
    }
  }, [done, skipped, result.tier, shake, reduced]);

  /** Tap / swipe / Space / →: flip a face-down card, or send a face-up card into the grid. */
  function advance() {
    if (!torn || done || phase === 'charging') return;
    if (phase === 'down') setPhase(!reduced && CHARGE_MS[r] > 0 ? 'charging' : 'up');
    else { setPhase('down'); setCur((n) => n + 1); }
  }
  function revealAll() {
    setSkipped(true);
    setTorn(true);
    setPhase('down');
    setCur(ordered.length);
  }

  const advanceRef = useRef(advance);
  advanceRef.current = advance;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        advanceRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Running total of what's been revealed so far.
  const revealedCount = cur + (flipped ? 1 : 0);
  const revealedWei = ordered.slice(0, revealedCount).reduce((s, p) => s + BigInt(p.valueWei), 0n);
  const revealedUsd = usdForMon(revealedWei, catalog);
  const runPct = pctChange(result.pricePaidWei, revealedWei.toString());
  const paidUsd = usdForMon(result.pricePaidWei, catalog);
  const pulledUsd = usdForMon(result.totalValueWei, catalog);

  const pct = pctChange(result.pricePaidWei, result.totalValueWei);
  const tier = TIER_INFO[result.tier];
  const glowing = result.tier === 'RARE' || result.tier === 'EPIC' || result.tier === 'LEGENDARY';
  const muted = done && result.tier === 'COMMON';
  const bestPull = ordered[rarities.indexOf(best)];

  if (!torn) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div onClick={revealAll} className="cursor-pointer" title="Tap to reveal all">
          <PackTear tier={result.tier} onDone={() => setTorn(true)} />
        </div>
      </div>
    );
  }

  const spot = !done ? ordered[cur] : undefined;

  return (
    <motion.div animate={shake} className="flex flex-col items-center gap-5 pb-28">
      <AnimatePresence>
        {flash && (
          <motion.div
            key={flash.id}
            className="pointer-events-none fixed inset-0 z-50"
            style={{ background: `radial-gradient(circle at 50% 40%, #ffffff, ${flash.color}cc 35%, transparent 75%)` }}
            initial={{ opacity: 0.95 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            onAnimationComplete={() => setFlash(null)}
          />
        )}
      </AnimatePresence>

      <LayoutGroup>
        {/* spotlight */}
        <div className="flex h-[22rem] items-center justify-center sm:h-[24rem]">
          <AnimatePresence mode="popLayout">
            {spot && (
              <motion.div
                key={`${result.requestId}-${spot.slot}`}
                layoutId={`card-${spot.slot}`}
                ref={spotRef}
                onTap={advance}
                drag={flipped ? 'x' : false}
                dragSnapToOrigin
                dragElastic={0.6}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > SWIPE_PX || Math.abs(info.velocity.x) > 600) advance();
                }}
                className="w-52 cursor-pointer touch-pan-y select-none sm:w-60"
                initial={reduced ? false : { opacity: 0, y: -80, scale: 0.6, rotate: -8 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                title={flipped ? 'Swipe or tap for next' : 'Tap to flip'}
              >
                <Card
                  pull={spot}
                  token={findToken(catalog, spot.token)}
                  flipped={flipped}
                  rarity={r}
                  charging={charging}
                  big
                />
              </motion.div>
            )}
          </AnimatePresence>
          {done && (
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 12 }}
              className={`rounded-full px-6 py-2 text-2xl font-black uppercase tracking-wider ${tier.className}`}
            >
              {tier.label}
            </motion.span>
          )}
        </div>

        {!done && (
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span className="font-semibold text-white/70">
              {phase === 'down' ? 'Tap to flip' : phase === 'charging' ? 'Something rare…' : 'Swipe for next'}
            </span>
            <span className="hidden sm:inline">Space / → also work</span>
            <button onClick={revealAll} className="rounded-full border border-white/20 px-3 py-1 text-white/70 hover:bg-white/10">
              Reveal all
            </button>
          </div>
        )}
        {/* revealed cards collect here, lowest value first */}
        <div
          className={`grid w-full grid-cols-2 gap-2 transition sm:grid-cols-5 duration-700 sm:gap-3 ${muted ? 'opacity-60 saturate-50' : ''} ${
            done && glowing ? 'drop-shadow-[0_0_30px_var(--tier-glow)]' : ''
          }`}
          style={{ '--tier-glow': `${tier.glow}73` } as React.CSSProperties}
        >
          {ordered.map((p, i) =>
            i < cur ? (
              <motion.div key={`${result.requestId}-${p.slot}`} layoutId={`card-${p.slot}`} transition={{ type: 'spring', stiffness: 300, damping: 28 }}>
                <Card pull={p} token={findToken(catalog, p.token)} flipped rarity={rarities[i]} />
              </motion.div>
            ) : (
              <div key={`slot-${i}`} className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10" />
            ),
          )}
        </div>
      </LayoutGroup>


      {done && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full flex-col items-center gap-4 rounded-2xl border border-line bg-panel/80 p-5 text-center"
        >
          {best >= MYTHIC && (
            <motion.p
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 250, damping: 14 }}
              className="text-sm font-bold uppercase tracking-widest"
            >
              <span className={RARITY_TEXT[best]}>{RARITY_LABEL[best]} pull</span>
              <span className="text-white/70"> · {formatCoin(bestPull.symbol, bestPull.amount)}</span>
            </motion.p>
          )}
          <p className="text-base sm:text-lg">
            You paid <b>{formatMon(result.pricePaidWei)} MON</b>
            {paidUsd !== undefined && <span className="text-white/60"> ({formatUsd(paidUsd)})</span>}, pulled{' '}
            <b>{formatMon(result.totalValueWei)} MON</b>
            {pulledUsd !== undefined && <span className="text-white/60"> ({formatUsd(pulledUsd)})</span>}{' '}
            <span className={`font-bold ${pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {pct >= 0 ? '+' : ''}
              {pct.toFixed(1)}%
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
      {/* running total, pinned to the bottom of the screen */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/90 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-white/50 sm:text-xs">
              {done ? 'Pulled' : <>Pulled so far<span className="hidden sm:inline"> · card</span> {Math.min(revealedCount, ordered.length)}/{ordered.length}</>}
            </div>
            <motion.div key={revealedWei.toString()} initial={reduced ? false : { scale: 1.15 }} animate={{ scale: 1 }} className="origin-left whitespace-nowrap font-black sm:text-base">
              {formatMon(revealedWei)} MON
              {revealedUsd !== undefined && <span className="block text-[10px] font-semibold text-white/60 sm:ml-1 sm:inline sm:text-sm">({formatUsd(revealedUsd)})</span>}
            </motion.div>
          </div>
          <div className={`shrink-0 text-lg font-black tabular-nums sm:text-2xl ${revealedCount === 0 ? 'text-white/40' : runPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {revealedCount === 0 ? '–' : `${runPct >= 0 ? '+' : ''}${runPct.toFixed(1)}%`}
          </div>
          <div className="min-w-0 text-right">
            <div className="text-[10px] uppercase tracking-wider text-white/50 sm:text-xs">Paid</div>
            <div className="whitespace-nowrap font-black sm:text-base">
              {formatMon(result.pricePaidWei, 2)} MON
              {paidUsd !== undefined && <span className="block text-[10px] font-semibold text-white/60 sm:ml-1 sm:inline sm:text-sm">({formatUsd(paidUsd)})</span>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
