'use client';
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { PackResult, TokenInfo } from '@/lib/sdk';
import { pullShare, shareQuery, shareText } from '@/lib/share';

/** "Share this pull" for big wins: preview of the pull card, then native share / post on X / copy link / save image. */
export function ShareButton({ result, catalog }: { result: PackResult; catalog?: TokenInfo[] }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const share = useMemo(() => pullShare(result, catalog), [result, catalog]);
  const q = shareQuery(share);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/pull?${q}` : `/pull?${q}`;
  const image = `/api/pull-card?${q}`;
  const text = shareText(share);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the link is still visible to select */
    }
  }

  async function saveImage() {
    const blob = await (await fetch(image)).blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `coinpack-pull-${share.n}.png`;
    a.click();
    URL.revokeObjectURL(href);
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: [0.8, 1.08, 1], opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 px-6 py-2.5 font-bold text-white shadow-[0_10px_30px_rgba(236,72,153,0.45)] transition hover:brightness-110"
      >
        Share this pull
      </motion.button>

      {/* Portalled to <body> so it sits above the sticky nav (main has its own stacking context). */}
      {typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="flex w-full max-w-2xl flex-col gap-4 rounded-3xl border border-white/15 bg-panel p-4 sm:p-6"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-label="Share your pull"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black">Share your pull</h2>
                <button onClick={() => setOpen(false)} className="rounded-full px-3 py-1 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Close">
                  ✕
                </button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="Your pull card" width={1200} height={630} className="w-full rounded-2xl border border-white/10" />
              <div className="flex flex-wrap gap-2">
                {canNativeShare && (
                  <button
                    onClick={() => navigator.share({ title: 'CoinPack pull', text, url }).catch(() => {})}
                    className="flex-1 rounded-full bg-accent px-4 py-2.5 font-bold text-white hover:brightness-110"
                  >
                    Share…
                  </button>
                )}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-full bg-white px-4 py-2.5 text-center font-bold text-black hover:brightness-90"
                >
                  Post on X
                </a>
                <button onClick={copy} className="flex-1 rounded-full border border-white/25 px-4 py-2.5 font-bold hover:bg-white/10">
                  {copied ? 'Copied!' : 'Copy link'}
                </button>
                <button onClick={() => saveImage().catch(() => {})} className="flex-1 rounded-full border border-white/25 px-4 py-2.5 font-bold hover:bg-white/10">
                  Save image
                </button>
              </div>
              <input readOnly value={url} onFocus={(e) => e.target.select()} className="w-full truncate rounded-lg bg-black/30 px-3 py-2 text-xs text-white/60" aria-label="Share link" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
      )}
    </>
  );
}
