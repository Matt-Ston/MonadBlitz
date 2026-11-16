import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { SHARE_RARITY_LABEL, readShare, shareQuery, shareText } from '@/lib/shareData';

type Props = { searchParams: Record<string, string | string[] | undefined> };

const EXPLORER_URL = 'https://testnet.monadexplorer.com';

function origin(): string {
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'coinpack.vercel.app';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

/** Open Graph / X card: the link unfurls as the pull-card image. */
export function generateMetadata({ searchParams }: Props): Metadata {
  const share = readShare(searchParams);
  const image = `${origin()}/api/pull-card?${shareQuery(share)}`;
  const title = `${SHARE_RARITY_LABEL[share.r]} pull · ${share.m}x on CoinPack`;
  const description = shareText(share);
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

/** Landing page for a shared pull: the card, the numbers, and a way to open your own pack. */
export default function PullPage({ searchParams }: Props) {
  const share = readShare(searchParams);
  return (
    <div className="flex flex-col items-center gap-6 pt-4 text-center">
      <h1 className="text-3xl font-black sm:text-5xl">{shareText(share).replace(' 🦆', '')}</h1>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/pull-card?${shareQuery(share)}`}
        alt={`${SHARE_RARITY_LABEL[share.r]} pull card`}
        width={1200}
        height={630}
        className="w-full max-w-3xl rounded-3xl border border-white/15 shadow-[0_20px_80px_rgba(131,110,249,0.45)]"
      />
      {share.tx ? (
        <a className="text-sm text-white/60 underline hover:text-white" href={`${EXPLORER_URL}/tx/${share.tx}`} target="_blank" rel="noreferrer">
          Verify this pull on the Monad explorer
        </a>
      ) : (
        share.d && <p className="text-sm text-white/50">Pulled in CoinPack&apos;s demo mode.</p>
      )}
      <Link href="/packs" className="rounded-full bg-accent px-8 py-3 text-lg font-bold text-white shadow-[0_10px_30px_rgba(131,110,249,0.5)] transition hover:brightness-110">
        Open your own pack
      </Link>
    </div>
  );
}
