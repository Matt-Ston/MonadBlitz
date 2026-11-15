'use client';
import { ConnectButton, MOCK } from '@/lib/sdk';

/**
 * Styles a wrapper around the sdk's ConnectButton without relying on its markup.
 * Mock: the sdk renders a bare button, so the wrapper supplies the pill look.
 * Real: RainbowKit styles itself, so the wrapper only handles layout.
 */
export function Connect() {
  if (!MOCK) {
    return (
      <div className="inline-flex items-center">
        <ConnectButton />
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-panel px-4 py-2 text-sm font-medium text-white/90">
      <ConnectButton />
    </div>
  );
}
