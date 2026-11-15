'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import type { PackResult, TokenInfo } from '@/lib/sdk';
import { formatMon, pctChange, sortPullsForReveal, useCatalog, useConnection, useOpenPack, usePackPrice } from '@/lib/sdk';
import { EXPLORER_URL, FAUCET_URL, TIER_INFO, displayRarity, findToken, friendlyError } from '@/lib/ui';
import { Card } from './Card';
import { Connect } from './Connect';

/** The 10 tokens behind a spin: same pulls as a pack, shown all at once after the machine lands. */
function GameResult({ result, catalog }: { result: PackResult; catalog?: TokenInfo[] }) {
  const pct = pctChange(result.pricePaidWei, result.totalValueWei);
  const tier = TIER_INFO[result.tier];
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex w-full flex-col items-center gap-4">
      <span className={`rounded-full px-6 py-2 text-xl font-black uppercase tracking-wider ${tier.className}`}>{tier.label}</span>
      <p className="text-center text-base sm:text-lg">
        Paid <b>{formatMon(result.pricePaidWei)} MON</b>, won <b>{formatMon(result.totalValueWei)} MON</b>{' '}
        <span className={`font-bold ${pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {pct >= 0 ? '+' : ''}
          {pct.toFixed(1)}%
        </span>
      </p>
      <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
        {sortPullsForReveal(result.pulls).map((p) => (
          <Card key={p.slot} pull={p} token={findToken(catalog, p.token)} flipped rarity={displayRarity(p, result.tier)} />
        ))}
      </div>
      <p className="text-xs text-white/40">
        Spin #{result.requestId} · {(result.multiplierBps / 10000).toFixed(2)}x ·{' '}
        <a className="underline hover:text-white" href={`${EXPLORER_URL}/tx/${result.txHash}`} target="_blank" rel="noreferrer">
          view tx
        </a>
      </p>
    </motion.div>
  );
}

/**
 * Shared shell for the slot machine and wheel: same wallet gating, same useOpenPack() call and the same
 * on-chain draw as the pack on "/". Only the animation in the middle differs.
 */
export function GamePage({
  title, accent, blurb, verb, renderMachine,
}: {
  title: string;
  accent: string;
  blurb: string;
  verb: string;
  renderMachine: (p: { busy: boolean; result?: PackResult; onLanded: () => void }) => React.ReactNode;
}) {
  const { isConnected, isWrongChain, switchChain } = useConnection();
  const { priceWei } = usePackPrice();
  const { data: catalog } = useCatalog();
  const { open, status, error } = useOpenPack();
  const [result, setResult] = useState<PackResult | null>(null);
  const [landed, setLanded] = useState(false);

  const busy = status === 'signing' || status === 'mining';
  const spinning = busy || (!!result && !landed);
  const priceLabel = priceWei !== undefined ? `${formatMon(priceWei, 2)} MON` : '… MON';
  const err = status === 'error' ? friendlyError(error) : null;

  async function handleSpin() {
    setResult(null);
    setLanded(false);
    try {
      setResult(await open());
    } catch {
      /* surfaced through `error` */
    }
  }

  return (
    <div className="flex flex-col items-center gap-8 pt-4">
      <section className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          {title} <span className="text-accent">{accent}</span>
        </h1>
        <p className="max-w-xl text-white/60">{blurb}</p>
      </section>

      {renderMachine({ busy, result: result ?? undefined, onLanded: () => setLanded(true) })}

      <div className="flex flex-col items-center gap-3">
        {!isConnected ? (
          <div className="flex flex-col items-center gap-2">
            <Connect />
            <p className="text-xs text-white/40">Connect a wallet on Monad testnet to {verb.toLowerCase()}.</p>
          </div>
        ) : isWrongChain ? (
          <button
            onClick={() => switchChain()}
            className="rounded-full bg-amber-400 px-8 py-3 text-lg font-bold text-black transition hover:brightness-110"
          >
            Switch to Monad Testnet
          </button>
        ) : (
          <button
            onClick={handleSpin}
            disabled={spinning || priceWei === undefined}
            className="min-w-56 rounded-full bg-accent px-8 py-3 text-lg font-bold text-white shadow-[0_10px_30px_rgba(131,110,249,0.5)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
          >
            {status === 'signing'
              ? 'Confirm in wallet…'
              : busy || (result && !landed)
                ? 'Spinning…'
                : `${result ? `${verb} again` : verb} · ${priceLabel}`}
          </button>
        )}

        {err && (
          <div className="max-w-md rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-center text-sm text-rose-200">
            {err.text}{' '}
            {err.needsMon && (
              <a href={FAUCET_URL} target="_blank" rel="noreferrer" className="font-semibold underline">
                Get at least 0.16 MON from the faucet
              </a>
            )}
          </div>
        )}
      </div>

      {result && landed && <GameResult key={result.requestId} result={result} catalog={catalog} />}

      <p className="max-w-md text-center text-xs text-white/40">
        Same on-chain draw and odds as opening a pack: the animation is picked after the result, it never changes it.
      </p>
    </div>
  );
}
