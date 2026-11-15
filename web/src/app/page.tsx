'use client';
import { useState } from 'react';
import type { PackResult } from '@/lib/sdk';
import { formatMon, useCatalog, useConnection, useOpenPack, usePackPrice } from '@/lib/sdk';
import { FAUCET_URL } from '@/lib/ui';
import { Pack } from '@/components/Pack';
import { Reveal } from '@/components/Reveal';
import { FeedTicker } from '@/components/FeedTicker';
import { Connect } from '@/components/Connect';

function friendlyError(e?: Error): { text: string; needsMon: boolean } | null {
  if (!e) return null;
  const msg = e.message || String(e);
  if (/reject|denied|cancel/i.test(msg)) return { text: 'Transaction cancelled in wallet.', needsMon: false };
  // Custom errors from PackVault (viem puts the error name in the message).
  if (/NotEnoughGas/.test(msg))
    return { text: 'Gas limit too low. Let your wallet estimate gas (don’t set it manually) and try again.', needsMon: false };
  if (/ZeroPrice/.test(msg)) return { text: 'A token in this pack has no price yet. Try again in a minute.', needsMon: false };
  if (/CatalogEmpty/.test(msg)) return { text: 'The pack vault isn’t set up yet. Try again shortly.', needsMon: false };
  if (/insufficient funds|insufficient balance|exceeds (the )?balance/i.test(msg))
    return {
      text: 'Not enough testnet MON. Each pack costs about 0.16 MON including gas (0.1 MON pack + gas reserve).',
      needsMon: true,
    };
  return { text: msg.split('\n')[0].slice(0, 160), needsMon: false };
}

export default function Home() {
  const { isConnected, isWrongChain, switchChain } = useConnection();
  const { priceWei } = usePackPrice();
  const { data: catalog } = useCatalog();
  const { open, status, error } = useOpenPack();
  const [result, setResult] = useState<PackResult | null>(null);

  const busy = status === 'signing' || status === 'mining';
  const priceLabel = priceWei !== undefined ? `${formatMon(priceWei, 2)} MON` : '… MON';
  const err = status === 'error' ? friendlyError(error) : null;

  async function handleOpen() {
    setResult(null);
    try {
      setResult(await open());
    } catch {
      /* surfaced through `error` */
    }
  }

  if (result) {
    return (
      <div className="flex flex-col gap-6">
        <Reveal key={result.requestId} result={result} catalog={catalog} onAgain={handleOpen} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-10 pt-4">
      <section className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          Rip a pack. <span className="text-accent">Pull 10 tokens.</span>
        </h1>
        <p className="max-w-xl text-white/60">
          Each pack holds 10 tokens. Most packs land within ±5% of the price, and sometimes you hit a big win or a
          jackpot. The draw happens on-chain on Monad, and the odds are public.
        </p>
      </section>

      <Pack busy={busy} priceLabel={priceLabel} />

      <div className="flex flex-col items-center gap-3">
        {!isConnected ? (
          <div className="flex flex-col items-center gap-2">
            <Connect />
            <p className="text-xs text-white/40">Connect a wallet on Monad testnet to open a pack.</p>
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
            onClick={handleOpen}
            disabled={busy || priceWei === undefined}
            className="min-w-56 rounded-full bg-accent px-8 py-3 text-lg font-bold text-white shadow-[0_10px_30px_rgba(131,110,249,0.5)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
          >
            {status === 'signing' ? 'Confirm in wallet…' : status === 'mining' ? 'Opening pack…' : `Open Pack · ${priceLabel}`}
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

      <FeedTicker />
    </div>
  );
}
