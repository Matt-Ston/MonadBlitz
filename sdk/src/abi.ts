// Typed ABIs (ARCHITECTURE §3.5). `as const` so viem decodes events and errors with types.
// No React/wagmi imports here: the Node backend may import this file.

const pullComponents = [
  { name: 'token', type: 'address' },
  { name: 'rarity', type: 'uint8' },
  { name: 'amount', type: 'uint256' },
  { name: 'valueWei', type: 'uint256' },
] as const;

export const packVaultAbi = [
  { type: 'function', name: 'packPrice', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'nextRequestId', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  {
    type: 'function', name: 'catalog', stateMutability: 'view', inputs: [],
    outputs: [{ name: '', type: 'tuple[]', components: [{ name: 'token', type: 'address' }, { name: 'rarity', type: 'uint8' }] }],
  },
  {
    type: 'function', name: 'openPack', stateMutability: 'payable',
    inputs: [{ name: 'userSeed', type: 'bytes32' }],
    outputs: [{ name: 'requestId', type: 'uint256' }],
  },
  // IR-3: 3–5 cards per pack (`Pull[]`). The `Pull[10]` variant below is the pre-IR-3 vault; keeping both means
  // decoding works before and after Person 1's redeploy (viem matches each log by its own topic0).
  {
    type: 'event', name: 'PackOpened', anonymous: false,
    inputs: [
      { name: 'requestId', type: 'uint256', indexed: true },
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'pricePaid', type: 'uint256', indexed: false },
      { name: 'tier', type: 'uint8', indexed: false },
      { name: 'multiplierBps', type: 'uint32', indexed: false },
      { name: 'totalValueWei', type: 'uint256', indexed: false },
      { name: 'seed', type: 'bytes32', indexed: false },
      { name: 'pulls', type: 'tuple[]', indexed: false, components: pullComponents },
    ],
  },
  {
    type: 'event', name: 'PackOpened', anonymous: false,
    inputs: [
      { name: 'requestId', type: 'uint256', indexed: true },
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'pricePaid', type: 'uint256', indexed: false },
      { name: 'tier', type: 'uint8', indexed: false },
      { name: 'multiplierBps', type: 'uint32', indexed: false },
      { name: 'totalValueWei', type: 'uint256', indexed: false },
      { name: 'seed', type: 'bytes32', indexed: false },
      { name: 'pulls', type: 'tuple[10]', indexed: false, components: pullComponents },
    ],
  },
  // IR-4 bank (only on vaults whose deployment file has `"bank": true`; see BANK_SUPPORTED).
  { type: 'function', name: 'bankOf', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'deposit', stateMutability: 'payable', inputs: [], outputs: [] },
  { type: 'function', name: 'withdrawBank', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  {
    type: 'function', name: 'openPacksFromBank', stateMutability: 'nonpayable',
    inputs: [{ name: 'count', type: 'uint256' }, { name: 'userSeed', type: 'bytes32' }],
    outputs: [{ name: 'firstRequestId', type: 'uint256' }],
  },
  { type: 'error', name: 'InsufficientBank', inputs: [] },
  { type: 'error', name: 'BadCount', inputs: [] },
  { type: 'error', name: 'WrongPayment', inputs: [] },
  { type: 'error', name: 'NoContracts', inputs: [] },
  { type: 'error', name: 'NotEnoughGas', inputs: [] },
  { type: 'error', name: 'CatalogEmpty', inputs: [] },
  { type: 'error', name: 'ZeroPrice', inputs: [{ name: 'token', type: 'address' }] },
] as const;

export const priceOracleAbi = [
  {
    type: 'function', name: 'getPrice', stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ name: 'priceWei', type: 'uint256' }, { name: 'updatedAt', type: 'uint64' }],
  },
  {
    type: 'function', name: 'setPrices', stateMutability: 'nonpayable',
    inputs: [{ name: 'tokens', type: 'address[]' }, { name: 'pricesWei', type: 'uint256[]' }],
    outputs: [],
  },
  { type: 'function', name: 'updater', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'address' }] },
] as const;

export const erc20Abi = [
  {
    type: 'function', name: 'balanceOf', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;
