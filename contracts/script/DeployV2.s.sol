// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {UniskyPassRegistryV2} from "../src/UniskyPassRegistryV2.sol";

interface Vm {
    function envUint(string calldata name) external view returns (uint256 value);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

/// @notice Foundry deployment script for the fresh UniskyPassRegistryV2.
/// @dev DEPLOYER_PRIVATE_KEY is read only by Foundry and must never be exposed to
///      the frontend or committed. Monad charges the gas limit, so broadcast with
///      --gas-estimate-multiplier 110 against the target RPC.
contract DeployV2 {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external returns (UniskyPassRegistryV2 registry) {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        registry = new UniskyPassRegistryV2();
        vm.stopBroadcast();
    }
}
