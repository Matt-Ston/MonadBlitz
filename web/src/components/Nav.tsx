'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MOCK } from '@/lib/sdk';
import { Connect } from './Connect';

const LINKS = [
  { href: '/', label: 'Open' },
  { href: '/collection', label: 'Collection' },
  { href: '/odds', label: 'Odds' },
];

export function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="inline-block h-6 w-6 rounded-md bg-gradient-to-br from-accent to-indigo-900" />
            <span className="hidden sm:inline">CoinPack</span>
          </Link>
          <nav className="flex gap-1 text-sm">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-3 py-1.5 transition ${
                  path === l.href ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {MOCK && (
            <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
              Mock
            </span>
          )}
          <Connect />
        </div>
      </div>
    </header>
  );
}
