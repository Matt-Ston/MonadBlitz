import { contrastText } from '@/lib/ui';

/** Our own generated badge: coloured circle + ticker. Not an official logo. */
export function TokenBadge({ symbol, color, size = 64 }: { symbol: string; color: string; size?: number }) {
  const ticker = symbol.replace(/^m/, '');
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-extrabold ring-2 ring-white/20"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${color}ee, ${color} 60%, #000a)`,
        color: contrastText(color),
        fontSize: size * (ticker.length > 3 ? 0.24 : 0.3),
      }}
    >
      {ticker}
    </div>
  );
}
