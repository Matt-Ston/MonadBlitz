'use client';
import { formatMon, useRecentFeed } from '@/lib/sdk';
import { TIER_INFO, shortAddr } from '@/lib/ui';

export function FeedTicker() {
  const { data } = useRecentFeed();
  if (!data || data.length === 0) return null;
  const items = [...data, ...data]; // duplicated for a seamless loop
  return (
    <div className="relative w-full overflow-hidden rounded-full border border-line bg-panel/60 py-2 text-xs">
      <div className="flex w-max animate-ticker gap-8 whitespace-nowrap px-4">
        {items.map((f, i) => (
          <span key={`${f.requestId}-${i}`} className="flex items-center gap-2 text-white/70">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${TIER_INFO[f.tier].className}`}>
              {TIER_INFO[f.tier].label}
            </span>
            {shortAddr(f.buyer)} pulled <b className="text-white">{formatMon(f.totalValueWei)} MON</b>
            <span className="text-white/40">({(f.multiplierBps / 10000).toFixed(2)}x)</span>
          </span>
        ))}
      </div>
    </div>
  );
}
