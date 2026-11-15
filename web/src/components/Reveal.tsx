'use client';
import { useEffect, useMemo, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import type { PackResult, TokenInfo } from '@/lib/sdk';
import { formatMon, pctChange, sortPullsForReveal } from '@/lib/sdk';
import { EXPLORER_URL, TIER_INFO, findToken } from '@/lib/ui';
import { Card } from './Card';

const FLIP_MS = 350;

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

export function Reveal({ result, catalog, onAgain }: { result: PackResult; catalog?: TokenInfo[]; onAgain: () => void }) {
  const ordered = useMemo(() => sortPullsForReveal(result.pulls), [result]);
  const [shown, setShown] = useState(0);
  const done = shown >= ordered.length;
  const shake = useAnimationControls();

  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 500 : FLIP_MS);
    return () => clearTimeout(t);
  }, [shown, done]);

  useEffect(() => {
    if (!done) return;
    celebrate(result.tier);
    if (result.tier === 'JACKPOT') {
      shake.start({ x: [0, -12, 12, -10, 10, -6, 6, 0], transition: { duration: 0.7 } });
    }
  }, [done, result.tier, shake]);

  const pct = pctChange(result.pricePaidWei, result.totalValueWei);
  const tier = TIER_INFO[result.tier];
  const muted = done && result.tier === 'BIG_LOSS';

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div
        animate={shake}
        onClick={() => setShown(ordered.length)}
        className={`grid w-full cursor-pointer grid-cols-2 gap-3 transition duration-700 sm:grid-cols-5 sm:gap-4 ${
          muted ? 'opacity-60 saturate-50' : ''
        } ${done && result.tier === 'BIG_WIN' ? 'drop-shadow-[0_0_30px_rgba(16,185,129,0.45)]' : ''}`}
        title={done ? undefined : 'Tap to reveal all'}
      >
        {ordered.map((p, i) => (
          <Card key={`${result.requestId}-${p.slot}`} pull={p} token={findToken(catalog, p.token)} flipped={i < shown} />
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
