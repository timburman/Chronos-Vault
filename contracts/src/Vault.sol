// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721} from "openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "openzeppelin-contracts/contracts/token/ERC721/IERC721Receiver.sol";
import {IERC1155} from "openzeppelin-contracts/contracts/token/ERC1155/IERC1155.sol";
import {IERC1155Receiver} from "openzeppelin-contracts/contracts/token/ERC1155/IERC1155Receiver.sol";
import {IERC165} from "openzeppelin-contracts/contracts/utils/introspection/IERC165.sol";

// ─── Errors ─────────────────────────────────────────────────────────────────
error Unauthorized();
error NotExpired();
error ZeroAddress();
error TransferFailed();
error ZeroAmount();
error VaultPaused();
error TooManyGuardians();
error AlreadyGuardian();
error NotGuardian();
error NoPendingChange();
error TimelockNotExpired();
error TimeoutTooShort();

contract Vault is ReentrancyGuard, IERC721Receiver, IERC1155Receiver {
    using SafeERC20 for IERC20;

    // ─── Constants ──────────────────────────────────────────────────────────
    uint256 public constant MAX_GUARDIANS = 5;
    uint256 public constant BENEFICIARY_CHANGE_DELAY = 3 days;
    uint256 public constant MIN_TIMEOUT = 7 days;

    // ─── Core State ─────────────────────────────────────────────────────────
    address public immutable factory;
    address public owner;
    address public beneficiary;
    uint256 public lastPingTime;
    uint256 public timeoutPeriod;
    bool public paused;

    // ─── Guardian State ─────────────────────────────────────────────────────
    mapping(address => bool) public guardians;
    uint256 public guardianCount;

    // ─── Beneficiary Timelock State ─────────────────────────────────────────
    address public pendingBeneficiary;
    uint256 public beneficiaryChangeUnlockTime;

    // ─── Events ─────────────────────────────────────────────────────────────
    // ETH
    event Pinged(uint256 timestamp);
    event Claimed(address indexed beneficiary, uint256 amount);
    event Withdrawn(address indexed owner, uint256 amount);
    event Funded(address indexed sender, uint256 amount);

    // ERC-20
    event ClaimedERC20(address indexed beneficiary, address indexed token, uint256 amount);
    event WithdrawnERC20(address indexed owner, address indexed token, uint256 amount);
    event FundedERC20(address indexed sender, address indexed token, uint256 amount);

    // ERC-721
    event FundedERC721(address indexed sender, address indexed token, uint256 tokenId);
    event WithdrawnERC721(address indexed owner, address indexed token, uint256 tokenId);
    event ClaimedERC721(address indexed beneficiary, address indexed token, uint256 tokenId);

    // ERC-1155
    event FundedERC1155(address indexed sender, address indexed token, uint256 tokenId, uint256 amount);
    event WithdrawnERC1155(address indexed owner, address indexed token, uint256 tokenId, uint256 amount);
    event ClaimedERC1155(address indexed beneficiary, address indexed token, uint256 tokenId, uint256 amount);

    // Beneficiary timelock
    event BeneficiaryChangeProposed(address indexed newBeneficiary, uint256 unlockTime);
    event BeneficiaryChanged(address indexed oldBeneficiary, address indexed newBeneficiary);
    event BeneficiaryChangeCancelled();

    // Guardian
    event GuardianAdded(address indexed guardian);
    event GuardianRemoved(address indexed guardian);

    // Pause
    event VaultPausedEvent(address indexed by);
    event VaultUnpaused(address indexed by);

    // Timeout
    event TimeoutPeriodChanged(uint256 oldPeriod, uint256 newPeriod);

    // ─── Modifiers ──────────────────────────────────────────────────────────
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyBeneficiary() {
        if (msg.sender != beneficiary) revert Unauthorized();
        _;
    }

    modifier onlyOwnerOrGuardian() {
        if (msg.sender != owner && !guardians[msg.sender]) revert Unauthorized();
        _;
    }

    modifier afterTimeout() {
        if (block.timestamp <= lastPingTime + timeoutPeriod) revert NotExpired();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert VaultPaused();
        _;
    }

    // ─── Constructor ────────────────────────────────────────────────────────
    constructor(address _owner, address _beneficiary, uint256 _timeoutPeriod, address _factory) {
        if (_beneficiary == address(0) || _owner == address(0)) revert ZeroAddress();
        owner = _owner;
        beneficiary = _beneficiary;
        timeoutPeriod = _timeoutPeriod;
        lastPingTime = block.timestamp;
        factory = _factory;
    }

    // ─── ERC-165 ────────────────────────────────────────────────────────────
    /// @notice Indicates which interfaces this contract supports (ERC-165)
    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IERC721Receiver).interfaceId
            || interfaceId == type(IERC1155Receiver).interfaceId
            || interfaceId == type(IERC165).interfaceId;
    }

    // ─── Token Receiver Callbacks ───────────────────────────────────────────
    /// @notice Handle ERC-721 safe transfers into the vault
    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /// @notice Handle ERC-1155 safe transfers into the vault
    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    /// @notice Handle ERC-1155 batch transfers into the vault
    function onERC1155BatchReceived(
        address, address, uint256[] calldata, uint256[] calldata, bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    // ─── Deposit: ETH ───────────────────────────────────────────────────────
    /// @notice Accept plain ETH transfers (e.g. direct sends from wallets)
    receive() external payable {
        emit Funded(msg.sender, msg.value);
    }

    /// @notice Explicitly deposit ETH into the vault
    function depositETH() external payable whenNotPaused {
        if (msg.value == 0) revert ZeroAmount();
        emit Funded(msg.sender, msg.value);
    }

    // ─── Deposit: ERC-20 ────────────────────────────────────────────────────
    /// @notice Deposit an ERC20 token into the vault. Requires prior approval.
    /// @param _token The ERC20 contract address
    /// @param _amount The amount to deposit (in token's base units)
    function depositERC20(address _token, uint256 _amount) external nonReentrant whenNotPaused {
        if (_token == address(0)) revert ZeroAddress();
        if (_amount == 0) revert ZeroAmount();
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        emit FundedERC20(msg.sender, _token, _amount);
    }

    // ─── Deposit: ERC-721 ───────────────────────────────────────────────────
    /// @notice Deposit an ERC-721 NFT into the vault. Requires prior approval.
    /// @param _token The ERC721 contract address
    /// @param _tokenId The ID of the NFT to deposit
    function depositERC721(address _token, uint256 _tokenId) external nonReentrant whenNotPaused {
        if (_token == address(0)) revert ZeroAddress();
        IERC721(_token).safeTransferFrom(msg.sender, address(this), _tokenId);
        emit FundedERC721(msg.sender, _token, _tokenId);
    }

    // ─── Deposit: ERC-1155 ──────────────────────────────────────────────────
    /// @notice Deposit an ERC-1155 token into the vault. Requires prior approval.
    /// @param _token The ERC1155 contract address
    /// @param _tokenId The ID of the token type to deposit
    /// @param _amount The amount of that token type to deposit
    function depositERC1155(address _token, uint256 _tokenId, uint256 _amount) external nonReentrant whenNotPaused {
        if (_token == address(0)) revert ZeroAddress();
        if (_amount == 0) revert ZeroAmount();
        IERC1155(_token).safeTransferFrom(msg.sender, address(this), _tokenId, _amount, "");
        emit FundedERC1155(msg.sender, _token, _tokenId, _amount);
    }

    // ─── Ping ───────────────────────────────────────────────────────────────
    /// @notice Prove you are alive — resets the inactivity countdown.
    ///         Can be called by the owner or any registered guardian.
    function ping() external onlyOwnerOrGuardian {
        lastPingTime = block.timestamp;
        emit Pinged(lastPingTime);
    }

    // ─── Guardian Management ────────────────────────────────────────────────
    /// @notice Register a guardian who can ping on the owner's behalf
    /// @param _guardian The address to add as a guardian
    function addGuardian(address _guardian) external onlyOwner {
        if (_guardian == address(0)) revert ZeroAddress();
        if (guardians[_guardian]) revert AlreadyGuardian();
        if (guardianCount >= MAX_GUARDIANS) revert TooManyGuardians();
        guardians[_guardian] = true;
        guardianCount++;
        emit GuardianAdded(_guardian);
    }

    /// @notice Remove a guardian
    /// @param _guardian The address to remove
    function removeGuardian(address _guardian) external onlyOwner {
        if (!guardians[_guardian]) revert NotGuardian();
        guardians[_guardian] = false;
        guardianCount--;
        emit GuardianRemoved(_guardian);
    }

    // ─── Beneficiary Timelock ───────────────────────────────────────────────
    /// @notice Propose a new beneficiary. Takes effect after BENEFICIARY_CHANGE_DELAY.
    /// @param _newBeneficiary The address of the proposed new beneficiary
    function proposeBeneficiaryChange(address _newBeneficiary) external onlyOwner {
        if (_newBeneficiary == address(0)) revert ZeroAddress();
        pendingBeneficiary = _newBeneficiary;
        beneficiaryChangeUnlockTime = block.timestamp + BENEFICIARY_CHANGE_DELAY;
        emit BeneficiaryChangeProposed(_newBeneficiary, beneficiaryChangeUnlockTime);
    }

    /// @notice Execute a previously proposed beneficiary change after the timelock
    function executeBeneficiaryChange() external onlyOwner {
        if (pendingBeneficiary == address(0)) revert NoPendingChange();
        if (block.timestamp < beneficiaryChangeUnlockTime) revert TimelockNotExpired();
        address oldBeneficiary = beneficiary;
        beneficiary = pendingBeneficiary;
        pendingBeneficiary = address(0);
        beneficiaryChangeUnlockTime = 0;
        emit BeneficiaryChanged(oldBeneficiary, beneficiary);
    }

    /// @notice Cancel a pending beneficiary change
    function cancelBeneficiaryChange() external onlyOwner {
        if (pendingBeneficiary == address(0)) revert NoPendingChange();
        pendingBeneficiary = address(0);
        beneficiaryChangeUnlockTime = 0;
        emit BeneficiaryChangeCancelled();
    }

    // ─── Pause ──────────────────────────────────────────────────────────────
    /// @notice Pause deposits and claims. Withdrawals remain available.
    function pause() external onlyOwner {
        paused = true;
        emit VaultPausedEvent(msg.sender);
    }

    /// @notice Unpause the vault
    function unpause() external onlyOwner {
        paused = false;
        emit VaultUnpaused(msg.sender);
    }

    // ─── Timeout Period ─────────────────────────────────────────────────────
    /// @notice Update the inactivity timeout period. Minimum 7 days.
    /// @param _newPeriod The new timeout in seconds
    function changeTimeoutPeriod(uint256 _newPeriod) external onlyOwner {
        if (_newPeriod < MIN_TIMEOUT) revert TimeoutTooShort();
        uint256 oldPeriod = timeoutPeriod;
        timeoutPeriod = _newPeriod;
        emit TimeoutPeriodChanged(oldPeriod, _newPeriod);
    }

    // ─── Withdraw: ETH ──────────────────────────────────────────────────────
    /// @notice Owner can withdraw ETH at any time (even when paused)
    function withdraw(uint256 _amount) external onlyOwner nonReentrant {
        if (_amount == 0) revert ZeroAmount();
        (bool success, ) = msg.sender.call{value: _amount}("");
        if (!success) revert TransferFailed();
        emit Withdrawn(msg.sender, _amount);
    }

    // ─── Withdraw: ERC-20 ───────────────────────────────────────────────────
    /// @notice Owner can withdraw ERC20 at any time (even when paused)
    function withdrawERC20(address _token, uint256 _amount) external onlyOwner nonReentrant {
        if (_amount == 0) revert ZeroAmount();
        IERC20(_token).safeTransfer(msg.sender, _amount);
        emit WithdrawnERC20(msg.sender, _token, _amount);
    }

    // ─── Withdraw: ERC-721 ──────────────────────────────────────────────────
    /// @notice Owner can withdraw an ERC-721 NFT at any time (even when paused)
    function withdrawERC721(address _token, uint256 _tokenId) external onlyOwner nonReentrant {
        IERC721(_token).safeTransferFrom(address(this), msg.sender, _tokenId);
        emit WithdrawnERC721(msg.sender, _token, _tokenId);
    }

    // ─── Withdraw: ERC-1155 ─────────────────────────────────────────────────
    /// @notice Owner can withdraw ERC-1155 tokens at any time (even when paused)
    function withdrawERC1155(address _token, uint256 _tokenId, uint256 _amount) external onlyOwner nonReentrant {
        if (_amount == 0) revert ZeroAmount();
        IERC1155(_token).safeTransferFrom(address(this), msg.sender, _tokenId, _amount, "");
        emit WithdrawnERC1155(msg.sender, _token, _tokenId, _amount);
    }

    // ─── Claim: ETH ─────────────────────────────────────────────────────────
    /// @notice Beneficiary sweeps all ETH after timeout has elapsed
    function claimFunds() external onlyBeneficiary afterTimeout nonReentrant whenNotPaused {
        uint256 balance = address(this).balance;
        (bool success, ) = beneficiary.call{value: balance}("");
        if (!success) revert TransferFailed();
        emit Claimed(beneficiary, balance);
    }

    // ─── Claim: ERC-20 ──────────────────────────────────────────────────────
    /// @notice Beneficiary sweeps all of a specific ERC20 token after timeout
    function claimERC20(address _token) external onlyBeneficiary afterTimeout nonReentrant whenNotPaused {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).safeTransfer(beneficiary, balance);
        emit ClaimedERC20(beneficiary, _token, balance);
    }

    // ─── Claim: ERC-721 ─────────────────────────────────────────────────────
    /// @notice Beneficiary claims a specific ERC-721 NFT after timeout
    function claimERC721(address _token, uint256 _tokenId) external onlyBeneficiary afterTimeout nonReentrant whenNotPaused {
        IERC721(_token).safeTransferFrom(address(this), beneficiary, _tokenId);
        emit ClaimedERC721(beneficiary, _token, _tokenId);
    }

    // ─── Claim: ERC-1155 ────────────────────────────────────────────────────
    /// @notice Beneficiary claims ERC-1155 tokens after timeout
    function claimERC1155(
        address _token, uint256 _tokenId, uint256 _amount
    ) external onlyBeneficiary afterTimeout nonReentrant whenNotPaused {
        IERC1155(_token).safeTransferFrom(address(this), beneficiary, _tokenId, _amount, "");
        emit ClaimedERC1155(beneficiary, _token, _tokenId, _amount);
    }

    // ─── View ───────────────────────────────────────────────────────────────
    /// @notice Returns current ETH balance of the vault
    function vaultBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
