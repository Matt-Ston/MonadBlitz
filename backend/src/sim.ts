// `pnpm sim [draws]`: Monte Carlo of the §3.3 draw using Math.random (same rules, not bit-exact with Solidity).
import { BOOSTED_TIERS, TIER_TABLE } from './odds.js';
import { TIERS, type Tier } from './types.js';

const N = Number(process.argv[2] || 200_000);
const RARITY_NAMES = ['Common', 'Rare', 'Epic', 'Legendary'];
// Value-split weight per rarity (§3.3 step 5). Try alternatives: RARITY_MUL=10,15,25,40 pnpm sim
const RARITY_MUL = (process.env.RARITY_MUL || '1,8,80,800').split(',').map(Number);
// Rarity roll cutoffs on r % 10000 (§3.3 step 4): Common below the 1st, Rare below the 2nd, Epic below the 3rd.
// Try alternatives: RARITY_CUTS=6000,8800,9800 pnpm sim
const [C_CUT, R_CUT, E_CUT] = (process.env.RARITY_CUTS || '7500,9500,9950').split(',').map(Number);

const rand = (n: number) => Math.floor(Math.random() * n);

function draw() {
  const t = rand(10_000);
  const tierIdx = TIER_TABLE.findIndex((row) => t < row.upperBound);
  const tier = TIERS[tierIdx];

  // Step 2: multiplier uniform in the tier's [min, max].
  const { minMultBps, maxMultBps } = TIER_TABLE[tierIdx];
  const multBps = minMultBps + rand(maxMultBps - minMultBps + 1);

  // Steps 4–5: 3–5 cards (IR-3), rarities and split weights (the last card is forced Legendary and boosted on
  // LEGENDARY/ULTRA_LEGENDARY packs).
  const rarities: number[] = [];
  const weights: number[] = [];
  const n = 3 + rand(3);
  for (let i = 0; i < n; i++) {
    const x = rand(10_000);
    let r = x < C_CUT ? 0 : x < R_CUT ? 1 : x < E_CUT ? 2 : 3;
    const boosted = i === n - 1 && BOOSTED_TIERS.includes(tier);
    if (boosted) r = 3;
    rarities.push(r);
    weights.push((50 + rand(101)) * RARITY_MUL[r] * (boosted ? 4 : 1));
  }
  const total = weights.reduce((a, b) => a + b, 0);
  const topShare = Math.max(...weights) / total;
  const values = weights.map((w) => (multBps / 10000) * (w / total)); // in units of pack price
  return { tier, multBps, rarities, topShare, values };
}

const tierCount = Object.fromEntries(TIERS.map((t) => [t, 0])) as Record<Tier, number>;
const rarityCount = [0, 0, 0, 0];
let totalCards = 0;
const mults = new Float64Array(N);
const rarityValue = [0, 0, 0, 0];
let epicPacks = 0;
let sum = 0, within5 = 0, profit = 0, legendaryPacks = 0, topShareSum = 0, totalValue = 0;

for (let k = 0; k < N; k++) {
  const d = draw();
  tierCount[d.tier]++;
  mults[k] = d.multBps;
  sum += d.multBps;
  if (d.multBps >= 9500 && d.multBps <= 10500) within5++;
  if (d.multBps > 10000) profit++;
  d.rarities.forEach((r, i) => {
    rarityCount[r]++;
    totalCards++;
    rarityValue[r] += d.values[i];
    totalValue += d.values[i];
  });
  if (d.rarities.includes(3)) legendaryPacks++;
  if (d.rarities.some((r) => r >= 2)) epicPacks++;
  topShareSum += d.topShare;
}
mults.sort();

const pct = (x: number) => `${(x * 100).toFixed(2)}%`;
const mult = (bps: number) => `${(bps / 10000).toFixed(3)}x`;
const q = (p: number) => mults[Math.min(N - 1, Math.floor(p * N))];

console.log(`CoinPack draw simulation: ${N.toLocaleString()} packs\n`);
console.log(`Expected value        ${mult(sum / N)}   (house edge ${pct(1 - sum / N / 10000)})`);
console.log(`Within ±5% of price   ${pct(within5 / N)}`);
console.log(`Pack beats its price  ${pct(profit / N)}`);
console.log(`Median multiplier     ${mult(q(0.5))}   (p5 ${mult(q(0.05))}, p95 ${mult(q(0.95))}, p99 ${mult(q(0.99))})`);
console.log(`Best / worst          ${mult(mults[N - 1])} / ${mult(mults[0])}\n`);

console.log('Tier             target    simulated');
TIER_TABLE.forEach((row) => {
  const label = row.tier.padEnd(15);
  console.log(`${label}  ${pct(row.probabilityBps / 10000).padStart(7)}   ${pct(tierCount[row.tier] / N).padStart(7)}`);
});

console.log(`\nRarity      cards    share of value   avg card value   (weights ${RARITY_MUL.join('/')})`);
rarityCount.forEach((c, r) =>
  console.log(
    `${RARITY_NAMES[r].padEnd(10)}  ${pct(c / totalCards).padStart(7)}  ${pct(rarityValue[r] / totalValue).padStart(14)}   ${(rarityValue[r] / c).toFixed(3).padStart(10)}x pack`,
  ),
);
console.log(`\nPacks with ≥1 Legendary  ${pct(legendaryPacks / N)}  (1 in ${Math.round(N / legendaryPacks)})`);
console.log(`Packs with ≥1 Epic+     ${pct(epicPacks / N)}  (1 in ${Math.round(N / epicPacks)})`);
console.log(`Avg share of value in the best card  ${pct(topShareSum / N)}`);
