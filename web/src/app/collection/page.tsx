'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { formatMon, useCatalog, useConnection, useHoldings } from '@/lib/sdk';
import { RARITY_FRAME, RARITY_LABEL, RARITY_TEXT, findToken, formatCoin, formatUsd, usdFor } from '@/lib/ui';
import { TokenBadge } from '@/components/TokenBadge';
import { Connect } from '@/components/Connect';

export default function CollectionPage() {
  const { address, isConnected } = useConnection();
  const { data: holdings, refetch } = useHoldings(address);
  const { data: catalog } = useCatalog();

  // Fallback until the sdk invalidates holdings after PackOpened (§15.3): refresh on arrival.
  useEffect(() => {
    if (address) refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-4 pt-16 text-center">
        <h1 className="text-2xl font-bold">Your collection</h1>
        <p className="text-white/60">Connect your wallet to see the tokens you&apos;ve pulled.</p>
        <Connect />
      </div>
    );
  }

  const sorted = [...(holdings ?? [])].sort((a, b) => b.rarity - a.rarity || Number(BigInt(b.valueWei) - BigInt(a.valueWei)));
  const total = sorted.reduce((s, h) => s + BigInt(h.valueWei), 0n);
  const totalUsd = sorted.reduce((s, h) => s + (usdFor(findToken(catalog, h.token), h.balance) ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Your collection</h1>
          <p className="text-sm text-white/50">{sorted.length} of 12 tokens collected</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-white/50">Total value</div>
          <div className="text-2xl font-black">{formatMon(total)} MON</div>
          {totalUsd > 0 && <div className="text-xs text-white/50">{formatUsd(totalUsd)}</div>}
        </div>
      </div>

      {holdings === undefined ? (
        <p className="text-white/50">Loading balances…</p>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-panel/60 p-10 text-center">
          <p className="text-white/60">No tokens yet.</p>
          <Link href="/" className="rounded-full bg-accent px-5 py-2 font-semibold">
            Open your first pack
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {sorted.map((h) => {
            const t = findToken(catalog, h.token);
            const usd = usdFor(t, h.balance);
            return (
              <div
                key={h.token}
                className={`relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border-2 bg-gradient-to-b p-4 text-center ${RARITY_FRAME[h.rarity]}`}
              >
                {h.rarity === 3 && (
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                )}
                <span className={`text-[10px] font-semibold uppercase tracking-widest ${RARITY_TEXT[h.rarity]}`}>
                  {RARITY_LABEL[h.rarity]}
                </span>
                <TokenBadge symbol={h.symbol} color={t?.color ?? '#555'} size={56} />
                <div className="text-sm font-semibold">{t?.name ?? h.symbol}</div>
                <div className="text-xs text-white/80">
                  <b>{formatCoin(h.symbol, h.balance)}</b>
                </div>
                <div className="text-sm font-bold">{formatMon(h.valueWei)} MON</div>
                {usd !== undefined && <div className="text-[11px] text-white/50">{formatUsd(usd)}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
