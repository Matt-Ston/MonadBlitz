// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, Vm} from "forge-std/Test.sol";
import {IPackVault} from "../src/interfaces/IPackVault.sol";
import {PriceOracle} from "../src/PriceOracle.sol";
import {PackVault} from "../src/PackVault.sol";
import {MockToken} from "../src/MockToken.sol";

contract PackVaultTest is Test {
    PriceOracle oracle;
    PackVault vault;
    MockToken[12] toks;
    address user = address(0xBEEF);

    function setUp() public {
        oracle = new PriceOracle(address(this));
        vault = new PackVault(oracle, 0.1 ether);
        uint8[12] memory rar = [0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 3];
        uint256[12] memory px = [
            uint256(4e18), 12e18, 40e18, 5e18, 300e18, 400e18, 80e18, 3000e18, 18000e18, 1_900_000e18, 64000e18, 1e18
        ];
        IPackVault.TokenInfo[] memory items = new IPackVault.TokenInfo[](12);
        address[] memory addrs = new address[](12);
        uint256[] memory prices = new uint256[](12);
        for (uint256 i; i < 12; ++i) {
            toks[i] = new MockToken("Mock", "M", address(vault));
            items[i] = IPackVault.TokenInfo(address(toks[i]), rar[i]);
            addrs[i] = address(toks[i]);
            prices[i] = px[i];
        }
        vault.setCatalog(items);
        oracle.setPrices(addrs, prices);
        vm.deal(user, 10 ether);
    }

    // (a) right payment mints 10 pulls whose valueWei sum to totalValueWei
    function test_openPack_mintsAndSums() public {
        vm.recordLogs();
        vm.prank(user, user);
        uint256 id = vault.openPack{value: 0.1 ether}(bytes32(uint256(1)));
        assertEq(id, 1);
        assertEq(vault.nextRequestId(), 2);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 sig = keccak256(
            "PackOpened(uint256,address,uint256,uint8,uint32,uint256,bytes32,(address,uint8,uint256,uint256)[10])"
        );
        bool found;
        for (uint256 i; i < logs.length; ++i) {
            if (logs[i].topics[0] != sig) continue;
            found = true;
            (,,, uint256 total,, IPackVault.Pull[10] memory pulls) =
                abi.decode(logs[i].data, (uint256, uint8, uint32, uint256, bytes32, IPackVault.Pull[10]));
            uint256 sum;
            for (uint256 j; j < 10; ++j) {
                sum += pulls[j].valueWei;
                assertGt(MockToken(pulls[j].token).balanceOf(user), 0);
            }
            assertEq(sum, total);
        }
        assertTrue(found);
    }

    // (b) wrong payment reverts
    function test_wrongPayment_reverts() public {
        vm.prank(user, user);
        vm.expectRevert(IPackVault.WrongPayment.selector);
        vault.openPack{value: 0.05 ether}(bytes32(0));
    }

    // (c) average multiplier over 2,000 seeds lands in [0.97, 1.0]
    function test_averageMultiplier() public view {
        uint256 sum;
        for (uint256 i; i < 2000; ++i) {
            (, uint32 m) = vault.drawMultiplier(keccak256(abi.encode(i)));
            sum += m;
        }
        uint256 avg = sum / 2000;
        assertGe(avg, 9700);
        assertLe(avg, 10000);
    }
}
