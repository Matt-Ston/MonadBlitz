# contracts/ (Person 1)

Foundry project for PackVault, PriceOracle and 12 MockTokens on Monad testnet (chain 10143).

- `src/interfaces/IPackVault.sol`: frozen interface (ARCHITECTURE §3.5)
- `abi/*.json`: exported ABIs (`forge inspect <C> abi --json > abi/<C>.json`)
- `deployments/monad-testnet.json`: addresses. **Zero/placeholder until deploy is announced.**

## Setup
```
forge install OpenZeppelin/openzeppelin-contracts@v5.1.0 foundry-rs/forge-std --no-git
forge test
```

## Deploy
`contracts/.env` (gitignored): `DEPLOYER_PRIVATE_KEY`, optional `UPDATER_ADDRESS` (defaults to P2's `0x1FD6…2784`).
```
source .env && forge script script/Deploy.s.sol --rpc-url $MONAD_RPC_URL --broadcast
```

## Notes for other folders
- `drawMultiplier(bytes32 seed)` is a public pure helper (steps 1-2 of §3.3); not in the shared interface.
- Oracle `setPrices` accepts the updater **or** the owner. Owner can `setUpdater`.
- `openPack` reverts `ZeroPrice(token)` if a pulled token has no oracle price.
- **Gas:** the draw uses block data, so gas varies 263k-535k and differs between estimate and inclusion. `openPack` requires `gasleft() >= minGasLeft` (600k, owner-settable) so `eth_estimateGas` always returns enough. Let viem estimate; don't hardcode a lower limit (reverts `NotEnoughGas`).
- Verified on a local anvil: Deploy.s.sol runs clean, 6 packs opened with auto gas estimation all succeeded.
