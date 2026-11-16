import { ImageResponse } from 'next/og';
import { SHARE_RARITY_LABEL, readShare } from '@/lib/shareData';

export const runtime = 'edge';

// Per display rarity: [main colour, second colour] for the card frame and background glow.
const LOOK: [string, string][] = [
  ['#a1a1aa', '#52525b'],
  ['#38bdf8', '#0369a1'],
  ['#e879f9', '#7e22ce'],
  ['#fcd34d', '#b45309'],
  ['#fb7185', '#9f1239'],
  ['#f472b6', '#38bdf8'],
];

/** 1200×630 share image for a pull (Open Graph / X card). All numbers come from the query string. */
export function GET(req: Request) {
  const share = readShare(new URL(req.url).searchParams);
  const [c1, c2] = LOOK[share.r];
  const label = SHARE_RARITY_LABEL[share.r];
  const ultra = share.r === 5;
  const frame = ultra ? 'linear-gradient(135deg, #f472b6, #a78bfa, #38bdf8, #34d399, #fde047)' : `linear-gradient(135deg, ${c1}, ${c2})`;
  const ticker = share.s.replace(/^m/, '');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', gap: 64, padding: '0 80px',
          background: `radial-gradient(circle at 25% 50%, ${c1}55, #0b0a12 60%)`, backgroundColor: '#0b0a12', color: 'white', fontFamily: 'sans-serif',
        }}
      >
        {/* the card */}
        <div style={{ display: 'flex', padding: 8, borderRadius: 36, background: frame, boxShadow: `0 0 80px ${c1}` }}>
          <div
            style={{
              width: 340, height: 460, borderRadius: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
              padding: '28px 24px', background: `linear-gradient(180deg, ${c2}cc, #15131f)`,
            }}
          >
            <div style={{ display: 'flex', fontSize: 28, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: c1 }}>{label}</div>
            <div
              style={{
                width: 170, height: 170, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `#${share.c}`, border: '6px solid rgba(255,255,255,0.35)', fontSize: ticker.length > 4 ? 40 : 52, fontWeight: 900,
              }}
            >
              {ticker}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', fontSize: 30, fontWeight: 900 }}>{share.a || ticker}</div>
              <div style={{ display: 'flex', fontSize: 20, color: 'rgba(255,255,255,0.6)' }}>Pack #{share.n}</div>
            </div>
          </div>
        </div>

        {/* the brag */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', fontSize: 34, fontWeight: 900, color: '#a78bfa' }}>CoinPack</div>
            {share.d && (
              <div style={{ display: 'flex', fontSize: 20, fontWeight: 800, color: '#fcd34d', border: '2px solid #fcd34d', borderRadius: 999, padding: '2px 14px' }}>
                DEMO
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', fontSize: 64, fontWeight: 900, lineHeight: 1.05 }}>
            <span>I pulled {/^[AEIOU]/.test(label) ? 'an' : 'a'}</span>
            <span style={{ color: c1 }}>{label}!</span>
          </div>
          <div style={{ display: 'flex', fontSize: 96, fontWeight: 900, color: '#34d399' }}>{share.m}x</div>
          <div style={{ display: 'flex', fontSize: 30, color: 'rgba(255,255,255,0.8)' }}>
            {share.v} MON{share.u ? ` · $${share.u}` : ''} from a single pack
          </div>
          <div style={{ display: 'flex', fontSize: 24, color: 'rgba(255,255,255,0.5)' }}>
            {share.tx ? 'Drawn on-chain on Monad · check the tx' : 'Open your own pack on Monad testnet'}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
