// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {VaultFactory} from "../src/VaultFactory.sol";
import {Vault} from "../src/Vault.sol";

contract VaultFactoryTest is Test {
    VaultFactory factory;
    
    address alice = address(1);
    address bob = address(2);

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
}
