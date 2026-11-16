'use client';
import { useState } from 'react';
import type { PackResult } from '@/lib/sdk';
import Link from 'next/link';
import { MOCK, formatMon, useCatalog, useConnection, useDemoSettings, useOpenPack, useOpenPacks, usePackPrice } from '@/lib/sdk';
import { useBankPay } from '@/lib/bankPref';
import { FAUCET_URL, friendlyError } from '@/lib/ui';
import { Pack } from '@/components/Pack';
import { Reveal } from '@/components/Reveal';
import { FeedTicker } from '@/components/FeedTicker';
import { Connect } from '@/components/Connect';
import { MultiReveal } from '@/components/MultiReveal';
import { BackHome } from '@/components/BackHome';
import { emitFx } from '@/lib/fx';

const MULTI = 5;
// Each pack size gets its own colour: violet, hot pink, gold.
const PACK_LOOK = [
  { filter: undefined, title: 'text-violet-300', glow: 'rgba(131,110,249,0.55)' },
  { filter: 'hue-rotate(70deg) saturate(1.6)', title: 'text-pink-300', glow: 'rgba(236,72,153,0.6)' },
  { filter: 'sepia(1) saturate(5) hue-rotate(-12deg) brightness(1.15)', title: 'text-amber-300', glow: 'rgba(251,191,36,0.65)' },
];

export default function PacksPage() {
  const { isConnected, isWrongChain, switchChain } = useConnection();
  const { priceWei } = usePackPrice();
  const { data: catalog } = useCatalog();
  const single = useOpenPack();
  const multi = useOpenPacks();
  const { prices, setPrice } = useDemoSettings();
  const [result, setResult] = useState<PackResult | null>(null);
  const [results, setResults] = useState<PackResult[] | null>(null);
  const [mode, setMode] = useState<'one' | 'multi'>('one');
  const [picked, setPicked] = useState<bigint | null>(null);
  const { bank, fromBank } = useBankPay();
  const [via, setVia] = useState<'wallet' | 'bank'>('wallet');

  // The deployed vault has a single price (0.1 MON); the 1 and 5 MON packs exist in mock mode only.
  const sizes = MOCK ? prices : priceWei !== undefined ? [priceWei] : [];
  const active = via === 'bank' ? bank.status : mode === 'one' ? single.status : multi.status;
  const busy = active === 'signing' || active === 'mining';
  const err = active === 'error' ? friendlyError(via === 'bank' ? bank.error : mode === 'one' ? single.error : multi.error) : null;

  async function go(price: bigint, many: boolean) {
    if (MOCK) setPrice(price);
    setPicked(price);
    setMode(many ? 'multi' : 'one');
    setVia(fromBank ? 'bank' : 'wallet');
    setResult(null);
    setResults(null);
    emitFx({ type: 'busy' });
    try {
      if (fromBank) {
        // One transaction for the whole batch, paid from the bank.
        const out = await bank.openFromBank(many ? MULTI : 1);
        if (many) setResults(out);
        else setResult(out[0]);
      } else if (many) setResults(await multi.openMany(MULTI));
      else setResult(await single.open());
    } catch {
      /* surfaced through `error` */
    }
  }

  if (results) {
    return (
      <div className="flex flex-col gap-6">
        <BackHome />
        <MultiReveal key={results[0].requestId} results={results} catalog={catalog} onAgain={() => go(picked ?? sizes[0], true)} />
      </div>
    );
  }

  if (result) {
    return (
      <div className="flex flex-col gap-6">
        <BackHome />
        <Reveal key={result.requestId} result={result} catalog={catalog} onAgain={() => go(picked ?? sizes[0], false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 pt-2">
      <BackHome />
      <section className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          Rip a pack. <span className="text-accent">Pull 3–5 tokens.</span>
        </h1>
        <p className="max-w-xl text-white/70">
          Pick a pack. Bigger packs pay out bigger pulls at the same odds. The draw happens on-chain on Monad, and the
          odds are public.
        </p>
      </section>

      {!isConnected ? (
        <div className="flex flex-col items-center gap-2">
          <Connect />
          <p className="text-xs text-white/40">Connect a wallet on Monad testnet to open a pack.</p>
        </div>
      ) : isWrongChain ? (
        <button onClick={() => switchChain()} className="rounded-full bg-amber-400 px-8 py-3 text-lg font-bold text-black transition hover:brightness-110">
          Switch to Monad Testnet
        </button>
      ) : (
        <>
        {fromBank && (
          <Link href="/#bank" className="-mt-2 rounded-full border border-emerald-300/40 bg-emerald-400/10 px-4 py-1.5 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/20">
            Paying from your bank · {formatMon(bank.balanceWei ?? 0n, 2)} MON left
          </Link>
        )}
        <div className={`grid w-full gap-6 ${sizes.length > 1 ? 'sm:grid-cols-3' : 'max-w-xs'}`}>
          {sizes.map((p, i) => {
            const look = PACK_LOOK[i % PACK_LOOK.length];
            const mine = busy && picked === p;
            return (
              <div
                key={p.toString()}
                className="flex flex-col items-center gap-4 rounded-3xl border border-white/15 bg-white/5 p-5"
                style={{ boxShadow: `0 0 50px -8px ${look.glow}` }}
              >
                <div style={{ filter: look.filter }}>
                  <Pack busy={mine} priceLabel={`${formatMon(p, 2)} MON`} />
                </div>
                <button
                  onClick={() => go(p, false)}
                  disabled={busy}
                  className="w-full rounded-full bg-accent px-6 py-3 text-lg font-bold text-white shadow-[0_10px_30px_rgba(131,110,249,0.5)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
                >
                  {mine && mode === 'one' ? (active === 'signing' ? 'Confirm in wallet…' : 'Opening…') : fromBank ? 'Open 1 · from bank' : 'Open 1'}
                </button>
                <button
                  onClick={() => go(p, true)}
                  disabled={busy}
                  className="w-full rounded-full border-2 border-yellow-300 bg-yellow-300/10 px-6 py-3 text-lg font-bold text-yellow-200 transition hover:bg-yellow-300/20 disabled:cursor-wait disabled:opacity-60"
                >
                  {mine && mode === 'multi'
                    ? `Opening ${MULTI}…`
                    : `Open ${MULTI} · ${formatMon(p * BigInt(MULTI), 2)} MON${fromBank ? ' · 1 tx' : ''}`}
                </button>
              </div>
            );
          })}
        </div>
        </>
      )}

      {err && (
        <div className="max-w-md rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-center text-sm text-rose-200">
          {err.text}{' '}
          {err.needsMon && (
            <a href={FAUCET_URL} target="_blank" rel="noreferrer" className="font-semibold underline">
              Get testnet MON from the faucet
            </a>
          )}
        </div>
      )}

      <FeedTicker />
    </div>
  );
}
