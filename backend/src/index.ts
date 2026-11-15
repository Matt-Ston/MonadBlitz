import cors from '@fastify/cors';
import Fastify from 'fastify';
import { env, getDeployment, isLive } from './config.js';
import { getRecentFeed, startFeedPoller } from './feed.js';
import { getOdds } from './odds.js';
import { getCatalog, pricesUpdatedAt, startPriceLoop } from './prices.js';

const app = Fastify({ logger: { level: 'warn' } });
await app.register(cors, { origin: true });

app.get('/api/health', async () => ({ ok: true, pricesUpdatedAt: pricesUpdatedAt() }));
app.get('/api/catalog', async () => getCatalog());
app.get('/api/odds', async () => getOdds());
app.get<{ Querystring: { limit?: string } }>('/api/feed/recent', async (req) => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  return getRecentFeed(limit);
});

startPriceLoop();
startFeedPoller();

await app.listen({ port: env.port, host: '0.0.0.0' });
const dep = getDeployment();
console.log(`[backend] listening on http://localhost:${env.port}`);
console.log(isLive(dep)
  ? `[backend] using deployment: vault ${dep.packVault}`
  : '[backend] no live deployment yet; serving placeholder addresses (picks up contracts/deployments/monad-testnet.json on change)');
