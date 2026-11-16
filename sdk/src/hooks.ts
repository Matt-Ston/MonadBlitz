'use client';
import { useCallback, useState, useSyncExternalStore } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { parseEventLogs, toHex } from 'viem';
import { type Config, useAccount, useConfig, useReadContract, useSwitchChain, useWriteContract } from 'wagmi';
import { multicall, readContract, waitForTransactionReceipt } from 'wagmi/actions';
import { erc20Abi, packVaultAbi, priceOracleAbi } from './abi';
import { CHAIN_ID } from './chain';
import { BANK_SUPPORTED, PACK_VAULT, PRICE_ORACLE, TOKENS, tokenByAddress } from './contracts';
import {
  CATALOG, MOCK, MOCK_ADDRESS, MOCK_PACK_PRICES, ODDS, balances, feed, getDemoBoost, getMockBank, getMockPackPrice, getVersion,
  makeMockResult, mockBankAdd, mockBankTake, recordMockPull, setDemoBoost, setMockPackPrice, subscribe,
} from './mock';
import { TIERS } from './types';
import type { FeedItem, Hex, Holding, Odds, PackResult, Rarity, TokenInfo } from './types';

// Every hook has a mock and a real implementation. The branch is picked once at module load
// (bottom of this file), so the hook order inside a component never changes.

type OpenStatus = 'idle' | 'signing' | 'mining' | 'done' | 'error';
type ConnectionState = { address?: Hex; isConnected: boolean; isWrongChain: boolean; switchChain(): Promise<void> };
type OpenPackState = { open(): Promise<PackResult>; status: OpenStatus; error?: Error; last?: PackResult };
type OpenPacksState = { openMany(count: number): Promise<PackResult[]>; status: OpenStatus; error?: Error };
/**
 * IR-4 bank: deposit MON once, then open 1–10 packs per transaction paid from the balance (no MON sent per pack,
 * one signature and one gas charge for the whole batch). `supported` is false on vaults without the bank.
 */
export type BankState = {
  supported: boolean;
  balanceWei?: bigint;
  deposit(wei: bigint): Promise<void>;
  withdraw(wei: bigint): Promise<void>;
  openFromBank(count: number): Promise<PackResult[]>;
  status: OpenStatus;
  error?: Error;
};

const E18 = 10n ** 18n;

// ============================================================ mock mode

const useMockStore = () => useSyncExternalStore(subscribe, getVersion, getVersion);

function mockUseConnection(): ConnectionState {
  return { address: MOCK_ADDRESS, isConnected: true, isWrongChain: false, switchChain: async () => {} };
}

function mockUsePackPrice(): { priceWei?: bigint } {
  useMockStore();
  return { priceWei: getMockPackPrice() };
}

function mockUseCatalog(): { data?: TokenInfo[] } {
  return { data: CATALOG };
}

function mockUseOdds(): { data: Odds } {
  return { data: ODDS };
}

function mockUseOpenPack(): OpenPackState {
  const [status, setStatus] = useState<OpenStatus>('idle');
  const [error, setError] = useState<Error>();
  const [last, setLast] = useState<PackResult>();

  const open = useCallback(async () => {
    setError(undefined);
    setStatus('signing');
    await new Promise((r) => setTimeout(r, 300));
    setStatus('mining');
    await new Promise((r) => setTimeout(r, 1200));
    const res = makeMockResult();
    recordMockPull(res);
    setLast(res);
    setStatus('done');
    return res;
  }, []);

  return { open, status, error, last };
}

function mockUseOpenPacks(): OpenPacksState {
  const [status, setStatus] = useState<OpenStatus>('idle');
  const openMany = useCallback(async (count: number) => {
    setStatus('signing');
    await new Promise((r) => setTimeout(r, 300));
    setStatus('mining');
    await new Promise((r) => setTimeout(r, 1200));
    const results = Array.from({ length: count }, () => {
      const res = makeMockResult();
      recordMockPull(res);
      return res;
    });
    setStatus('done');
    return results;
  }, []);
  return { openMany, status };
}

function mockUseBank(): BankState {
  useMockStore();
  const [status, setStatus] = useState<OpenStatus>('idle');
  const [error, setError] = useState<Error>();
  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setError(undefined);
    try {
      const out = await fn();
      setStatus('done');
      return out;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      setStatus('error');
      throw err;
    }
  }, []);
  const deposit = useCallback((wei: bigint) => run(async () => {
    setStatus('signing');
    await new Promise((r) => setTimeout(r, 400));
    mockBankAdd(wei);
  }), [run]);
  const withdraw = useCallback((wei: bigint) => run(async () => {
    setStatus('signing');
    await new Promise((r) => setTimeout(r, 400));
    mockBankTake(wei);
  }), [run]);
  // Paid from the bank: no wallet step, straight to the draw.
  const openFromBank = useCallback((count: number) => run(async () => {
    mockBankTake(getMockPackPrice() * BigInt(count));
    setStatus('mining');
    await new Promise((r) => setTimeout(r, 900));
    return Array.from({ length: count }, () => {
      const res = makeMockResult();
      recordMockPull(res);
      return res;
    });
  }), [run]);
  return { supported: true, balanceWei: getMockBank(), deposit, withdraw, openFromBank, status, error };
}

function mockUseHoldings(address?: Hex): { data?: Holding[]; refetch(): void } {
  useMockStore();
  if (!address) return { data: undefined, refetch: () => {} };
  const data: Holding[] = CATALOG.filter((t) => (balances.get(t.address) ?? 0n) > 0n).map((t) => {
    const balance = balances.get(t.address)!;
    return {
      token: t.address,
      symbol: t.symbol,
      rarity: t.rarity,
      balance: balance.toString(),
      valueWei: ((balance * BigInt(t.priceWei)) / E18).toString(),
    };
  });
  return { data, refetch: () => {} };
}

function mockUseRecentFeed(): { data?: FeedItem[] } {
  useMockStore();
  return { data: feed };
}

// ============================================================ real mode

// Next only inlines literal process.env.NEXT_PUBLIC_* reads.
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

async function backendGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, { signal: AbortSignal.timeout(2000) });
  if (!res.ok) throw new Error(`backend ${path}: ${res.status}`);
  return (await res.json()) as T;
}

const HOLDINGS_KEY = ['coinpack', 'holdings'] as const;

const priceCall = (token: Hex) =>
  ({ address: PRICE_ORACLE, abi: priceOracleAbi, functionName: 'getPrice', args: [token] }) as const;

/** priceWei for the 12 tokens in catalog order, straight from the oracle the vault mints against. */
async function oraclePrices(config: Config): Promise<bigint[]> {
  const res = await multicall(config, {
    chainId: CHAIN_ID,
    allowFailure: false,
    contracts: TOKENS.map((t) => priceCall(t.address)),
  });
  return (res as unknown as readonly (readonly [bigint, bigint])[]).map((r) => r[0]);
}

// Packs opened in this tab, shown in the feed before the backend's poller sees them.
let localFeed: FeedItem[] = [];
const localListeners = new Set<() => void>();
const subscribeLocalFeed = (l: () => void) => {
  localListeners.add(l);
  return () => {
    localListeners.delete(l);
  };
};
const getLocalFeed = () => localFeed;
function prependLocalFeed(item: FeedItem): void {
  localFeed = [item, ...localFeed].slice(0, 20);
  localListeners.forEach((l) => l());
}

function realUseConnection(): ConnectionState {
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  return {
    address,
    isConnected,
    isWrongChain: isConnected && chainId !== CHAIN_ID,
    switchChain: async () => {
      await switchChainAsync({ chainId: CHAIN_ID });
    },
  };
}

function realUsePackPrice(): { priceWei?: bigint } {
  const { data } = useReadContract({ address: PACK_VAULT, abi: packVaultAbi, functionName: 'packPrice', chainId: CHAIN_ID });
  return { priceWei: data };
}

function realUseCatalog(): { data?: TokenInfo[] } {
  const config = useConfig();
  const q = useQuery({
    queryKey: ['coinpack', 'catalog'],
    refetchInterval: 60_000,
    queryFn: async (): Promise<TokenInfo[]> => {
      const [chain, backend] = await Promise.allSettled([oraclePrices(config), backendGet<TokenInfo[]>('/api/catalog')]);
      if (chain.status === 'rejected' && backend.status === 'rejected') throw chain.reason;
      const rows = backend.status === 'fulfilled' ? backend.value : [];
      return TOKENS.map((t, i) => {
        const row = rows.find((r) => r.symbol === t.symbol);
        const priceWei = chain.status === 'fulfilled' ? chain.value[i].toString() : (row?.priceWei ?? '0');
        return {
          index: t.index,
          address: t.address,
          symbol: t.symbol,
          name: t.name,
          decimals: 18 as const,
          rarity: t.rarity,
          color: t.color,
          priceWei,
          ...(row?.priceUsd !== undefined ? { priceUsd: row.priceUsd } : {}),
        };
      });
    },
  });
  return { data: q.data };
}

function realUseOdds(): { data: Odds } {
  const q = useQuery({
    queryKey: ['coinpack', 'odds'],
    queryFn: () => backendGet<Odds>('/api/odds'),
    retry: false,
    staleTime: 60_000,
  });
  return { data: q.data ?? ODDS };
}

/** Every PackOpened from our vault in a receipt, in log order (one per pack). */
function packResultsFromLogs(logs: Parameters<typeof parseEventLogs>[0]['logs'], txHash: Hex): PackResult[] {
  return parseEventLogs({ abi: packVaultAbi, eventName: 'PackOpened', logs })
    .filter((l) => l.address.toLowerCase() === PACK_VAULT)
    .map(({ args: a }) => ({
      requestId: a.requestId.toString(),
      buyer: a.buyer.toLowerCase() as Hex,
      txHash,
      openedAt: Math.floor(Date.now() / 1000),
      pricePaidWei: a.pricePaid.toString(),
      tier: TIERS[a.tier],
      multiplierBps: a.multiplierBps,
      totalValueWei: a.totalValueWei.toString(),
      seed: a.seed,
      pulls: a.pulls.map((p, slot) => ({
        slot,
        token: p.token.toLowerCase() as Hex,
        symbol: tokenByAddress(p.token)?.symbol ?? '???',
        rarity: p.rarity as Rarity,
        amount: p.amount.toString(),
        valueWei: p.valueWei.toString(),
      })),
    }));
}

function realUseOpenPack(): OpenPackState {
  const config = useConfig();
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const { priceWei } = realUsePackPrice();
  const [status, setStatus] = useState<OpenStatus>('idle');
  const [error, setError] = useState<Error>();
  const [last, setLast] = useState<PackResult>();

  const open = useCallback(async () => {
    setError(undefined);
    setStatus('signing');
    try {
      const value =
        priceWei ?? (await readContract(config, { address: PACK_VAULT, abi: packVaultAbi, functionName: 'packPrice', chainId: CHAIN_ID }));
      const userSeed = toHex(crypto.getRandomValues(new Uint8Array(32)));
      // No gas override: Monad bills the full gas limit, so the wallet/viem estimate is used as is.
      const txHash = await writeContractAsync({
        address: PACK_VAULT,
        abi: packVaultAbi,
        functionName: 'openPack',
        args: [userSeed],
        value,
        chainId: CHAIN_ID,
      });
      setStatus('mining');
      const receipt = await waitForTransactionReceipt(config, { hash: txHash, chainId: CHAIN_ID });
      if (receipt.status !== 'success') throw new Error(`Transaction reverted: ${txHash}`);
      const res = packResultsFromLogs(receipt.logs, txHash)[0];
      if (!res) throw new Error(`PackOpened event not found in ${txHash}`);
      prependLocalFeed({
        requestId: res.requestId,
        buyer: res.buyer,
        tier: res.tier,
        multiplierBps: res.multiplierBps,
        totalValueWei: res.totalValueWei,
        openedAt: res.openedAt,
      });
      void queryClient.invalidateQueries({ queryKey: HOLDINGS_KEY });
      setLast(res);
      setStatus('done');
      return res;
    } catch (e) {
      // Passed through unchanged: web matches on error.message (rejected, insufficient funds, revert names).
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      setStatus('error');
      throw err;
    }
  }, [config, queryClient, writeContractAsync, priceWei]);

  return { open, status, error, last };
}

function realUseHoldings(address?: Hex): { data?: Holding[]; refetch(): void } {
  const config = useConfig();
  const q = useQuery({
    queryKey: [...HOLDINGS_KEY, address],
    enabled: !!address,
    queryFn: async (): Promise<Holding[]> => {
      const res = (await multicall(config, {
        chainId: CHAIN_ID,
        allowFailure: false,
        contracts: [
          ...TOKENS.map((t) => ({ address: t.address, abi: erc20Abi, functionName: 'balanceOf', args: [address!] }) as const),
          ...TOKENS.map((t) => priceCall(t.address)),
        ],
      })) as unknown[];
      const out: Holding[] = [];
      TOKENS.forEach((t, i) => {
        const balance = res[i] as bigint;
        if (balance === 0n) return;
        const priceWei = (res[TOKENS.length + i] as readonly [bigint, bigint])[0];
        out.push({
          token: t.address,
          symbol: t.symbol,
          rarity: t.rarity,
          balance: balance.toString(),
          valueWei: ((balance * priceWei) / E18).toString(),
        });
      });
      return out;
    },
  });
  return {
    data: address ? q.data : undefined,
    refetch: () => {
      if (address) void q.refetch();
    },
  };
}

function realUseRecentFeed(): { data?: FeedItem[] } {
  const local = useSyncExternalStore(subscribeLocalFeed, getLocalFeed, getLocalFeed);
  const q = useQuery({
    queryKey: ['coinpack', 'feed'],
    queryFn: () => backendGet<FeedItem[]>('/api/feed/recent?limit=20'),
    refetchInterval: 3000,
    retry: false,
  });
  const seen = new Set<string>();
  const data = [...local, ...(q.data ?? [])]
    .filter((f) => (seen.has(f.requestId) ? false : (seen.add(f.requestId), true)))
    .sort((x, y) => Number(y.requestId) - Number(x.requestId))
    .slice(0, 20);
  return { data };
}

/** Real mode: the deployed vault opens one pack per transaction, so several packs are opened back to back. */
function realUseOpenPacks(): OpenPacksState {
  const single = realUseOpenPack();
  const openMany = useCallback(
    async (count: number) => {
      const out: PackResult[] = [];
      for (let i = 0; i < count; i++) out.push(await single.open());
      return out;
    },
    [single.open],
  );
  return { openMany, status: single.status, error: single.error };
}

function realUseBank(): BankState {
  const config = useConfig();
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [status, setStatus] = useState<OpenStatus>('idle');
  const [error, setError] = useState<Error>();
  const bank = useReadContract({
    address: PACK_VAULT, abi: packVaultAbi, functionName: 'bankOf', args: address ? [address] : undefined, chainId: CHAIN_ID,
    query: { enabled: BANK_SUPPORTED && !!address },
  });

  const send = useCallback(
    async (write: () => Promise<Hex>) => {
      if (!BANK_SUPPORTED) throw new Error('The bank arrives with the next contract deploy.');
      setError(undefined);
      setStatus('signing');
      try {
        const txHash = await write();
        setStatus('mining');
        const receipt = await waitForTransactionReceipt(config, { hash: txHash, chainId: CHAIN_ID });
        if (receipt.status !== 'success') throw new Error(`Transaction reverted: ${txHash}`);
        void bank.refetch();
        setStatus('done');
        return { receipt, txHash };
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        setStatus('error');
        throw err;
      }
    },
    [config, bank],
  );

  const deposit = useCallback(async (wei: bigint) => {
    await send(() => writeContractAsync({ address: PACK_VAULT, abi: packVaultAbi, functionName: 'deposit', value: wei, chainId: CHAIN_ID }));
  }, [send, writeContractAsync]);
  const withdraw = useCallback(async (wei: bigint) => {
    await send(() => writeContractAsync({ address: PACK_VAULT, abi: packVaultAbi, functionName: 'withdrawBank', args: [wei], chainId: CHAIN_ID }));
  }, [send, writeContractAsync]);
  const openFromBank = useCallback(async (count: number) => {
    const userSeed = toHex(crypto.getRandomValues(new Uint8Array(32)));
    const { receipt, txHash } = await send(() =>
      writeContractAsync({ address: PACK_VAULT, abi: packVaultAbi, functionName: 'openPacksFromBank', args: [BigInt(count), userSeed], chainId: CHAIN_ID }),
    );
    const results = packResultsFromLogs(receipt.logs, txHash);
    if (results.length === 0) throw new Error(`PackOpened event not found in ${txHash}`);
    for (const r of results) {
      prependLocalFeed({ requestId: r.requestId, buyer: r.buyer, tier: r.tier, multiplierBps: r.multiplierBps, totalValueWei: r.totalValueWei, openedAt: r.openedAt });
    }
    void queryClient.invalidateQueries({ queryKey: HOLDINGS_KEY });
    return results;
  }, [send, queryClient, writeContractAsync]);

  return { supported: BANK_SUPPORTED, balanceWei: bank.data, deposit, withdraw, openFromBank, status, error };
}

// ============================================================ §3.9 exports

export const useConnection: () => ConnectionState = MOCK ? mockUseConnection : realUseConnection;
export const usePackPrice: () => { priceWei?: bigint } = MOCK ? mockUsePackPrice : realUsePackPrice;
export const useCatalog: () => { data?: TokenInfo[] } = MOCK ? mockUseCatalog : realUseCatalog;
export const useOdds: () => { data: Odds } = MOCK ? mockUseOdds : realUseOdds;
export const useOpenPack: () => OpenPackState = MOCK ? mockUseOpenPack : realUseOpenPack;
export const useHoldings: (address?: Hex) => { data?: Holding[]; refetch(): void } = MOCK ? mockUseHoldings : realUseHoldings;
export const useRecentFeed: () => { data?: FeedItem[] } = MOCK ? mockUseRecentFeed : realUseRecentFeed;

/** Open several packs in one go. Results are in the order they were opened. */
export const useOpenPacks: () => OpenPacksState = MOCK ? mockUseOpenPacks : realUseOpenPacks;

/** IR-4 deposit bank. Mock mode always has it; real mode only once the vault is redeployed with it. */
export const useBank: () => BankState = MOCK ? mockUseBank : realUseBank;

/** Mock-mode-only knobs for demos: boosted odds and the pack price. They do nothing in real mode. */
export function useDemoSettings(): { demo: boolean; setDemo(on: boolean): void; prices: bigint[]; setPrice(wei: bigint): void } {
  useMockStore();
  return { demo: getDemoBoost(), setDemo: setDemoBoost, prices: MOCK_PACK_PRICES, setPrice: setMockPackPrice };
}

export { MOCK };
