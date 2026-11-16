import Link from 'next/link';

/** Back to the game picker. Shown at the top of every game. */
export function BackHome() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 self-start rounded-full border border-white/25 bg-white/5 px-4 py-2 text-sm font-bold text-white/90 transition hover:bg-white/15"
    >
      <span aria-hidden="true">←</span> Home
    </Link>
  );
}
