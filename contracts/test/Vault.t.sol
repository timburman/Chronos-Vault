// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {
    Vault,
    Unauthorized, NotExpired, ZeroAddress, TransferFailed, ZeroAmount,
    VaultPaused, TooManyGuardians, AlreadyGuardian, NotGuardian,
    NoPendingChange, TimelockNotExpired, TimeoutTooShort
} from "../src/Vault.sol";
import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {ERC721} from "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {ERC1155} from "openzeppelin-contracts/contracts/token/ERC1155/ERC1155.sol";
import {IERC721Receiver} from "openzeppelin-contracts/contracts/token/ERC721/IERC721Receiver.sol";
import {IERC1155Receiver} from "openzeppelin-contracts/contracts/token/ERC1155/IERC1155Receiver.sol";
import {IERC165} from "openzeppelin-contracts/contracts/utils/introspection/IERC165.sol";

// ─── Mock Contracts ─────────────────────────────────────────────────────────

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MTK") {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract MockERC721 is ERC721 {
    uint256 private _nextTokenId;

    constructor() ERC721("Mock NFT", "MNFT") {}

    function mint(address to) external returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        return tokenId;
    }
}

contract MockERC1155 is ERC1155 {
    constructor() ERC1155("https://example.com/{id}.json") {}

    function mint(address to, uint256 id, uint256 amount) external {
        _mint(to, id, amount, "");
    }
}

// ─── Test Suite ─────────────────────────────────────────────────────────────

contract VaultTest is Test {
    Vault public vault;
    MockERC20 public token;
    MockERC721 public nft;
    MockERC1155 public multiToken;

    address public owner = address(1);
    address public beneficiary = address(2);
    address public stranger = address(3);
    address public guardian1 = address(4);
    address public guardian2 = address(5);
    address public mockFactory = address(99);
    uint256 public constant TIMEOUT_PERIOD = 30 days;

    function setUp() public {
        vault = new Vault(owner, beneficiary, TIMEOUT_PERIOD, mockFactory);
        token = new MockERC20();
        nft = new MockERC721();
        multiToken = new MockERC1155();
        vm.deal(owner, 100 ether);
        vm.deal(stranger, 10 ether);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  DEPLOYMENT
    // ═══════════════════════════════════════════════════════════════════════

    function test_Deployment() public view {
        assertEq(vault.owner(), owner);
        assertEq(vault.beneficiary(), beneficiary);
        assertEq(vault.timeoutPeriod(), TIMEOUT_PERIOD);
        assertEq(vault.lastPingTime(), block.timestamp);
        assertEq(vault.factory(), mockFactory);
        assertEq(vault.paused(), false);
        assertEq(vault.guardianCount(), 0);
    }

    function test_RevertIf_ZeroAddressBeneficiary() public {
        vm.expectRevert(ZeroAddress.selector);
        new Vault(owner, address(0), TIMEOUT_PERIOD, mockFactory);
    }

    function test_RevertIf_ZeroAddressOwner() public {
        vm.expectRevert(ZeroAddress.selector);
        new Vault(address(0), beneficiary, TIMEOUT_PERIOD, mockFactory);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  ERC-165 — Interface Support
    // ═══════════════════════════════════════════════════════════════════════

    function test_SupportsInterface_ERC165() public view {
        assertTrue(vault.supportsInterface(type(IERC165).interfaceId));
    }

    function test_SupportsInterface_ERC721Receiver() public view {
        assertTrue(vault.supportsInterface(type(IERC721Receiver).interfaceId));
    }

    function test_SupportsInterface_ERC1155Receiver() public view {
        assertTrue(vault.supportsInterface(type(IERC1155Receiver).interfaceId));
    }

    function test_DoesNotSupport_RandomInterface() public view {
        assertFalse(vault.supportsInterface(0xdeadbeef));
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  DEPOSIT: ETH
    // ═══════════════════════════════════════════════════════════════════════

    function test_DepositETH_ViaFunction() public {
        vm.prank(owner);
        vault.depositETH{value: 2 ether}();
        assertEq(address(vault).balance, 2 ether);
        assertEq(vault.vaultBalance(), 2 ether);
    }

    function test_DepositETH_ViaReceive() public {
        vm.prank(owner);
        (bool success, ) = address(vault).call{value: 1 ether}("");
        assertTrue(success);
        assertEq(address(vault).balance, 1 ether);
    }

    function test_RevertIf_DepositETH_ZeroValue() public {
        vm.prank(owner);
        vm.expectRevert(ZeroAmount.selector);
        vault.depositETH{value: 0}();
    }

    function test_RevertIf_DepositETH_WhenPaused() public {
        vm.prank(owner);
        vault.pause();

        vm.prank(owner);
        vm.expectRevert(VaultPaused.selector);
        vault.depositETH{value: 1 ether}();
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  DEPOSIT: ERC-20
    // ═══════════════════════════════════════════════════════════════════════

    function test_DepositERC20() public {
        uint256 amount = 500 * 10 ** 18;
        token.approve(address(vault), amount);
        vault.depositERC20(address(token), amount);
        assertEq(token.balanceOf(address(vault)), amount);
    }

    function test_RevertIf_DepositERC20_ZeroAmount() public {
        vm.expectRevert(ZeroAmount.selector);
        vault.depositERC20(address(token), 0);
    }

    function test_RevertIf_DepositERC20_ZeroAddress() public {
        vm.expectRevert(ZeroAddress.selector);
        vault.depositERC20(address(0), 100);
    }

    function test_RevertIf_DepositERC20_WhenPaused() public {
        vm.prank(owner);
        vault.pause();

        token.approve(address(vault), 100);
        vm.expectRevert(VaultPaused.selector);
        vault.depositERC20(address(token), 100);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  DEPOSIT: ERC-721
    // ═══════════════════════════════════════════════════════════════════════

    function test_DepositERC721() public {
        uint256 tokenId = nft.mint(owner);
        vm.startPrank(owner);
        nft.approve(address(vault), tokenId);
        vault.depositERC721(address(nft), tokenId);
        vm.stopPrank();
        assertEq(nft.ownerOf(tokenId), address(vault));
    }

    function test_DepositERC721_EmitsEvent() public {
        uint256 tokenId = nft.mint(owner);
        vm.startPrank(owner);
        nft.approve(address(vault), tokenId);

        vm.expectEmit(true, true, false, true);
        emit Vault.FundedERC721(owner, address(nft), tokenId);
        vault.depositERC721(address(nft), tokenId);
        vm.stopPrank();
    }

    function test_RevertIf_DepositERC721_ZeroAddress() public {
        vm.expectRevert(ZeroAddress.selector);
        vault.depositERC721(address(0), 1);
    }

    function test_RevertIf_DepositERC721_WhenPaused() public {
        uint256 tokenId = nft.mint(owner);

        vm.prank(owner);
        vault.pause();

        vm.startPrank(owner);
        nft.approve(address(vault), tokenId);
        vm.expectRevert(VaultPaused.selector);
        vault.depositERC721(address(nft), tokenId);
        vm.stopPrank();
    }

    function test_OnERC721Received_DirectSafeTransfer() public {
        // Test that safeTransferFrom directly to vault works (via callback)
        uint256 tokenId = nft.mint(owner);
        vm.prank(owner);
        nft.safeTransferFrom(owner, address(vault), tokenId);
        assertEq(nft.ownerOf(tokenId), address(vault));
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  DEPOSIT: ERC-1155
    // ═══════════════════════════════════════════════════════════════════════

    function test_DepositERC1155() public {
        multiToken.mint(owner, 1, 100);
        vm.startPrank(owner);
        multiToken.setApprovalForAll(address(vault), true);
        vault.depositERC1155(address(multiToken), 1, 50);
        vm.stopPrank();
        assertEq(multiToken.balanceOf(address(vault), 1), 50);
        assertEq(multiToken.balanceOf(owner, 1), 50);
    }

    function test_DepositERC1155_EmitsEvent() public {
        multiToken.mint(owner, 1, 100);
        vm.startPrank(owner);
        multiToken.setApprovalForAll(address(vault), true);

        vm.expectEmit(true, true, false, true);
        emit Vault.FundedERC1155(owner, address(multiToken), 1, 50);
        vault.depositERC1155(address(multiToken), 1, 50);
        vm.stopPrank();
    }

    function test_RevertIf_DepositERC1155_ZeroAddress() public {
        vm.expectRevert(ZeroAddress.selector);
        vault.depositERC1155(address(0), 1, 100);
    }

    function test_RevertIf_DepositERC1155_ZeroAmount() public {
        vm.expectRevert(ZeroAmount.selector);
        vault.depositERC1155(address(multiToken), 1, 0);
    }

    function test_RevertIf_DepositERC1155_WhenPaused() public {
        multiToken.mint(owner, 1, 100);
        vm.prank(owner);
        vault.pause();

        vm.startPrank(owner);
        multiToken.setApprovalForAll(address(vault), true);
        vm.expectRevert(VaultPaused.selector);
        vault.depositERC1155(address(multiToken), 1, 50);
        vm.stopPrank();
    }

    function test_OnERC1155Received_DirectSafeTransfer() public {
        multiToken.mint(owner, 1, 100);
        vm.prank(owner);
        multiToken.safeTransferFrom(owner, address(vault), 1, 100, "");
        assertEq(multiToken.balanceOf(address(vault), 1), 100);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PING
    // ═══════════════════════════════════════════════════════════════════════

    function test_Ping() public {
        vm.warp(block.timestamp + 10 days);
        vm.prank(owner);
        vault.ping();
        assertEq(vault.lastPingTime(), block.timestamp);
    }

    function test_RevertIf_PingByStranger() public {
        vm.prank(stranger);
        vm.expectRevert(Unauthorized.selector);
        vault.ping();
    }

    function test_GuardianCanPing() public {
        vm.prank(owner);
        vault.addGuardian(guardian1);

        vm.warp(block.timestamp + 10 days);
        vm.prank(guardian1);
        vault.ping();
        assertEq(vault.lastPingTime(), block.timestamp);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  GUARDIAN MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    function test_AddGuardian() public {
        vm.prank(owner);
        vault.addGuardian(guardian1);
        assertTrue(vault.guardians(guardian1));
        assertEq(vault.guardianCount(), 1);
    }

    function test_AddMultipleGuardians() public {
        vm.startPrank(owner);
        vault.addGuardian(guardian1);
        vault.addGuardian(guardian2);
        vm.stopPrank();
        assertTrue(vault.guardians(guardian1));
        assertTrue(vault.guardians(guardian2));
        assertEq(vault.guardianCount(), 2);
    }

    function test_RemoveGuardian() public {
        vm.startPrank(owner);
        vault.addGuardian(guardian1);
        vault.removeGuardian(guardian1);
        vm.stopPrank();
        assertFalse(vault.guardians(guardian1));
        assertEq(vault.guardianCount(), 0);
    }

    function test_RevertIf_StrangerAddsGuardian() public {
        vm.prank(stranger);
        vm.expectRevert(Unauthorized.selector);
        vault.addGuardian(guardian1);
    }

    function test_RevertIf_AddGuardianZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(ZeroAddress.selector);
        vault.addGuardian(address(0));
    }

    function test_RevertIf_AddDuplicateGuardian() public {
        vm.startPrank(owner);
        vault.addGuardian(guardian1);
        vm.expectRevert(AlreadyGuardian.selector);
        vault.addGuardian(guardian1);
        vm.stopPrank();
    }

    function test_RevertIf_TooManyGuardians() public {
        vm.startPrank(owner);
        for (uint256 i = 10; i < 15; i++) {
            vault.addGuardian(address(uint160(i)));
        }
        // 6th guardian should fail
        vm.expectRevert(TooManyGuardians.selector);
        vault.addGuardian(address(uint160(15)));
        vm.stopPrank();
    }

    function test_RevertIf_RemoveNonGuardian() public {
        vm.prank(owner);
        vm.expectRevert(NotGuardian.selector);
        vault.removeGuardian(guardian1);
    }

    function test_GuardianCannotCallNonPingFunctions() public {
        vm.prank(owner);
        vault.addGuardian(guardian1);

        // Guardian should not be able to withdraw
        vm.deal(address(vault), 1 ether);
        vm.prank(guardian1);
        vm.expectRevert(Unauthorized.selector);
        vault.withdraw(1 ether);

        // Guardian should not be able to pause
        vm.prank(guardian1);
        vm.expectRevert(Unauthorized.selector);
        vault.pause();
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  BENEFICIARY CHANGE TIMELOCK
    // ═══════════════════════════════════════════════════════════════════════

    function test_ProposeBeneficiaryChange() public {
        address newBen = address(6);
        vm.prank(owner);
        vault.proposeBeneficiaryChange(newBen);
        assertEq(vault.pendingBeneficiary(), newBen);
        assertEq(vault.beneficiaryChangeUnlockTime(), block.timestamp + 3 days);
        // Beneficiary should NOT change yet
        assertEq(vault.beneficiary(), beneficiary);
    }

    function test_ExecuteBeneficiaryChange_AfterDelay() public {
        address newBen = address(6);
        vm.prank(owner);
        vault.proposeBeneficiaryChange(newBen);

        // Fast-forward past the delay
        vm.warp(block.timestamp + 3 days + 1);

        vm.prank(owner);
        vault.executeBeneficiaryChange();
        assertEq(vault.beneficiary(), newBen);
        assertEq(vault.pendingBeneficiary(), address(0));
    }

    function test_RevertIf_ExecuteBeneficiaryChange_TooEarly() public {
        address newBen = address(6);
        vm.prank(owner);
        vault.proposeBeneficiaryChange(newBen);

        // Try to execute before delay
        vm.warp(block.timestamp + 2 days);

        vm.prank(owner);
        vm.expectRevert(TimelockNotExpired.selector);
        vault.executeBeneficiaryChange();
    }

    function test_CancelBeneficiaryChange() public {
        address newBen = address(6);
        vm.startPrank(owner);
        vault.proposeBeneficiaryChange(newBen);
        vault.cancelBeneficiaryChange();
        vm.stopPrank();

        assertEq(vault.pendingBeneficiary(), address(0));
        assertEq(vault.beneficiaryChangeUnlockTime(), 0);
        assertEq(vault.beneficiary(), beneficiary); // unchanged
    }

    function test_RevertIf_ExecuteWithNoPending() public {
        vm.prank(owner);
        vm.expectRevert(NoPendingChange.selector);
        vault.executeBeneficiaryChange();
    }

    function test_RevertIf_CancelWithNoPending() public {
        vm.prank(owner);
        vm.expectRevert(NoPendingChange.selector);
        vault.cancelBeneficiaryChange();
    }

    function test_RevertIf_ProposeBeneficiaryByStranger() public {
        vm.prank(stranger);
        vm.expectRevert(Unauthorized.selector);
        vault.proposeBeneficiaryChange(address(6));
    }

    function test_RevertIf_ProposeBeneficiaryZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(ZeroAddress.selector);
        vault.proposeBeneficiaryChange(address(0));
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PAUSE / UNPAUSE
    // ═══════════════════════════════════════════════════════════════════════

    function test_Pause() public {
        vm.prank(owner);
        vault.pause();
        assertTrue(vault.paused());
    }

    function test_Unpause() public {
        vm.startPrank(owner);
        vault.pause();
        vault.unpause();
        vm.stopPrank();
        assertFalse(vault.paused());
    }

    function test_PauseBlocksDeposits() public {
        vm.prank(owner);
        vault.pause();

        // ETH deposit blocked
        vm.prank(owner);
        vm.expectRevert(VaultPaused.selector);
        vault.depositETH{value: 1 ether}();

        // ERC20 deposit blocked
        token.approve(address(vault), 100);
        vm.expectRevert(VaultPaused.selector);
        vault.depositERC20(address(token), 100);
    }

    function test_PauseBlocksClaims() public {
        // Fund and expire
        vm.prank(owner);
        vault.depositETH{value: 1 ether}();
        vm.warp(block.timestamp + TIMEOUT_PERIOD + 1);

        // Pause it
        vm.prank(owner);
        vault.pause();

        // Beneficiary can't claim
        vm.prank(beneficiary);
        vm.expectRevert(VaultPaused.selector);
        vault.claimFunds();
    }

    function test_PauseDoesNotBlockWithdrawals() public {
        vm.prank(owner);
        vault.depositETH{value: 1 ether}();

        vm.prank(owner);
        vault.pause();

        // Owner can still withdraw even when paused
        vm.prank(owner);
        vault.withdraw(0.5 ether);
        assertEq(address(vault).balance, 0.5 ether);
    }

    function test_RevertIf_StrangerPauses() public {
        vm.prank(stranger);
        vm.expectRevert(Unauthorized.selector);
        vault.pause();
    }

    function test_RevertIf_StrangerUnpauses() public {
        vm.prank(owner);
        vault.pause();

        vm.prank(stranger);
        vm.expectRevert(Unauthorized.selector);
        vault.unpause();
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  TIMEOUT PERIOD CHANGE
    // ═══════════════════════════════════════════════════════════════════════

    function test_ChangeTimeoutPeriod() public {
        vm.prank(owner);
        vault.changeTimeoutPeriod(60 days);
        assertEq(vault.timeoutPeriod(), 60 days);
    }

    function test_RevertIf_TimeoutTooShort() public {
        vm.prank(owner);
        vm.expectRevert(TimeoutTooShort.selector);
        vault.changeTimeoutPeriod(1 days); // less than MIN_TIMEOUT (7 days)
    }

    function test_ChangeTimeoutPeriod_MinimumValue() public {
        vm.prank(owner);
        vault.changeTimeoutPeriod(7 days); // exactly MIN_TIMEOUT
        assertEq(vault.timeoutPeriod(), 7 days);
    }

    function test_RevertIf_TimeoutChangeByStranger() public {
        vm.prank(stranger);
        vm.expectRevert(Unauthorized.selector);
        vault.changeTimeoutPeriod(60 days);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  WITHDRAW: ETH
    // ═══════════════════════════════════════════════════════════════════════

    function test_OwnerWithdrawETH() public {
        vm.prank(owner);
        vault.depositETH{value: 1 ether}();
        uint256 before = owner.balance;
        vm.prank(owner);
        vault.withdraw(0.5 ether);
        assertEq(address(vault).balance, 0.5 ether);
        assertEq(owner.balance, before + 0.5 ether);
    }

    function test_RevertIf_StrangerWithdrawETH() public {
        vm.deal(address(vault), 1 ether);
        vm.prank(stranger);
        vm.expectRevert(Unauthorized.selector);
        vault.withdraw(1 ether);
    }

    function test_RevertIf_WithdrawZeroAmount() public {
        vm.deal(address(vault), 1 ether);
        vm.prank(owner);
        vm.expectRevert(ZeroAmount.selector);
        vault.withdraw(0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  WITHDRAW: ERC-20
    // ═══════════════════════════════════════════════════════════════════════

    function test_OwnerWithdrawERC20() public {
        uint256 amount = 1000 * 10 ** 18;
        token.approve(address(vault), amount);
        vault.depositERC20(address(token), amount);

        vm.prank(owner);
        vault.withdrawERC20(address(token), 500 * 10 ** 18);
        assertEq(token.balanceOf(address(vault)), 500 * 10 ** 18);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  WITHDRAW: ERC-721
    // ═══════════════════════════════════════════════════════════════════════

    function test_OwnerWithdrawERC721() public {
        uint256 tokenId = nft.mint(owner);
        vm.startPrank(owner);
        nft.approve(address(vault), tokenId);
        vault.depositERC721(address(nft), tokenId);
        vault.withdrawERC721(address(nft), tokenId);
        vm.stopPrank();
        assertEq(nft.ownerOf(tokenId), owner);
    }

    function test_RevertIf_StrangerWithdrawERC721() public {
        uint256 tokenId = nft.mint(owner);
        vm.startPrank(owner);
        nft.approve(address(vault), tokenId);
        vault.depositERC721(address(nft), tokenId);
        vm.stopPrank();

        vm.prank(stranger);
        vm.expectRevert(Unauthorized.selector);
        vault.withdrawERC721(address(nft), tokenId);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  WITHDRAW: ERC-1155
    // ═══════════════════════════════════════════════════════════════════════

    function test_OwnerWithdrawERC1155() public {
        multiToken.mint(owner, 1, 100);
        vm.startPrank(owner);
        multiToken.setApprovalForAll(address(vault), true);
        vault.depositERC1155(address(multiToken), 1, 100);
        vault.withdrawERC1155(address(multiToken), 1, 60);
        vm.stopPrank();
        assertEq(multiToken.balanceOf(address(vault), 1), 40);
        assertEq(multiToken.balanceOf(owner, 1), 60);
    }

    function test_RevertIf_StrangerWithdrawERC1155() public {
        multiToken.mint(owner, 1, 100);
        vm.startPrank(owner);
        multiToken.setApprovalForAll(address(vault), true);
        vault.depositERC1155(address(multiToken), 1, 100);
        vm.stopPrank();

        vm.prank(stranger);
        vm.expectRevert(Unauthorized.selector);
        vault.withdrawERC1155(address(multiToken), 1, 50);
    }

    function test_RevertIf_WithdrawERC1155_ZeroAmount() public {
        vm.prank(owner);
        vm.expectRevert(ZeroAmount.selector);
        vault.withdrawERC1155(address(multiToken), 1, 0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  CLAIM: ETH
    // ═══════════════════════════════════════════════════════════════════════

    function test_ClaimFunds_RevertBeforeTimeout() public {
        vm.deal(address(vault), 1 ether);
        vm.warp(block.timestamp + TIMEOUT_PERIOD - 1);
        vm.prank(beneficiary);
        vm.expectRevert(NotExpired.selector);
        vault.claimFunds();
    }

    function test_ClaimFunds_SuccessAfterTimeout() public {
        vm.prank(owner);
        vault.depositETH{value: 1 ether}();
        uint256 initBalance = beneficiary.balance;
        vm.warp(block.timestamp + TIMEOUT_PERIOD + 1);
        vm.prank(beneficiary);
        vault.claimFunds();
        assertEq(beneficiary.balance, initBalance + 1 ether);
        assertEq(address(vault).balance, 0);
    }

    function test_ClaimFunds_RevertStranger() public {
        vm.deal(address(vault), 1 ether);
        vm.warp(block.timestamp + TIMEOUT_PERIOD + 1);
        vm.prank(stranger);
        vm.expectRevert(Unauthorized.selector);
        vault.claimFunds();
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  CLAIM: ERC-20
    // ═══════════════════════════════════════════════════════════════════════

    function test_ClaimERC20_SuccessAfterTimeout() public {
        uint256 amount = 1000 * 10 ** 18;
        token.approve(address(vault), amount);
        vault.depositERC20(address(token), amount);
        vm.warp(block.timestamp + TIMEOUT_PERIOD + 1);
        vm.prank(beneficiary);
        vault.claimERC20(address(token));
        assertEq(token.balanceOf(beneficiary), amount);
        assertEq(token.balanceOf(address(vault)), 0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  CLAIM: ERC-721
    // ═══════════════════════════════════════════════════════════════════════

    function test_ClaimERC721_AfterTimeout() public {
        uint256 tokenId = nft.mint(owner);
        vm.startPrank(owner);
        nft.approve(address(vault), tokenId);
        vault.depositERC721(address(nft), tokenId);
        vm.stopPrank();

        vm.warp(block.timestamp + TIMEOUT_PERIOD + 1);
        vm.prank(beneficiary);
        vault.claimERC721(address(nft), tokenId);
        assertEq(nft.ownerOf(tokenId), beneficiary);
    }

    function test_RevertIf_ClaimERC721_BeforeTimeout() public {
        uint256 tokenId = nft.mint(owner);
        vm.startPrank(owner);
        nft.approve(address(vault), tokenId);
        vault.depositERC721(address(nft), tokenId);
        vm.stopPrank();

        vm.warp(block.timestamp + TIMEOUT_PERIOD - 1);
        vm.prank(beneficiary);
        vm.expectRevert(NotExpired.selector);
        vault.claimERC721(address(nft), tokenId);
    }

    function test_RevertIf_ClaimERC721_Stranger() public {
        uint256 tokenId = nft.mint(owner);
        vm.startPrank(owner);
        nft.approve(address(vault), tokenId);
        vault.depositERC721(address(nft), tokenId);
        vm.stopPrank();

        vm.warp(block.timestamp + TIMEOUT_PERIOD + 1);
        vm.prank(stranger);
        vm.expectRevert(Unauthorized.selector);
        vault.claimERC721(address(nft), tokenId);
    }

    function test_RevertIf_ClaimERC721_WhenPaused() public {
        uint256 tokenId = nft.mint(owner);
        vm.startPrank(owner);
        nft.approve(address(vault), tokenId);
        vault.depositERC721(address(nft), tokenId);
        vm.stopPrank();

        vm.warp(block.timestamp + TIMEOUT_PERIOD + 1);
        vm.prank(owner);
        vault.pause();

        vm.prank(beneficiary);
        vm.expectRevert(VaultPaused.selector);
        vault.claimERC721(address(nft), tokenId);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  CLAIM: ERC-1155
    // ═══════════════════════════════════════════════════════════════════════

    function test_ClaimERC1155_AfterTimeout() public {
        multiToken.mint(owner, 1, 100);
        vm.startPrank(owner);
        multiToken.setApprovalForAll(address(vault), true);
        vault.depositERC1155(address(multiToken), 1, 100);
        vm.stopPrank();

        vm.warp(block.timestamp + TIMEOUT_PERIOD + 1);
        vm.prank(beneficiary);
        vault.claimERC1155(address(multiToken), 1, 100);
        assertEq(multiToken.balanceOf(beneficiary, 1), 100);
        assertEq(multiToken.balanceOf(address(vault), 1), 0);
    }

    function test_RevertIf_ClaimERC1155_BeforeTimeout() public {
        multiToken.mint(owner, 1, 100);
        vm.startPrank(owner);
        multiToken.setApprovalForAll(address(vault), true);
        vault.depositERC1155(address(multiToken), 1, 100);
        vm.stopPrank();

        vm.warp(block.timestamp + TIMEOUT_PERIOD - 1);
        vm.prank(beneficiary);
        vm.expectRevert(NotExpired.selector);
        vault.claimERC1155(address(multiToken), 1, 50);
    }

    function test_RevertIf_ClaimERC1155_Stranger() public {
        multiToken.mint(owner, 1, 100);
        vm.startPrank(owner);
        multiToken.setApprovalForAll(address(vault), true);
        vault.depositERC1155(address(multiToken), 1, 100);
        vm.stopPrank();

        vm.warp(block.timestamp + TIMEOUT_PERIOD + 1);
        vm.prank(stranger);
        vm.expectRevert(Unauthorized.selector);
        vault.claimERC1155(address(multiToken), 1, 50);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  MULTI-NFT DEPOSIT + CLAIM FLOW (Integration)
    // ═══════════════════════════════════════════════════════════════════════

    function test_FullInheritanceFlow_ETH_ERC20_ERC721_ERC1155() public {
        // 1. Owner deposits ETH
        vm.prank(owner);
        vault.depositETH{value: 5 ether}();

        // 2. Owner deposits ERC20
        token.mint(owner, 10000 * 10 ** 18);
        vm.startPrank(owner);
        token.approve(address(vault), 5000 * 10 ** 18);
        vault.depositERC20(address(token), 5000 * 10 ** 18);
        vm.stopPrank();

        // 3. Owner deposits an ERC-721 NFT
        uint256 nftId = nft.mint(owner);
        vm.startPrank(owner);
        nft.approve(address(vault), nftId);
        vault.depositERC721(address(nft), nftId);
        vm.stopPrank();

        // 4. Owner deposits ERC-1155 tokens
        multiToken.mint(owner, 42, 200);
        vm.startPrank(owner);
        multiToken.setApprovalForAll(address(vault), true);
        vault.depositERC1155(address(multiToken), 42, 200);
        vm.stopPrank();

        // 5. Time passes — owner goes inactive
        vm.warp(block.timestamp + TIMEOUT_PERIOD + 1);

        // 6. Beneficiary claims everything
        vm.startPrank(beneficiary);
        vault.claimFunds();
        vault.claimERC20(address(token));
        vault.claimERC721(address(nft), nftId);
        vault.claimERC1155(address(multiToken), 42, 200);
        vm.stopPrank();

        // 7. Verify beneficiary received everything
        assertGt(beneficiary.balance, 0);
        assertEq(token.balanceOf(beneficiary), 5000 * 10 ** 18);
        assertEq(nft.ownerOf(nftId), beneficiary);
        assertEq(multiToken.balanceOf(beneficiary, 42), 200);

        // 8. Vault is empty
        assertEq(address(vault).balance, 0);
        assertEq(token.balanceOf(address(vault)), 0);
        assertEq(multiToken.balanceOf(address(vault), 42), 0);
    }
}
