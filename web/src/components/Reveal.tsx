'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import type { PackResult, TokenInfo } from '@/lib/sdk';
import { formatMon, pctChange, sortPullsForReveal } from '@/lib/sdk';
import {
  EXPLORER_URL, MYTHIC, RARITY_GLOW, RARITY_LABEL, RARITY_TEXT, TIER_INFO, ULTRA,
  displayRarity, findToken, formatUsd, usdForMon, wholeUnits, type DisplayRarity,
} from '@/lib/ui';
import { Card } from './Card';
import { PackTear } from './PackTear';

// Spotlight timeline per card: enter → (charge if rare) → flip → hold → fly into the grid.
const ENTER_MS = 280;
const CHARGE_MS: Record<DisplayRarity, number> = { 0: 0, 1: 0, 2: 350, 3: 1100, 4: 1700, 5: 2600 };
const HOLD_MS: Record<DisplayRarity, number> = { 0: 450, 1: 550, 2: 800, 3: 1300, 4: 1700, 5: 2400 };

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

export function Reveal({ result, catalog, onAgain }: { result: PackResult; catalog?: TokenInfo[]; onAgain: () => void }) {
  const reduced = useReducedMotion();
  const ordered = useMemo(() => sortPullsForReveal(result.pulls), [result]);
  const rarities = useMemo(() => ordered.map((p) => displayRarity(p, result.tier)), [ordered, result.tier]);
  const best = Math.max(...rarities) as DisplayRarity;

  const [torn, setTorn] = useState(!!reduced);
  const [cur, setCur] = useState(0);            // index of the card in the spotlight
  const [flipped, setFlipped] = useState(false); // spotlight card face-up?
  const [skipped, setSkipped] = useState(false);
  const [flash, setFlash] = useState<{ id: number; color: string } | null>(null);
  const spotRef = useRef<HTMLDivElement | null>(null);
  const shake = useAnimationControls();
  const done = cur >= ordered.length;
  const r = rarities[cur];
  const charging = torn && !done && !flipped && !reduced && CHARGE_MS[r] > 0;

  // Spotlight timeline for the current card.
  useEffect(() => {
    if (!torn || done) return;
    if (!flipped) {
      const t = setTimeout(() => setFlipped(true), reduced ? 150 : ENTER_MS + CHARGE_MS[r]);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setFlipped(false); setCur((n) => n + 1); }, reduced ? 350 : HOLD_MS[r]);
    return () => clearTimeout(t);
  }, [torn, done, flipped, cur, r, reduced]);

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
    if (result.tier === 'JACKPOT' && !reduced && !skipped) {
      shake.start({ x: [0, -12, 12, -10, 10, -6, 6, 0], transition: { duration: 0.7 } });
    }
  }, [done, skipped, result.tier, shake, reduced]);

  /** Tap the spotlight: flip now, or send a flipped card on its way. */
  function advance() {
    if (done) return;
    if (!flipped) setFlipped(true);
    else { setFlipped(false); setCur((n) => n + 1); }
  }
  function revealAll() {
    setSkipped(true);
    setTorn(true);
    setFlipped(false);
    setCur(ordered.length);
  }

  // Running total of what's been revealed so far.
  const revealedCount = cur + (flipped ? 1 : 0);
  const revealedWei = ordered.slice(0, revealedCount).reduce((s, p) => s + BigInt(p.valueWei), 0n);
  const revealedUsd = usdForMon(revealedWei, catalog);
  const paidUsd = usdForMon(result.pricePaidWei, catalog);
  const pulledUsd = usdForMon(result.totalValueWei, catalog);

  const pct = pctChange(result.pricePaidWei, result.totalValueWei);
  const tier = TIER_INFO[result.tier];
  const muted = done && result.tier === 'BIG_LOSS';
  const bestPull = ordered[rarities.indexOf(best)];
  const bestUnits = wholeUnits(bestPull.symbol, bestPull.amount);

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
    <motion.div animate={shake} className="flex flex-col items-center gap-5">
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

      {/* running total */}
      <div className="flex items-baseline gap-3 rounded-full border border-line bg-panel/80 px-5 py-2 text-sm">
        <span className="text-white/50">{done ? 'Pulled' : `Card ${Math.min(cur + 1, ordered.length)} of ${ordered.length}`}</span>
        <motion.b key={revealedWei.toString()} initial={{ scale: 1.25 }} animate={{ scale: 1 }} className="text-base">
          {formatMon(revealedWei)} MON
        </motion.b>
        {revealedUsd !== undefined && <span className="text-white/60">{formatUsd(revealedUsd)}</span>}
      </div>

      <LayoutGroup>
        {/* spotlight */}
        <div className="flex h-[22rem] items-center justify-center sm:h-[24rem]">
          <AnimatePresence mode="popLayout">
            {spot && (
              <motion.div
                key={`${result.requestId}-${spot.slot}`}
                layoutId={`card-${spot.slot}`}
                ref={spotRef}
                onClick={advance}
                className="w-52 cursor-pointer sm:w-60"
                initial={reduced ? false : { opacity: 0, y: -80, scale: 0.6, rotate: -8 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                title="Tap to flip / next"
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

        {/* revealed cards collect here, lowest value first */}
        <div
          className={`grid w-full grid-cols-2 gap-2 transition sm:grid-cols-5 duration-700 sm:gap-3 ${muted ? 'opacity-60 saturate-50' : ''} ${
            done && result.tier === 'BIG_WIN' ? 'drop-shadow-[0_0_30px_rgba(16,185,129,0.45)]' : ''
          }`}
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

      {!done && (
        <div className="flex items-center gap-4 text-xs text-white/40">
          <span>Tap the card to flip faster</span>
          <button onClick={revealAll} className="rounded-full border border-white/20 px-3 py-1 text-white/70 hover:bg-white/10">
            Reveal all
          </button>
        </div>
      )}

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
              <span className="text-white/70"> · {bestUnits.count} {bestUnits.unit}</span>
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
    </motion.div>
  );
}
