// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IPackVault, IPriceOracle} from "./interfaces/IPackVault.sol";
import {MockToken} from "./MockToken.sol";

/// Single-transaction pack draw (ARCHITECTURE.md §3.3). Demo-grade randomness, testnet only.
contract PackVault is IPackVault, Ownable {
    IPriceOracle public immutable oracle;
    uint256 public packPrice;
    uint256 public nextRequestId = 1;
    /// The draw depends on block data, so gas used differs between eth_estimateGas and inclusion
    /// (measured 281k-535k). Requiring the worst case up front makes wallet estimates always succeed.
    uint256 public minGasLeft = 600_000;

    TokenInfo[] internal _catalog;
    address[][4] internal _byRarity; // rarity => token addresses, catalog order

    error CatalogAlreadySet();
    error CatalogEmpty();
    error ZeroPrice(address token);
    error NotEnoughGas();

    constructor(IPriceOracle oracle_, uint256 packPrice_) Ownable(msg.sender) {
        oracle = oracle_;
        packPrice = packPrice_;
    }

    // ---------------------------------------------------------------- admin

    /// One-time: register the 12 tokens in §3.4 order.
    function setCatalog(TokenInfo[] calldata items) external onlyOwner {
        if (_catalog.length != 0) revert CatalogAlreadySet();
        for (uint256 i; i < items.length; ++i) {
            _catalog.push(items[i]);
            _byRarity[items[i].rarity].push(items[i].token);
        }
    }

    function setPackPrice(uint256 price) external onlyOwner {
        packPrice = price;
    }

    function setMinGasLeft(uint256 g) external onlyOwner {
        minGasLeft = g;
    }

    function withdraw(address payable to) external onlyOwner {
        (bool ok,) = to.call{value: address(this).balance}("");
        require(ok, "withdraw failed");
    }

    // ---------------------------------------------------------------- views

    function catalog() external view returns (TokenInfo[] memory) {
        return _catalog;
    }

    /// Steps 1-2 of §3.3, exposed for tests and odds checks.
    function drawMultiplier(bytes32 seed) public pure returns (Tier tier, uint32 multBps) {
        uint256 t = _r(seed, 0) % 10000;
        uint256 R = _r(seed, 1);
        if (t < 500) {
            tier = Tier.BIG_LOSS;
            multBps = uint32(3000 + R % 4001);
        } else if (t < 9700) {
            tier = Tier.CORE;
            uint256 S;
            for (uint256 j; j < 12; ++j) S += (R >> (16 * j)) & 0xFFFF;
            int256 d = ((int256(S) - 393210) * 200) / 65536; // truncates toward zero
            multBps = uint32(uint256(9800 + d));
        } else if (t < 9950) {
            tier = Tier.BIG_WIN;
            multBps = uint32(13000 + R % 7001);
        } else {
            tier = Tier.JACKPOT;
            multBps = uint32(30000 + R % 20001);
        }
    }

    // ---------------------------------------------------------------- open

    function openPack(bytes32 userSeed) external payable returns (uint256 requestId) {
        if (gasleft() < minGasLeft) revert NotEnoughGas();
        uint256 price = packPrice;
        if (msg.value != price) revert WrongPayment();
        if (msg.sender != tx.origin) revert NoContracts();
        if (_catalog.length == 0) revert CatalogEmpty();

        requestId = nextRequestId++;
        bytes32 seed = keccak256(
            abi.encode(blockhash(block.number - 1), block.prevrandao, block.timestamp, userSeed, msg.sender, requestId)
        );

        (Tier tier, uint32 multBps) = drawMultiplier(seed);
        uint256 totalValueWei = price * multBps / 10000;
        Pull[10] memory pulls = _buildPulls(seed, tier, totalValueWei);

        for (uint256 i; i < 10; ++i) {
            MockToken(pulls[i].token).mint(msg.sender, pulls[i].amount);
        }

        emit PackOpened(requestId, msg.sender, price, tier, multBps, totalValueWei, seed, pulls);
    }

    // ---------------------------------------------------------------- internals

    function _r(bytes32 seed, uint256 k) internal pure returns (uint256) {
        return uint256(keccak256(abi.encode(seed, k)));
    }

    /// Steps 4-5 of §3.3.
    function _buildPulls(bytes32 seed, Tier tier, uint256 totalValueWei) internal view returns (Pull[10] memory pulls) {
        bool win = tier == Tier.BIG_WIN || tier == Tier.JACKPOT;
        uint256[10] memory w;
        uint256 sumW;

        for (uint256 i; i < 10; ++i) {
            uint8 rarity;
            if (i == 9 && win) {
                rarity = 3;
            } else {
                uint256 x = _r(seed, 10 + i) % 10000;
                rarity = x < 6000 ? 0 : x < 8800 ? 1 : x < 9800 ? 2 : 3;
            }
            address[] storage pool = _byRarity[rarity];
            pulls[i].token = pool[_r(seed, 30 + i) % pool.length];
            pulls[i].rarity = rarity;

            uint256 mul = rarity == 0 ? 10 : rarity == 1 ? 15 : rarity == 2 ? 25 : 40;
            w[i] = (50 + _r(seed, 50 + i) % 101) * mul;
            if (i == 9 && win) w[i] *= 4;
            sumW += w[i];
        }

        uint256 assigned;
        for (uint256 i; i < 10; ++i) {
            uint256 v = i < 9 ? totalValueWei * w[i] / sumW : totalValueWei - assigned;
            assigned += v;
            (uint256 priceWei,) = oracle.getPrice(pulls[i].token);
            if (priceWei == 0) revert ZeroPrice(pulls[i].token);
            pulls[i].valueWei = v;
            pulls[i].amount = v * 1e18 / priceWei;
        }
    }

    receive() external payable {}
}
