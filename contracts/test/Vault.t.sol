// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {Vault, Unauthorized, NotExpired, ZeroAddress, TransferFailed, ZeroAmount} from "../src/Vault.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MTK") {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }
}

contract VaultTest is Test {
    Vault public vault;
    MockERC20 public token;

    address public owner = address(1);
    address public beneficiary = address(2);
    address public stranger = address(3);
    address public mockFactory = address(99);
    uint256 public constant TIMEOUT_PERIOD = 30 days;

    function setUp() public {
        vault = new Vault(owner, beneficiary, TIMEOUT_PERIOD, mockFactory);
        token = new MockERC20();
        vm.deal(owner, 100 ether);
        vm.deal(stranger, 10 ether);
    }

    // ─── Deployment ──────────────────────────────────────────────────────────

    function test_Deployment() public view {
        assertEq(vault.owner(), owner);
        assertEq(vault.beneficiary(), beneficiary);
        assertEq(vault.timeoutPeriod(), TIMEOUT_PERIOD);
        assertEq(vault.lastPingTime(), block.timestamp);
    }

    function test_RevertIf_ZeroAddressBeneficiary() public {
        vm.expectRevert(ZeroAddress.selector);
        new Vault(owner, address(0), TIMEOUT_PERIOD, mockFactory);
    }

    // ─── Deposit ETH ─────────────────────────────────────────────────────────

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

    // ─── Deposit ERC20 ───────────────────────────────────────────────────────

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

    // ─── Ping ────────────────────────────────────────────────────────────────

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

    // ─── Change Beneficiary ───────────────────────────────────────────────────

    function test_ChangeBeneficiary() public {
        address newBen = address(4);
        vm.prank(owner);
        vault.changeBeneficiary(newBen);
        assertEq(vault.beneficiary(), newBen);
    }

    function test_RevertIf_ChangeBeneficiaryToZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(ZeroAddress.selector);
        vault.changeBeneficiary(address(0));
    }

    function test_RevertIf_ChangeBeneficiaryByStranger() public {
        vm.prank(stranger);
        vm.expectRevert(Unauthorized.selector);
        vault.changeBeneficiary(address(4));
    }

    // ─── Withdraw ETH ────────────────────────────────────────────────────────

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

    // ─── Withdraw ERC20 ──────────────────────────────────────────────────────

    function test_OwnerWithdrawERC20() public {
        uint256 amount = 1000 * 10 ** 18;
        token.approve(address(vault), amount);
        vault.depositERC20(address(token), amount);

        vm.prank(owner);
        vault.withdrawERC20(address(token), 500 * 10 ** 18);
        assertEq(token.balanceOf(address(vault)), 500 * 10 ** 18);
    }

    // ─── Claim ───────────────────────────────────────────────────────────────

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
}
