// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {VaultFactory} from "../src/VaultFactory.sol";
import {Vault} from "../src/Vault.sol";

contract VaultFactoryTest is Test {
    VaultFactory factory;
    
    address alice = address(1);
    address bob = address(2);
    address stranger = address(3);

    function setUp() public {
        factory = new VaultFactory();
    }

    function test_CreateVault() public {
        vm.prank(alice);
        address vaultAddress = factory.createVault(bob, 30 days);
        
        Vault vault = Vault(payable(vaultAddress));
        
        assertEq(vault.owner(), alice);
        assertEq(vault.beneficiary(), bob);
        assertEq(vault.timeoutPeriod(), 30 days);
        
        address[] memory aliceVaults = factory.getOwnerVaults(alice);
        assertEq(aliceVaults.length, 1);
        assertEq(aliceVaults[0], vaultAddress);

        address[] memory bobBeneficiaryVaults = factory.getBeneficiaryVaults(bob);
        assertEq(bobBeneficiaryVaults.length, 1);
        assertEq(bobBeneficiaryVaults[0], vaultAddress);
    }

    function test_CreateVaultWithAlias() public {
        vm.prank(alice);
        address vaultAddress = factory.createVaultWithAlias(bob, 30 days, "Dad's Crypto");
        
        assertEq(factory.vaultAlias(vaultAddress), "Dad's Crypto");
        
        Vault vault = Vault(payable(vaultAddress));
        assertEq(vault.owner(), alice);
    }

    function test_CreateVault_NoAlias() public {
        vm.prank(alice);
        address vaultAddress = factory.createVault(bob, 30 days);
        
        // Default alias should be empty
        assertEq(bytes(factory.vaultAlias(vaultAddress)).length, 0);
    }

    function test_SetVaultAlias() public {
        vm.prank(alice);
        address vaultAddress = factory.createVault(bob, 30 days);
        
        vm.prank(alice);
        factory.setVaultAlias(vaultAddress, "College Fund");
        assertEq(factory.vaultAlias(vaultAddress), "College Fund");
    }

    function test_SetVaultAlias_Update() public {
        vm.prank(alice);
        address vaultAddress = factory.createVaultWithAlias(bob, 30 days, "Original");
        
        vm.prank(alice);
        factory.setVaultAlias(vaultAddress, "Updated Name");
        assertEq(factory.vaultAlias(vaultAddress), "Updated Name");
    }

    function test_RevertIf_SetAlias_NotOwner() public {
        vm.prank(alice);
        address vaultAddress = factory.createVault(bob, 30 days);
        
        vm.prank(stranger);
        vm.expectRevert();
        factory.setVaultAlias(vaultAddress, "Hacked");
    }

    function test_CreateMultipleVaults() public {
        vm.startPrank(alice);
        address vault1 = factory.createVaultWithAlias(bob, 30 days, "Personal");
        address vault2 = factory.createVaultWithAlias(stranger, 90 days, "Business");
        vm.stopPrank();
        
        address[] memory aliceVaults = factory.getOwnerVaults(alice);
        assertEq(aliceVaults.length, 2);
        assertEq(aliceVaults[0], vault1);
        assertEq(aliceVaults[1], vault2);
        
        assertEq(factory.vaultAlias(vault1), "Personal");
        assertEq(factory.vaultAlias(vault2), "Business");
    }
}
