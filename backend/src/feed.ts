import { createPublicClient, http, parseAbiItem } from 'viem';
import { env, getDeployment, isLive, monadTestnet } from './config.js';
import { TIERS, type FeedItem, type Hex } from './types.js';

const POLL_MS = 2_000;
const MAX_ITEMS = 50;
// Monad testnet rejects eth_getLogs ranges over ~100 blocks; we halve on any error.
const MAX_CHUNK = 100n;
// Never scan further back than this (~2 h of Monad blocks), even if deployBlock is 0 or old.
const MAX_LOOKBACK = 20_000n;
// Catch up gradually so the public RPC doesn't rate-limit us (chain adds ~5 blocks per tick).
const MAX_CHUNKS_PER_TICK = 10;

export const packOpenedEvent = parseAbiItem(
  'event PackOpened(uint256 indexed requestId, address indexed buyer, uint256 pricePaid, uint8 tier, uint32 multiplierBps, uint256 totalValueWei, bytes32 seed, (address token, uint8 rarity, uint256 amount, uint256 valueWei)[10] pulls)',
);

const client = createPublicClient({ chain: monadTestnet, transport: http(env.rpcUrl) });

let items: FeedItem[] = []; // newest first
let vault: Hex | null = null;
let nextBlock: bigint | null = null;
let chunk = MAX_CHUNK;
const blockTimes = new Map<bigint, number>();

export function getRecentFeed(limit: number): FeedItem[] {
  return items.slice(0, limit);
}

async function blockTime(n: bigint): Promise<number> {
  let t = blockTimes.get(n);
  if (t === undefined) {
    t = Number((await client.getBlock({ blockNumber: n })).timestamp);
    blockTimes.set(n, t);
    if (blockTimes.size > 500) blockTimes.delete(blockTimes.keys().next().value!);
  }
  return t;
}

async function tick() {
  const dep = getDeployment();
  if (!isLive(dep)) return;

  const latest = await client.getBlockNumber();
  if (dep.packVault.toLowerCase() !== vault) {
    // New (or first) deployment: start over from its deploy block.
    vault = dep.packVault.toLowerCase() as Hex;
    items = [];
    const floor = latest > MAX_LOOKBACK ? latest - MAX_LOOKBACK : 0n;
    nextBlock = BigInt(dep.deployBlock || 0) > floor ? BigInt(dep.deployBlock) : floor;
    console.log(`[feed] watching ${vault} from block ${nextBlock}`);
  }

  for (let calls = 0; nextBlock! <= latest && calls < MAX_CHUNKS_PER_TICK; calls++) {
    const from = nextBlock!;
    const to = from + chunk - 1n < latest ? from + chunk - 1n : latest;
    let logs;
    try {
      logs = await client.getLogs({ address: vault, event: packOpenedEvent, fromBlock: from, toBlock: to, strict: true });
    } catch (err) {
      // Only shrink on range errors; anything else (rate limit, network) just retries next tick.
      if (chunk > 1n && /range|too large|limit exceeded/i.test(String(err))) { chunk /= 2n; continue; }
      throw err;
    }
    chunk = MAX_CHUNK;
    nextBlock = to + 1n;

    for (const log of logs) {
      const a = log.args;
      const requestId = a.requestId.toString();
      if (items.some((i) => i.requestId === requestId)) continue;
      items.unshift({
        requestId,
        buyer: a.buyer.toLowerCase() as Hex,
        tier: TIERS[a.tier] ?? 'CORE',
        multiplierBps: a.multiplierBps,
        totalValueWei: a.totalValueWei.toString(),
        openedAt: await blockTime(log.blockNumber),
      });
      console.log(`[feed] pack #${requestId} ${TIERS[a.tier]} ${a.multiplierBps} bps`);
    }
    if (items.length > MAX_ITEMS) items.length = MAX_ITEMS;
  }
}

let running = false;
export function startFeedPoller() {
  setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await tick();
    } catch (err) {
      console.warn('[feed]', (err as { shortMessage?: string }).shortMessage ?? (err as Error).message);
    } finally {
      running = false;
    }
  }, POLL_MS);
}
