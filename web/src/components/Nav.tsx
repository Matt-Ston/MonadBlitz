'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MOCK, useDemoSettings } from '@/lib/sdk';
import { Connect } from './Connect';
import { Duck } from './Duck';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/packs', label: 'Packs' },
  { href: '/slots', label: 'Slots' },
  { href: '/wheel', label: 'Wheel' },
  { href: '/collection', label: 'Collection' },
  { href: '/odds', label: 'Odds' },
];

export function Nav() {
  const path = usePathname();
  const { demo, setDemo } = useDemoSettings();
  return (
    <header className="sticky top-0 z-20 bg-ink/70 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <Link href="/" className="group flex shrink-0 items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400/40 via-violet-500/40 to-fuchsia-500/40 ring-1 ring-white/25 transition group-hover:scale-110 group-hover:ring-white/60">
              <Duck size={30} />
            </span>
            <span className="ultra-text hidden text-xl font-black tracking-tight sm:inline">CoinPack</span>
          </Link>
          <nav className="flex min-w-0 items-center gap-0.5 rounded-full border border-white/10 bg-white/5 p-1 text-xs sm:text-sm">
            {LINKS.map((l) => {
              const on = path === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={on ? 'page' : undefined}
                  className={`rounded-full px-2.5 py-1.5 font-semibold transition sm:px-3.5 ${
                    on
                      ? 'bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-[0_0_16px_rgba(99,102,241,0.7)]'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Demo odds are mock-mode only; kept small on purpose. A lit dot shows when it is on. */}
          {MOCK && (
            <button
              type="button"
              onClick={() => setDemo(!demo)}
              aria-pressed={demo}
              title={
                demo
                  ? 'Demo mode is on: Legendary, Mythic and Ultra packs come up about 20x as often. Not the real odds. Click to turn off.'
                  : 'Demo mode: boosts the rare packs for showing off the effects. Mock mode only.'
              }
              className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium lowercase tracking-wide transition hover:text-white/80 ${
                demo ? 'text-white/70' : 'text-white/35'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full transition ${demo ? 'bg-amber-300 shadow-[0_0_6px_rgba(252,211,77,0.9)]' : 'bg-white/30'}`} />
              demo mode
            </button>
          )}
          {MOCK && (
            <span className="hidden rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/40 sm:inline">
              Mock
            </span>
          )}
          <Connect />
        </div>
      </div>
      {/* coloured hairline under the bar */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-sky-400/70 to-transparent" />
    </header>
  );
}
