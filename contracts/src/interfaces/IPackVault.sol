// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPackVault {
    enum Tier { BIG_LOSS, CORE, BIG_WIN, JACKPOT }

    struct Pull {
        address token;
        uint8   rarity;    // 0 Common, 1 Rare, 2 Epic, 3 Legendary
        uint256 amount;    // token wei
        uint256 valueWei;  // MON wei at draw-time price
    }

    struct TokenInfo { address token; uint8 rarity; }

    event PackOpened(
        uint256 indexed requestId,
        address indexed buyer,
        uint256 pricePaid,
        Tier tier,
        uint32 multiplierBps,
        uint256 totalValueWei,
        bytes32 seed,
        Pull[10] pulls
    );

    error WrongPayment();
    error NoContracts(); // msg.sender != tx.origin

    function packPrice() external view returns (uint256);
    function nextRequestId() external view returns (uint256);
    function catalog() external view returns (TokenInfo[] memory);

    /// Pay exactly packPrice(). userSeed: random bytes32 from the client. Draws, mints, emits PackOpened.
    function openPack(bytes32 userSeed) external payable returns (uint256 requestId);
}

interface IPriceOracle {
    function setPrices(address[] calldata tokens, uint256[] calldata pricesWei) external; // only updater
    function getPrice(address token) external view returns (uint256 priceWei, uint64 updatedAt);
    function updater() external view returns (address);
}
