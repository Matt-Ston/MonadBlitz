// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IPackVault} from "../src/interfaces/IPackVault.sol";
import {PriceOracle} from "../src/PriceOracle.sol";
import {PackVault} from "../src/PackVault.sol";
import {MockToken} from "../src/MockToken.sol";

/// oracle -> vault -> 12 tokens (minter = vault) -> catalog -> snapshot prices (§3.4).
contract Deploy is Script {
    // P2's published price-pusher address (§15.6). Override with UPDATER_ADDRESS.
    address constant DEFAULT_UPDATER = 0x1FD608aa75ec266B98002B3a0f9B2Ea1bd712784;

    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address updater = vm.envOr("UPDATER_ADDRESS", DEFAULT_UPDATER);

        string[12] memory names = [
            "Mock Doge", "Mock Cardano", "Mock XRP", "Mock Tron",
            "Mock Chainlink", "Mock Avalanche", "Mock Polkadot",
            "Mock Solana", "Mock BNB",
            "Mock Bitcoin", "Mock Ether", "Mock Monad"
        ];
        string[12] memory symbols =
            ["mDOGE", "mADA", "mXRP", "mTRX", "mLINK", "mAVAX", "mDOT", "mSOL", "mBNB", "mBTC", "mETH", "mMON"];
        uint8[12] memory rarities = [0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 3];
        // priceWei = usd / 0.05 * 1e18 = usd * 20e18
        uint256[12] memory prices = [
            uint256(4e18), 12e18, 40e18, 5e18,
            300e18, 400e18, 80e18,
            3000e18, 18000e18,
            1_900_000e18, 64000e18, 1e18
        ];

        vm.startBroadcast(pk);

        PriceOracle oracle = new PriceOracle(updater);
        PackVault vault = new PackVault(oracle, 0.1 ether);

        IPackVault.TokenInfo[] memory items = new IPackVault.TokenInfo[](12);
        address[] memory tokens = new address[](12);
        uint256[] memory priceList = new uint256[](12);
        for (uint256 i; i < 12; ++i) {
            MockToken t = new MockToken(names[i], symbols[i], address(vault));
            items[i] = IPackVault.TokenInfo(address(t), rarities[i]);
            tokens[i] = address(t);
            priceList[i] = prices[i];
        }
        vault.setCatalog(items);
        oracle.setPrices(tokens, priceList); // owner may set; prices must be > 0 before any openPack

        vm.stopBroadcast();

        console.log("priceOracle", address(oracle));
        console.log("packVault  ", address(vault));
        for (uint256 i; i < 12; ++i) console.log(symbols[i], tokens[i]);
    }
}
