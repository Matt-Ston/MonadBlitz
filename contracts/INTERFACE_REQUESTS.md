# Interface requests from Person 1

## IR-2: Six pack tiers with more spread-out odds (§3.3 steps 1–2, §3.5 `Tier`, §3.7 `Tier`)

**Status:** **agreed by the team (IR-1 card odds bundled).** sdk, backend, web and the doc (v3.0) are updated on `main`. **Waiting on Person 1:** merge `odds-6tier`, redeploy, commit the new `deployments/monad-testnet.json`. Until then the live vault still emits the old 4-tier indices (0–3), which the updated apps would read as COMMON–EPIC, so redeploy before the demo.

**Why:** today 92% of packs are "Core", so almost every pack feels the same. Six tiers spread the outcomes out: about 1 pack in 3 is a profit, and each tier has its own name for the reveal.

### The new pack tiers

Tier from `t = r(0) % 10000`; multiplier uniform in `[min, max]`: `multBps = min + r(1) % (max - min + 1)`.

| Enum | Tier | Condition | Chance | Pack value |
|---|---|---|---|---|
| 0 | COMMON | `t < 4500` | 45% | 0.40x – 0.80x |
| 1 | UNCOMMON | `t < 7500` | 30% | 0.80x – 1.05x |
| 2 | RARE | `t < 9100` | 16% | 1.05x – 1.40x |
| 3 | EPIC | `t < 9700` | 6% (1 in 17) | 1.40x – 2.20x |
| 4 | LEGENDARY | `t < 9950` | 2.5% (1 in 40) | 2.20x – 4.00x |
| 5 | ULTRA_LEGENDARY | else | 0.5% (1 in 200) | 5.00x – 10.00x |

**Simulated on the contract itself (100k draws of `drawMultiplier`):** tier frequencies 45.2 / 29.8 / 16.0 / 6.0 / 2.6 / 0.5%; **EV 0.967x (house edge ≈ 3.3%)**; **31% of packs profit**; 12% within ±5% of price.

Slot-9 rule (forced Legendary card, `w_9 *= 4`) now applies to **LEGENDARY and ULTRA_LEGENDARY** packs (was BIG_WIN/JACKPOT; same 3% of packs).

### Bundled: IR-1 card odds (drop if unwanted)
The same redeploy also adopts Person 2's IR-1, which the sdk mock, backend sim and web already use: card cutoffs `7500 / 9500 / 9950`, `RARITY_MUL = [4, 12, 60, 250]`. Card rarities stay 4 (Common/Rare/Epic/Legendary), so `Pull.rarity` is unchanged.

### What does NOT change
Event/struct/function shapes (`Tier` is still a `uint8` in the ABI, so the `PackOpened` signature and topic are identical), card rarities, pack price, gas guard, oracle.

### Changes per person
**Person 1 (me):** merge `odds-6tier`, redeploy (~0.9 MON, please send a top-up to `0xD7ce98B3bADaE40b53f561787018bbACA2646B70`), commit new `deployments/monad-testnet.json`.

**Person 4, `sdk/src/types.ts` + `mock.ts`:**
```ts
export type Tier = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'ULTRA_LEGENDARY'; // enum index 0..5
export const TIERS: Tier[] = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'ULTRA_LEGENDARY'];
```
Mock `open()`: pick tiers with variety and multipliers inside the ranges above. Odds fallback constant: table above.

**Person 2, `backend/src/odds.ts` + `sim.ts` + `PITCH.md`:** `TIER_TABLE` rows from the table (`probabilityBps` 4500/3000/1600/600/250/50, min/max as above, mean = midpoint: 6000/9250/12250/18000/31000/75000); `EXPECTED_VALUE_BPS` ≈ 9670; `WITHIN_FIVE_PCT_BPS` ≈ 1190. Pitch: "1 in 3 packs beats its price, 1 in 200 is a 5–10x Ultra Legendary, house edge ~3%".

**Person 3, web:** tier banners/effects keyed on the new names (e.g. Common muted "rough pack", Rare/Epic glow, Legendary confetti, Ultra Legendary big confetti + shake); Odds page table from `useOdds` (6 rows).

**Doc:** §3.3 steps 1–2 and 4–5, §3.5 enum, §3.7 `Tier`/`TIERS`; bump to v3.0.

### Cost
~15 min for Person 1 after the yes. Others: a few lines each. Packs opened on the old vault won't show in the new feed.

---

## IR-3: 3–5 cards per pack instead of 10 (§3.3 steps 4–5, §3.5 event)

**Status:** **agreed by the team** (requested by Person 2 on 2026-11-15). sdk, backend, web and doc are updated on `main` and accept both the old `Pull[10]` event and the new `Pull[]` event, so nothing breaks before or after the redeploy. **Waiting on Person 1:** apply this on top of `odds-6tier` and ship IR-2 + IR-3 in **one** redeploy.

**Why:** fewer, bigger cards make each flip matter. Each card is worth more and gets its own rarity animation.

**Effect** (`pnpm sim` in `backend/`): a Legendary card turns up in **1 pack in 20** (was 1 in 13 with 10 cards) and averages **2.6x the pack**; the best card holds about half the pack's value. EV and tier odds unchanged.

**Rule:** `n = 3 + r(2) % 3` cards (3, 4 or 5, equal chance; `r(2)` is unused today). Pack value, tiers, multipliers, EV, card rarity odds (IR-1) and value weights are unchanged. The forced Legendary + `w *= 4` boost moves from slot 9 to the **last slot `n - 1`** (on LEGENDARY / ULTRA_LEGENDARY packs). Fewer mints also means less gas per pack.

### `contracts/src/interfaces/IPackVault.sol`
```solidity
event PackOpened(
    uint256 indexed requestId, address indexed buyer, uint256 pricePaid, Tier tier,
    uint32 multiplierBps, uint256 totalValueWei, bytes32 seed,
    Pull[] pulls            // was Pull[10]; length 3..5
);
```
This changes the event signature (topic0). Apps on `main` already listen for both.

### `contracts/src/PackVault.sol`
```solidity
// openPack
Pull[] memory pulls = _buildPulls(seed, tier, totalValueWei);
for (uint256 i; i < pulls.length; ++i) {
    MockToken(pulls[i].token).mint(msg.sender, pulls[i].amount);
}

// _buildPulls (keep IR-2's `win` = LEGENDARY || ULTRA_LEGENDARY and IR-1's cutoffs / RARITY_MUL)
function _buildPulls(bytes32 seed, Tier tier, uint256 totalValueWei) internal view returns (Pull[] memory pulls) {
    uint256 n = 3 + _r(seed, 2) % 3;
    uint256 last = n - 1;
    pulls = new Pull[](n);
    uint256[] memory w = new uint256[](n);
    uint256 sumW;
    for (uint256 i; i < n; ++i) {
        // same body as today, with `i == 9` replaced by `i == last`
    }
    uint256 assigned;
    for (uint256 i; i < n; ++i) {
        uint256 v = i < last ? totalValueWei * w[i] / sumW : totalValueWei - assigned;
        // ... rest unchanged
    }
}
```

### Tests / deploy
- Update tests: `pulls.length` is in `[3, 5]`; values still sum to `totalValueWei`; on LEGENDARY/ULTRA packs `pulls[n-1].rarity == 3`.
- `minGasLeft` (600k, sized for 10 mints) can be lowered to roughly 60% if gas tests agree; leaving it is safe.
- Regenerate the ABI, redeploy (with IR-2), commit `deployments/monad-testnet.json` with the new `deployBlock`.

---

## IR-4: Pack bank (deposit once, open many packs per transaction) (§3.5, §3.6)

**Status:** **requested by the team** (Person 2, 2026-11-15). sdk and web are done on `main`: mock mode has a working bank; real mode shows it automatically once `deployments/monad-testnet.json` has `"bank": true`. **Waiting on Person 1:** add this to the same redeploy as IR-2 + IR-3.

**Why (gas):** today every pack is its own transaction carrying 0.1 MON. With a bank the player deposits once, then `openPacksFromBank(5, seed)` opens 5 packs in **one** transaction with no value attached: one signature, one 21k base cost and one wallet gas-limit buffer instead of five (Monad bills the full gas limit, so padding per tx is real money). The per-pack draw and mint cost is unchanged; the saving is the per-transaction overhead and the popups.

### `PackVault.sol`
```solidity
mapping(address => uint256) public bankOf;
uint256 public totalBanked;                    // players' money, never the house's
uint256 public constant MAX_BATCH = 10;

event Deposited(address indexed user, uint256 amount);
event Withdrawn(address indexed user, uint256 amount);
error InsufficientBank();
error BadCount();

function deposit() external payable {
    bankOf[msg.sender] += msg.value;
    totalBanked += msg.value;
    emit Deposited(msg.sender, msg.value);
}

function withdrawBank(uint256 amount) external {
    if (amount > bankOf[msg.sender]) revert InsufficientBank();
    bankOf[msg.sender] -= amount;                 // effects before the call
    totalBanked -= amount;
    (bool ok,) = msg.sender.call{value: amount}("");
    require(ok, "withdraw failed");
    emit Withdrawn(msg.sender, amount);
}

function openPacksFromBank(uint256 count, bytes32 userSeed) external returns (uint256 firstRequestId) {
    if (count == 0 || count > MAX_BATCH) revert BadCount();
    if (gasleft() < minGasLeft * count) revert NotEnoughGas();
    if (msg.sender != tx.origin) revert NoContracts();
    uint256 cost = packPrice * count;
    if (cost > bankOf[msg.sender]) revert InsufficientBank();
    bankOf[msg.sender] -= cost;
    totalBanked -= cost;                          // the pack price now belongs to the house
    firstRequestId = nextRequestId;
    for (uint256 i; i < count; ++i) _open(keccak256(abi.encode(userSeed, i)), packPrice);
}

// openPack keeps its behaviour, refactored to share the draw:
function openPack(bytes32 userSeed) external payable returns (uint256) {
    if (gasleft() < minGasLeft) revert NotEnoughGas();
    if (msg.value != packPrice) revert WrongPayment();
    if (msg.sender != tx.origin) revert NoContracts();
    return _open(userSeed, packPrice);
}

function _open(bytes32 userSeed, uint256 price) internal returns (uint256 requestId) {
    if (_catalog.length == 0) revert CatalogEmpty();
    requestId = nextRequestId++;
    bytes32 seed = keccak256(abi.encode(blockhash(block.number - 1), block.prevrandao, block.timestamp, userSeed, msg.sender, requestId));
    // ... unchanged: drawMultiplier, _buildPulls, mint, emit PackOpened (one event per pack)
}

// The owner sweep must leave players' deposits alone:
function withdraw(address payable to) external onlyOwner {
    (bool ok,) = to.call{value: address(this).balance - totalBanked}("");
    require(ok, "withdraw failed");
}
```

### Deployment file
Add `"bank": true` to `deployments/monad-testnet.json`. The sdk reads it (`BANK_SUPPORTED`) to show the bank in real mode.

### Tests
- deposit → `bankOf` and `totalBanked` go up; withdrawBank sends MON back and reverts with `InsufficientBank` above the balance.
- `openPacksFromBank(5, s)` emits 5 `PackOpened` with consecutive request ids, debits exactly `5 * packPrice`, and reverts on `count` 0 or 11.
- owner `withdraw` can't touch `totalBanked`.
