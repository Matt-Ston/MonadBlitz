'use client';
import { formatMon, useOdds } from '@/lib/sdk';
import { TIER_INFO } from '@/lib/ui';

const pct = (bps: number) => `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`;
const x = (bps: number) => `${(bps / 10000).toFixed(2)}x`;

export default function OddsPage() {
  const { data: odds } = useOdds();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Odds</h1>
        <p className="text-sm text-white/50">Pack price: {formatMon(odds.packPriceWei, 2)} MON</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-panel/70">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-white/50">
            <tr>
              <th className="px-4 py-3">Outcome</th>
              <th className="px-4 py-3">Chance</th>
              <th className="px-4 py-3">Pack value</th>
              <th className="px-4 py-3">Average</th>
            </tr>
          </thead>
          <tbody>
            {odds.rows.map((r) => (
              <tr key={r.tier} className="border-t border-line">
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${TIER_INFO[r.tier].className}`}>
                    {TIER_INFO[r.tier].label}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold">{pct(r.probabilityBps)}</td>
                <td className="px-4 py-3">
                  {x(r.minMultBps)} – {x(r.maxMultBps)}
                </td>
                <td className="px-4 py-3">{x(r.meanMultBps)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-panel/70 p-4">
          <div className="text-xs uppercase tracking-wider text-white/50">Expected value</div>
          <div className="text-2xl font-black">{x(odds.expectedValueBps)}</div>
        </div>
        <div className="rounded-2xl border border-line bg-panel/70 p-4">
          <div className="text-xs uppercase tracking-wider text-white/50">Within ±5% of price</div>
          <div className="text-2xl font-black">≈ {pct(odds.withinFivePctBps)}</div>
        </div>
      </div>

      <div className="space-y-3 text-sm leading-relaxed text-white/70">
        <h2 className="text-base font-semibold text-white">How the draw works</h2>
        <p>
          When you open a pack, the contract mixes the previous block hash, the block&apos;s randomness, the timestamp, a
          random seed from your browser, your address and the pack number into a single seed, all in the same
          transaction.
        </p>
        <p>
          That seed picks the outcome tier above, then a multiplier inside that tier&apos;s range, then 10 tokens by
          rarity (60% Common, 28% Rare, 10% Epic, 2% Legendary). It splits the pack&apos;s total value across them at
          the current oracle price. Big wins and jackpots always include a Legendary.
        </p>
        <p>
          The tokens are minted straight to your wallet and every result is emitted on-chain as a{' '}
          <code className="rounded bg-white/10 px-1">PackOpened</code> event, so anyone can audit the odds.
        </p>
      </div>

      <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
        Testnet demo only. Packs are paid with free faucet MON, and the tokens are mocks with no real value. The
        randomness is demo-grade: a validator could bias it. A production version would use commit/reveal or a VRF.
      </div>
    </div>
  );
}
