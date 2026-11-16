'use client';
import { formatMon, pctChange } from '@/lib/sdk';

/** Paid / pulled / return in big, plain numbers. Green when you came out ahead, red when you didn't. */
export function ReturnStats({ paidWei, pulledWei, label = 'Pulled' }: { paidWei: string | bigint; pulledWei: string | bigint; label?: string }) {
  const paid = BigInt(paidWei);
  const pulled = BigInt(pulledWei);
  const pct = pctChange(paid.toString(), pulled.toString());
  const mult = paid === 0n ? 0 : Number((pulled * 1000n) / paid) / 1000;
  const up = pulled >= paid;
  const tone = up ? 'text-emerald-400' : 'text-rose-400';
  return (
    <div className="grid w-full max-w-2xl grid-cols-3 items-stretch gap-2 sm:gap-3">
      <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-black/40 px-2 py-3">
        <span className="text-xs font-bold uppercase tracking-widest text-white/50">Paid</span>
        <span className="text-2xl font-black tabular-nums sm:text-3xl">{formatMon(paid, 2)}</span>
        <span className="text-xs font-semibold text-white/50">MON</span>
      </div>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-black/40 px-2 py-3">
        <span className="text-xs font-bold uppercase tracking-widest text-white/50">{label}</span>
        <span className={`text-2xl font-black tabular-nums sm:text-3xl ${tone}`}>{formatMon(pulled, 3)}</span>
        <span className="text-xs font-semibold text-white/50">MON</span>
      </div>
      <div className={`flex flex-col items-center justify-center rounded-2xl border px-2 py-3 ${up ? 'border-emerald-400/60 bg-emerald-500/15' : 'border-rose-400/60 bg-rose-500/15'}`}>
        <span className="text-xs font-bold uppercase tracking-widest text-white/60">Return</span>
        <span className={`text-2xl font-black tabular-nums sm:text-3xl ${tone}`}>
          {pct >= 0 ? '+' : ''}
          {pct.toFixed(1)}%
        </span>
        <span className={`text-xs font-bold ${tone}`}>{mult.toFixed(2)}x your money</span>
      </div>
    </div>
  );
}
