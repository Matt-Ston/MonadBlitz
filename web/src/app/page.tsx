'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Duck } from '@/components/Duck';
import { FeedTicker } from '@/components/FeedTicker';

const GAMES = [
  {
    href: '/packs', name: 'Packs', tag: 'Rip a pack, flip the cards', cta: 'Open packs',
    ring: 'from-violet-500 via-fuchsia-500 to-violet-500', glow: 'rgba(131,110,249,0.7)',
    art: (
      <div className="pack-face flex h-28 w-20 flex-col items-center justify-center rounded-xl border border-white/30">
        <span className="text-3xl font-black">0.1</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">MON</span>
      </div>
    ),
  },
  {
    href: '/slots', name: 'Slots', tag: 'Pull the lever, line them up', cta: 'Spin the slots',
    ring: 'from-amber-300 via-rose-500 to-amber-300', glow: 'rgba(251,191,36,0.7)',
    art: (
      <div className="flex gap-1.5">
        {['👑', '💎', '👑'].map((s, i) => (
          <motion.span
            key={i}
            className="flex h-24 w-14 items-center justify-center rounded-lg border border-white/20 bg-zinc-900 text-4xl"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          >
            {s}
          </motion.span>
        ))}
      </div>
    ),
  },
  {
    href: '/wheel', name: 'Wheel', tag: 'Spin it, tick tick tick', cta: 'Spin the wheel',
    ring: 'from-sky-400 via-emerald-400 to-sky-400', glow: 'rgba(56,189,248,0.7)',
    art: (
      <motion.div
        className="h-28 w-28 rounded-full border-4 border-white/40"
        style={{ background: 'conic-gradient(#71717a 0 45%, #0ea5e9 45% 75%, #10b981 75% 91%, #d946ef 91% 97%, #fbbf24 97% 99.5%, #f472b6 99.5% 100%)' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />
    ),
  },
];

/** Home: pick one of the three games. They all use the same on-chain draw and odds. */
export default function Home() {
  return (
    <div className="flex flex-col items-center gap-10 pt-4">
      <section className="flex flex-col items-center gap-3 text-center">
        <motion.div animate={{ y: [0, -12, 0], rotate: [0, -4, 4, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
          <Duck size={120} />
        </motion.div>
        <h1 className="text-5xl font-black tracking-tight sm:text-6xl">
          Pick your <span className="text-accent">game.</span>
        </h1>
        <p className="max-w-xl text-lg text-white/70">
          Three ways to pull tokens on Monad. Same on-chain draw, same public odds, different thrill.
        </p>
      </section>

      <div className="grid w-full gap-6 sm:grid-cols-3">
        {GAMES.map((g, i) => (
          <motion.div
            key={g.href}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12, type: 'spring', stiffness: 220, damping: 18 }}
            whileHover={{ y: -10, scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link
              href={g.href}
              className={`block rounded-[2rem] bg-gradient-to-br p-[3px] ${g.ring}`}
              style={{ boxShadow: `0 0 60px -6px ${g.glow}` }}
            >
              <div className="flex h-full flex-col items-center gap-4 rounded-[1.85rem] bg-ink/90 px-5 py-8 text-center">
                <div className="flex h-32 items-center justify-center">{g.art}</div>
                <h2 className="text-4xl font-black">{g.name}</h2>
                <p className="text-white/70">{g.tag}</p>
                <span className="rounded-full bg-white px-6 py-2.5 text-base font-black text-black">{g.cta}</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <FeedTicker />
    </div>
  );
}
