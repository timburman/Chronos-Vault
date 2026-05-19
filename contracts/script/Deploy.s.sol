// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {VaultFactory} from "../src/VaultFactory.sol";

contract DeployFactory is Script {
    function run() external {
        vm.startBroadcast();

        VaultFactory factory = new VaultFactory();
        console.log("VaultFactory deployed at:", address(factory));

        vm.stopBroadcast();
    }
}
