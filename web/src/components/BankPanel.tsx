'use client';
import { useState } from 'react';
import type { BankState, TokenInfo } from '@/lib/sdk';
import { formatMon } from '@/lib/sdk';
import { formatUsd, friendlyError, parseMon, usdForMon } from '@/lib/ui';

const PRESETS = ['0.5', '1', '5', '10'];

/**
 * The pack bank (IR-4): deposit MON once, then every "Open" is paid from the balance. Opening 5 packs is one
 * transaction instead of five, with no MON attached, so there's one signature and one gas charge per batch.
 */
export function BankPanel({
  bank, catalog, payFromBank, setPayFromBank,
}: {
  bank: BankState;
  catalog?: TokenInfo[];
  payFromBank: boolean;
  setPayFromBank(on: boolean): void;
}) {
  const [amount, setAmount] = useState('1');
  const wei = parseMon(amount);
  const balance = bank.balanceWei ?? 0n;
  const usd = usdForMon(balance, catalog);
  const busy = bank.status === 'signing' || bank.status === 'mining';
  const err = bank.status === 'error' ? friendlyError(bank.error) : null;

  return (
    <section className="w-full rounded-3xl border border-emerald-300/30 bg-emerald-400/5 p-4 shadow-[0_0_40px_-12px_rgba(52,211,153,0.6)] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Your pack bank</div>
          <div className="text-3xl font-black tabular-nums">
            {formatMon(balance, 4)} MON
            {usd !== undefined && <span className="ml-2 text-base font-semibold text-white/50">{formatUsd(usd)}</span>}
          </div>
          <p className="mt-1 max-w-md text-xs text-white/60">
            Deposit once, then open packs straight from your bank: no MON sent per pack, and opening 5 is one
            transaction instead of five.
          </p>
        </div>

        <label className="flex cursor-pointer select-none items-center gap-3 rounded-full border border-white/15 bg-black/20 px-4 py-2">
          <span className="text-sm font-semibold">Pay from bank</span>
          <button
            type="button"
            role="switch"
            aria-checked={payFromBank}
            onClick={() => setPayFromBank(!payFromBank)}
            className={`relative h-6 w-11 rounded-full transition ${payFromBank ? 'bg-emerald-400' : 'bg-white/20'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${payFromBank ? 'left-[1.375rem]' : 'left-0.5'}`} />
          </button>
        </label>
      </div>

      <form
        className="mt-4 flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (wei) bank.deposit(wei).catch(() => {});
        }}
      >
        <div className="flex items-center rounded-full border border-white/20 bg-black/30 pl-4 focus-within:border-emerald-300">
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label="Amount to deposit in MON"
            className="w-24 bg-transparent py-2 text-lg font-bold tabular-nums outline-none"
          />
          <span className="pr-4 text-sm font-semibold text-white/60">MON</span>
        </div>
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAmount(p)}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
              amount === p ? 'border-emerald-300 bg-emerald-300/20 text-emerald-200' : 'border-white/15 text-white/70 hover:bg-white/10'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="submit"
          disabled={!wei || busy}
          className="rounded-full bg-emerald-400 px-5 py-2 font-bold text-black transition hover:brightness-110 disabled:opacity-50"
        >
          {busy && bank.status === 'signing' ? 'Confirm…' : 'Deposit'}
        </button>
        <button
          type="button"
          disabled={balance === 0n || busy}
          onClick={() => bank.withdraw(balance).catch(() => {})}
          className="rounded-full px-3 py-2 text-sm font-semibold text-white/60 underline-offset-4 hover:text-white hover:underline disabled:opacity-40 disabled:no-underline"
        >
          Withdraw all
        </button>
      </form>

      {err && <p className="mt-3 text-sm text-rose-300">{err.text}</p>}
    </section>
  );
}
