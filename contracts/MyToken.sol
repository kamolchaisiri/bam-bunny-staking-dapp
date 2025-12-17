// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor() ERC20("MyToken", "MTK") {
        // Mint initial tokens to the deployer
        _mint(msg.sender, 1000000 * 10**18);
    }

    // Temporary: Remove 'onlyOwner' to allow minting for testing
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}