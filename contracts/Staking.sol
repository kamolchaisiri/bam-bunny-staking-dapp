// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Bam & Bunny Ultimate Staking Vault
 * @dev Features: Real-time Rewards, Compound, Emergency Withdraw, and Pause functionality.
 */
contract Staking is Ownable {
    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;

    uint256 public rewardRate = 100; // Rewards distributed per second
    uint256 private _totalSupply;
    bool public paused = false; // Emergency pause state

    mapping(address => uint256) public stakedAmounts; // User's principal balance
    mapping(address => uint256) public rewards;       // Accrued rewards
    mapping(address => uint256) public lastUpdateTime; // Timestamp of last reward update

    constructor(address _stakingToken, address _rewardToken) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
    }

    // --- MATH & VIEW FUNCTIONS ---

    /**
     * @dev Calculates current earned rewards based on time elapsed
     */
    function earned(address account) public view returns (uint256) {
        if (stakedAmounts[account] == 0) return rewards[account];
        uint256 timeElapsed = block.timestamp - lastUpdateTime[account];
        return (stakedAmounts[account] * timeElapsed * rewardRate / 1e18) + rewards[account];
    }

    // --- MODIFIERS ---

    modifier updateReward(address account) {
        rewards[account] = earned(account);
        lastUpdateTime[account] = block.timestamp; // Record time
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is currently paused"); // Pause check
        _;
    }

    // --- CORE FUNCTIONS ---

    /**
     * @notice Deposit tokens to earn rewards
     */
    function stake(uint256 amount) external updateReward(msg.sender) whenNotPaused {
        require(amount > 0, "Cannot stake 0");
        _totalSupply += amount;
        stakedAmounts[msg.sender] += amount;
        // User must Approve first
        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }

    /**
     * @notice Claim pending rewards to wallet
     */
    function getReward() external updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.transfer(msg.sender, reward);
        }
    }

    /**
     * @notice Restake earned rewards into principal balance (Auto-compound)
     */
    function compound() external updateReward(msg.sender) whenNotPaused {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards to compound");
        
        rewards[msg.sender] = 0; 
        
        stakedAmounts[msg.sender] += reward;
        _totalSupply += reward;
    }

    /**
     * @notice Withdraw principal AND claim rewards
     */
    function withdraw() external updateReward(msg.sender) {
        uint256 amount = stakedAmounts[msg.sender];
        uint256 reward = rewards[msg.sender];
        require(amount > 0, "No stake found");

        _totalSupply -= amount;
        stakedAmounts[msg.sender] = 0;
        rewards[msg.sender] = 0;

        stakingToken.transfer(msg.sender, amount);
        if (reward > 0) rewardToken.transfer(msg.sender, reward);
    }

    /**
     * @notice Recover principal only, ignoring rewards. Use in emergencies.
     */
    function emergencyWithdraw() external {
        uint256 amount = stakedAmounts[msg.sender];
        require(amount > 0, "Nothing to withdraw");
        
        _totalSupply -= amount;
        stakedAmounts[msg.sender] = 0;
        rewards[msg.sender] = 0; // Prevent reward manipulation
        
        stakingToken.transfer(msg.sender, amount);
    }

    // --- ADMIN FUNCTIONS ---

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused; // Manage contract status
    }

    function setRewardRate(uint256 _rate) external onlyOwner {
        rewardRate = _rate;
    }
}