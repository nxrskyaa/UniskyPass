// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {UniskyPassRegistry} from "../src/UniskyPassRegistry.sol";

interface Vm {
    function envUint(string calldata name) external view returns (uint256 value);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

/// @notice Foundry deployment script for UniskyPassRegistry.
/// @dev The deployer key is read only by Foundry from DEPLOYER_PRIVATE_KEY.
///      Broadcast with --gas-estimate-multiplier 110 because Monad charges the gas limit.
contract Deploy {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external returns (UniskyPassRegistry registry) {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        registry = new UniskyPassRegistry();
        vm.stopBroadcast();
    }
}
