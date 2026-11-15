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
