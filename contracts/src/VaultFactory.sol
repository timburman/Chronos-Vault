// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Vault} from "./Vault.sol";

contract VaultFactory {
    // Keep track of all vaults deployed by an owner
    mapping(address => address[]) public ownerVaults;
    
    // Keep track of all vaults where an address is listed as beneficiary
    mapping(address => address[]) public beneficiaryVaults;

    event VaultCreated(address indexed owner, address indexed beneficiary, address vault);

    function createVault(address _beneficiary, uint256 _timeoutPeriod) external returns (address) {
        // Deploy a new vault
        Vault newVault = new Vault(msg.sender, _beneficiary, _timeoutPeriod, address(this));
        
        // Track the vault
        ownerVaults[msg.sender].push(address(newVault));
        beneficiaryVaults[_beneficiary].push(address(newVault));
        
        emit VaultCreated(msg.sender, _beneficiary, address(newVault));
        
        return address(newVault);
    }

    function getOwnerVaults(address _owner) external view returns (address[] memory) {
        return ownerVaults[_owner];
    }

    function getBeneficiaryVaults(address _beneficiary) external view returns (address[] memory) {
        return beneficiaryVaults[_beneficiary];
    }
    
    // Fallback sync (if we wanted the Factory to keep mapping perfectly in sync 
    // when Vault beneficiary changes, but we'll optimize for gas by not strictly
    // deleting old mappings, instead the latest Vault contract state is truth).
}
