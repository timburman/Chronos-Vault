// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

error Unauthorized();
error NotExpired();
error ZeroAddress();
error TransferFailed();
error ZeroAmount();

contract Vault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable factory;
    address public owner;
    address public beneficiary;
    uint256 public lastPingTime;
    uint256 public timeoutPeriod;

    event Pinged(uint256 timestamp);
    event BeneficiaryChanged(address indexed oldBeneficiary, address indexed newBeneficiary);
    event Claimed(address indexed beneficiary, uint256 amount);
    event ClaimedERC20(address indexed beneficiary, address indexed token, uint256 amount);
    event Withdrawn(address indexed owner, uint256 amount);
    event WithdrawnERC20(address indexed owner, address indexed token, uint256 amount);
    event Funded(address indexed sender, uint256 amount);
    event FundedERC20(address indexed sender, address indexed token, uint256 amount);

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyBeneficiary() {
        if (msg.sender != beneficiary) revert Unauthorized();
        _;
    }

    modifier afterTimeout() {
        if (block.timestamp <= lastPingTime + timeoutPeriod) revert NotExpired();
        _;
    }

    constructor(address _owner, address _beneficiary, uint256 _timeoutPeriod, address _factory) {
        if (_beneficiary == address(0) || _owner == address(0)) revert ZeroAddress();
        owner = _owner;
        beneficiary = _beneficiary;
        timeoutPeriod = _timeoutPeriod;
        lastPingTime = block.timestamp;
        factory = _factory;
    }

    /// @notice Accept plain ETH transfers (e.g. direct sends from wallets)
    receive() external payable {
        emit Funded(msg.sender, msg.value);
    }

    /// @notice Explicitly deposit ETH into the vault
    function depositETH() external payable {
        if (msg.value == 0) revert ZeroAmount();
        emit Funded(msg.sender, msg.value);
    }

    /// @notice Deposit an ERC20 token into the vault. Requires prior approval.
    /// @param _token The ERC20 contract address
    /// @param _amount The amount to deposit (in token's base units)
    function depositERC20(address _token, uint256 _amount) external nonReentrant {
        if (_token == address(0)) revert ZeroAddress();
        if (_amount == 0) revert ZeroAmount();
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        emit FundedERC20(msg.sender, _token, _amount);
    }

    /// @notice Prove you are alive — resets the inactivity countdown
    function ping() external onlyOwner {
        lastPingTime = block.timestamp;
        emit Pinged(lastPingTime);
    }

    /// @notice Update the beneficiary address
    function changeBeneficiary(address _newBeneficiary) external onlyOwner {
        if (_newBeneficiary == address(0)) revert ZeroAddress();
        address oldBeneficiary = beneficiary;
        beneficiary = _newBeneficiary;
        emit BeneficiaryChanged(oldBeneficiary, _newBeneficiary);
    }

    /// @notice Owner can withdraw ETH at any time before timeout
    function withdraw(uint256 _amount) external onlyOwner nonReentrant {
        if (_amount == 0) revert ZeroAmount();
        (bool success, ) = msg.sender.call{value: _amount}("");
        if (!success) revert TransferFailed();
        emit Withdrawn(msg.sender, _amount);
    }

    /// @notice Owner can withdraw ERC20 at any time before timeout
    function withdrawERC20(address _token, uint256 _amount) external onlyOwner nonReentrant {
        if (_amount == 0) revert ZeroAmount();
        IERC20(_token).safeTransfer(msg.sender, _amount);
        emit WithdrawnERC20(msg.sender, _token, _amount);
    }

    /// @notice Beneficiary sweeps all ETH after timeout has elapsed
    function claimFunds() external onlyBeneficiary afterTimeout nonReentrant {
        uint256 balance = address(this).balance;
        (bool success, ) = beneficiary.call{value: balance}("");
        if (!success) revert TransferFailed();
        emit Claimed(beneficiary, balance);
    }

    /// @notice Beneficiary sweeps all of a specific ERC20 token after timeout
    function claimERC20(address _token) external onlyBeneficiary afterTimeout nonReentrant {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).safeTransfer(beneficiary, balance);
        emit ClaimedERC20(beneficiary, _token, balance);
    }

    /// @notice Returns current ETH balance of the vault
    function vaultBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
