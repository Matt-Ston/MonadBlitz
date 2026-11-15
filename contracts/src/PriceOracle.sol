// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IPriceOracle} from "./interfaces/IPackVault.sol";

/// Prices are MON wei per 1 whole token. Updated by the backend (updater) or the owner.
contract PriceOracle is IPriceOracle, Ownable {
    struct Price { uint192 priceWei; uint64 updatedAt; }

    address public updater;
    mapping(address => Price) internal _prices;

    error NotUpdater();
    error LengthMismatch();

    event PricesUpdated(uint256 count, uint64 at);
    event UpdaterChanged(address updater);

    constructor(address updater_) Ownable(msg.sender) {
        updater = updater_;
    }

    function setUpdater(address updater_) external onlyOwner {
        updater = updater_;
        emit UpdaterChanged(updater_);
    }

    function setPrices(address[] calldata tokens, uint256[] calldata pricesWei) external {
        if (msg.sender != updater && msg.sender != owner()) revert NotUpdater();
        if (tokens.length != pricesWei.length) revert LengthMismatch();
        uint64 nowTs = uint64(block.timestamp);
        for (uint256 i; i < tokens.length; ++i) {
            _prices[tokens[i]] = Price(uint192(pricesWei[i]), nowTs);
        }
        emit PricesUpdated(tokens.length, nowTs);
    }

    function getPrice(address token) external view returns (uint256 priceWei, uint64 updatedAt) {
        Price memory p = _prices[token];
        return (p.priceWei, p.updatedAt);
    }
}
