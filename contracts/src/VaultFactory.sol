// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Vault} from "./Vault.sol";

error Unauthorized();

contract VaultFactory {
    // Keep track of all vaults deployed by an owner
    mapping(address => address[]) public ownerVaults;
    
    // Keep track of all vaults where an address is listed as beneficiary
    mapping(address => address[]) public beneficiaryVaults;

    // Human-readable alias for each vault (optional)
    mapping(address => string) public vaultAlias;

    event VaultCreated(address indexed owner, address indexed beneficiary, address vault, string alias_);

    function createVault(address _beneficiary, uint256 _timeoutPeriod) external returns (address) {
        return _createVault(_beneficiary, _timeoutPeriod, "");
    }

    function createVaultWithAlias(
        address _beneficiary,
        uint256 _timeoutPeriod,
        string calldata _alias
    ) external returns (address) {
        return _createVault(_beneficiary, _timeoutPeriod, _alias);
    }

    function _createVault(
        address _beneficiary,
        uint256 _timeoutPeriod,
        string memory _alias
    ) internal returns (address) {
        // Deploy a new vault
        Vault newVault = new Vault(msg.sender, _beneficiary, _timeoutPeriod, address(this));
        
        // Track the vault
        ownerVaults[msg.sender].push(address(newVault));
        beneficiaryVaults[_beneficiary].push(address(newVault));

        // Store alias if provided
        if (bytes(_alias).length > 0) {
            vaultAlias[address(newVault)] = _alias;
        }
        
        emit VaultCreated(msg.sender, _beneficiary, address(newVault), _alias);
        
        return address(newVault);
    }

    /// @notice Owner of a vault can update its alias
    function setVaultAlias(address _vault, string calldata _alias) external {
        // Verify caller owns this vault
        Vault vault = Vault(payable(_vault));
        if (vault.owner() != msg.sender) revert Unauthorized();
        vaultAlias[_vault] = _alias;
    }

    function getOwnerVaults(address _owner) external view returns (address[] memory) {
        return ownerVaults[_owner];
    }

    function getBeneficiaryVaults(address _beneficiary) external view returns (address[] memory) {
        return beneficiaryVaults[_beneficiary];
    }
}
