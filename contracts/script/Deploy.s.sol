// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {VaultFactory} from "../src/VaultFactory.sol";

contract DeployFactory is Script {
    function run() external {
        // Anvil's first default private key (account[0])
        // 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
        uint256 deployerKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

        vm.startBroadcast(deployerKey);

        VaultFactory factory = new VaultFactory();
        console.log("VaultFactory deployed at:", address(factory));

        vm.stopBroadcast();
    }
}
