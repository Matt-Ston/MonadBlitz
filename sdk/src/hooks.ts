'use client';
import { useCallback, useState, useSyncExternalStore } from 'react';
import { CATALOG, MOCK, MOCK_ADDRESS, ODDS, PACK_PRICE, balances, feed, getVersion, makeMockResult, recordMockPull, subscribe } from './mock';
import type { FeedItem, Hex, Holding, Odds, PackResult, TokenInfo } from './types';

// Real mode (on-chain reads, writeContract, backend fetches) lands once contracts/ and
// backend §3.8 are reachable. Every hook here is mock-backed for now; signatures match §3.9
// so swapping web's import from the local stub to this package is a no-op.

const useStore = () => useSyncExternalStore(subscribe, getVersion, getVersion);

export function useConnection(): { address?: Hex; isConnected: boolean; isWrongChain: boolean; switchChain(): Promise<void> } {
  return { address: MOCK_ADDRESS, isConnected: true, isWrongChain: false, switchChain: async () => {} };
}

export function usePackPrice(): { priceWei?: bigint } {
  return { priceWei: PACK_PRICE };
}

export function useCatalog(): { data?: TokenInfo[] } {
  return { data: CATALOG };
}

export function useOdds(): { data: Odds } {
  return { data: ODDS };
}

export function useOpenPack(): {
  open(): Promise<PackResult>;
  status: 'idle' | 'signing' | 'mining' | 'done' | 'error';
  error?: Error;
  last?: PackResult;
} {
  const [status, setStatus] = useState<'idle' | 'signing' | 'mining' | 'done' | 'error'>('idle');
  const [error, setError] = useState<Error>();
  const [last, setLast] = useState<PackResult>();

  const open = useCallback(async () => {
    setError(undefined);
    setStatus('signing');
    try {
      await new Promise((r) => setTimeout(r, 300));
      setStatus('mining');
      await new Promise((r) => setTimeout(r, 1200));
      const res = makeMockResult();
      recordMockPull(res);
      setLast(res);
      setStatus('done');
      return res;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('open pack failed');
      setError(err);
      setStatus('error');
      throw err;
    }
  }, []);

  return { open, status, error, last };
}

export function useHoldings(address?: Hex): { data?: Holding[]; refetch(): void } {
  useStore();
  if (!address) return { data: undefined, refetch: () => {} };
  const data: Holding[] = CATALOG.filter((t) => (balances.get(t.address) ?? 0n) > 0n).map((t) => {
    const balance = balances.get(t.address)!;
    return {
      token: t.address,
      symbol: t.symbol,
      rarity: t.rarity,
      balance: balance.toString(),
      valueWei: ((balance * BigInt(t.priceWei)) / 10n ** 18n).toString(),
    };
  });
  return { data, refetch: () => {} };
}

export function useRecentFeed(): { data?: FeedItem[] } {
  useStore();
  return { data: feed };
}

export { MOCK };
