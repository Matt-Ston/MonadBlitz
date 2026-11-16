'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { PackResult, TokenInfo } from '@/lib/sdk';
import { RARITY_GLOW, displayRarity, findToken, isUncommon } from '@/lib/ui';
import { emitFx, rectOf } from '@/lib/fx';
import { Card } from './Card';
import { ReturnStats } from './ReturnStats';

/**
 * Several packs opened at once. Every Common card is shown straight away; every Rare-or-better card
 * stays face down, glowing, for the player to flip. Each flip fires the same effects as a single pack.
 */
export function MultiReveal({ results, catalog, onAgain }: { results: PackResult[]; catalog?: TokenInfo[]; onAgain: () => void }) {
  const reduced = useReducedMotion();
  const cards = useMemo(
    () =>
      results
        .flatMap((pack) => pack.pulls.map((pull) => ({ key: `${pack.requestId}-${pull.slot}`, pull, rarity: displayRarity(pull, pack), uncommon: isUncommon(pull, pack) })))
        .sort((a, b) => a.rarity - b.rarity || (BigInt(a.pull.valueWei) < BigInt(b.pull.valueWei) ? -1 : 1)),
    [results],
  );
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  const isUp = (c: (typeof cards)[number]) => c.rarity === 0 || flipped.has(c.key);
  const hidden = cards.filter((c) => !isUp(c));
  const done = hidden.length === 0;
  const paid = results.reduce((s, r) => s + BigInt(r.pricePaidWei), 0n);
  const pulled = results.reduce((s, r) => s + BigInt(r.totalValueWei), 0n);
  const soFar = cards.filter(isUp).reduce((s, c) => s + BigInt(c.pull.valueWei), 0n);

  function flip(c: (typeof cards)[number]) {
    if (isUp(c)) return;
    setFlipped((s) => new Set(s).add(c.key));
    if (!reduced) emitFx({ type: 'pull', rarity: c.rarity, rect: rectOf(refs.current[c.key]) });
  }

  useEffect(() => {
    if (!reduced && cards.some((c) => c.uncommon)) emitFx({ type: 'pull', rarity: 0, uncommon: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (done) emitFx({ type: 'pack', won: pulled >= paid, bad: pulled * 10n < paid * 8n });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-center text-3xl font-black sm:text-4xl">
        {done ? `${results.length} packs opened` : (
          <>
            {hidden.length} rare card{hidden.length === 1 ? '' : 's'} to flip. <span className="text-accent">Tap them!</span>
          </>
        )}
      </h2>

      <div className="grid w-full grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3 md:grid-cols-6">
        {cards.map((c, i) => {
          const up = isUp(c);
          const glow = RARITY_GLOW[c.rarity][0];
          return (
            <motion.div
              key={c.key}
              ref={(el) => {
                refs.current[c.key] = el;
              }}
              onClick={() => flip(c)}
              initial={reduced ? false : { opacity: 0, y: 30, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: reduced ? 0 : i * 0.04, type: 'spring', stiffness: 300, damping: 22 }}
              className={`rounded-2xl ${up ? '' : 'cursor-pointer'}`}
              style={up ? undefined : { boxShadow: `0 0 26px 4px ${glow}` }}
              title={up ? undefined : 'Tap to flip'}
            >
              <Card pull={c.pull} token={findToken(catalog, c.pull.token)} flipped={up} rarity={c.rarity} uncommon={c.uncommon} charging={!up && !reduced} />
            </motion.div>
          );
        })}
      </div>

      {!done && (
        <button onClick={() => setFlipped(new Set(cards.map((c) => c.key)))} className="rounded-full border border-white/30 px-4 py-1.5 text-sm font-semibold text-white/80 hover:bg-white/10">
          Flip all
        </button>
      )}

      <ReturnStats paidWei={paid} pulledWei={done ? pulled : soFar} label={done ? 'Pulled' : 'Showing'} />

      {done && (
        <button onClick={onAgain} className="rounded-full bg-accent px-8 py-3 text-lg font-bold text-white transition hover:brightness-110">
          Open {results.length} more
        </button>
      )}
    </div>
  );
}
