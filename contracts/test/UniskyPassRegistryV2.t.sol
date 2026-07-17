// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {UniskyPassRegistryV2} from "../src/UniskyPassRegistryV2.sol";

interface VmTestV2 {
    function deal(address account, uint256 newBalance) external;
    function prank(address msgSender) external;
    function warp(uint256 newTimestamp) external;
    function expectRevert(bytes4 revertData) external;
}

contract UniskyPassRegistryV2Test {
    VmTestV2 private constant vm =
        VmTestV2(address(uint160(uint256(keccak256("hevm cheat code")))));

    uint256 private constant NOW = 1_800_000_000;
    uint64 private constant DURATION = 30 days;

    address private constant ISSUER = address(0xA11CE);
    address private constant HOLDER = address(0xCAFE);
    address private constant OTHER = address(0xD00D);

    UniskyPassRegistryV2 private registry;

    function setUp() public {
        vm.warp(NOW);
        registry = new UniskyPassRegistryV2();
    }

    function testV1IssueSignatureStillWorksWithEmptyDetails() public {
        uint256 programId = _createProgram();

        vm.prank(ISSUER);
        uint256 passId = registry.issuePass(programId, HOLDER, 0);

        UniskyPassRegistryV2.Pass memory pass = registry.getPass(passId);
        _assertEq(pass.holder, HOLDER);
        _assertEq(pass.memberLabel, "");
        _assertEq(pass.issuerNote, "");
        _assertTrue(registry.isPassValid(passId));
    }

    function testIssueWithDetailsStoresPublicMetadata() public {
        uint256 programId = _createProgram();

        vm.prank(ISSUER);
        uint256 passId = registry.issuePassWithDetails(
            programId, HOLDER, 0, "Alex", "Annual member / front desk note"
        );

        UniskyPassRegistryV2.Pass memory pass = registry.getPass(passId);
        _assertEq(pass.memberLabel, "Alex");
        _assertEq(pass.issuerNote, "Annual member / front desk note");
    }

    function testIssuerCanUpdateDetailsAndHolderCanUpdateOwnLabel() public {
        uint256 passId = _issuePassWithDetails();

        vm.prank(ISSUER);
        registry.updatePassDetails(passId, "Alex R", "Renewal approved");
        _assertEq(registry.getPass(passId).issuerNote, "Renewal approved");

        vm.prank(HOLDER);
        registry.updateMemberLabel(passId, "Alex");
        _assertEq(registry.getPass(passId).memberLabel, "Alex");
    }

    function testOnlyIssuerOrHolderCanUpdateTheirMetadata() public {
        uint256 passId = _issuePassWithDetails();

        vm.expectRevert(UniskyPassRegistryV2.NotPassIssuer.selector);
        vm.prank(OTHER);
        registry.updatePassDetails(passId, "Nope", "Nope");

        vm.expectRevert(UniskyPassRegistryV2.NotPassHolder.selector);
        vm.prank(OTHER);
        registry.updateMemberLabel(passId, "Nope");
    }

    function testMetadataBoundsRevert() public {
        uint256 programId = _createProgram();
        string memory oversizedLabel = string(new bytes(65));
        string memory oversizedNote = string(new bytes(161));

        vm.expectRevert(UniskyPassRegistryV2.InvalidLabel.selector);
        vm.prank(ISSUER);
        registry.issuePassWithDetails(programId, HOLDER, 0, oversizedLabel, "");

        vm.expectRevert(UniskyPassRegistryV2.InvalidNote.selector);
        vm.prank(ISSUER);
        registry.issuePassWithDetails(programId, HOLDER, 0, "Alex", oversizedNote);
    }

    function testRevokedPassCannotChangeMetadata() public {
        uint256 passId = _issuePassWithDetails();

        vm.prank(ISSUER);
        registry.revokePass(passId);

        vm.expectRevert(UniskyPassRegistryV2.PassIsRevoked.selector);
        vm.prank(ISSUER);
        registry.updatePassDetails(passId, "Alex", "Updated");

        vm.expectRevert(UniskyPassRegistryV2.PassIsRevoked.selector);
        vm.prank(HOLDER);
        registry.updateMemberLabel(passId, "Alex");
    }

    function testNoFundsAndNoTokenTransferSurface() public {
        vm.deal(address(this), 1 ether);
        (bool received,) = payable(address(registry)).call{value: 1 ether}("");
        _assertFalse(received);
        _assertEq(address(registry).balance, 0);

        (bool transferSuccess,) = address(registry).call(
            abi.encodeWithSignature("transfer(address,uint256)", OTHER, 1)
        );
        _assertFalse(transferSuccess);
    }

    function _createProgram() private returns (uint256 programId) {
        vm.prank(ISSUER);
        registry.registerIssuer("Optimum Gym");
        vm.prank(ISSUER);
        programId = registry.createProgram("Monthly", DURATION);
    }

    function _issuePassWithDetails() private returns (uint256 passId) {
        uint256 programId = _createProgram();
        vm.prank(ISSUER);
        passId = registry.issuePassWithDetails(programId, HOLDER, 0, "Pending label", "Front desk");
    }

    function _assertTrue(bool condition) private pure {
        require(condition, "assert true failed");
    }

    function _assertFalse(bool condition) private pure {
        require(!condition, "assert false failed");
    }

    function _assertEq(address actual, address expected) private pure {
        require(actual == expected, "address assertion failed");
    }

    function _assertEq(uint256 actual, uint256 expected) private pure {
        require(actual == expected, "uint assertion failed");
    }

    function _assertEq(string memory actual, string memory expected) private pure {
        require(keccak256(bytes(actual)) == keccak256(bytes(expected)), "string assertion failed");
    }
}
