// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {UniskyPassRegistry} from "../src/UniskyPassRegistry.sol";

interface VmTest {
    function deal(address account, uint256 newBalance) external;
    function expectEmit(
        bool checkTopic1,
        bool checkTopic2,
        bool checkTopic3,
        bool checkData,
        address emitter
    ) external;
    function expectRevert(bytes4 revertData) external;
    function prank(address msgSender) external;
    function warp(uint256 newTimestamp) external;
}

contract UniskyPassRegistryTest {
    event IssuerRegistered(address indexed issuer, string name);
    event IssuerNameUpdated(address indexed issuer, string name);
    event ProgramCreated(
        uint256 indexed programId, address indexed issuer, string name, uint64 duration
    );
    event ProgramActiveSet(uint256 indexed programId, bool active);
    event PassIssued(
        uint256 indexed passId,
        uint256 indexed programId,
        address indexed holder,
        address issuer,
        uint64 validFrom,
        uint64 expiresAt
    );
    event PassExtended(uint256 indexed passId, uint64 newExpiresAt);
    event PassRevoked(uint256 indexed passId);

    VmTest private constant vm =
        VmTest(address(uint160(uint256(keccak256("hevm cheat code")))));

    uint256 private constant NOW = 1_800_000_000;
    uint64 private constant DURATION = 30 days;
    uint64 private constant EXTENSION = 7 days;

    address private constant ISSUER = address(0xA11CE);
    address private constant OTHER_ISSUER = address(0xB0B);
    address private constant HOLDER = address(0xCAFE);
    address private constant OTHER_HOLDER = address(0xD00D);

    UniskyPassRegistry private registry;

    function setUp() public {
        vm.warp(NOW);
        registry = new UniskyPassRegistry();
    }

    function testRegisterIssuer() public {
        vm.prank(ISSUER);
        registry.registerIssuer("Optimum Gym");

        UniskyPassRegistry.Issuer memory issuer = registry.getIssuer(ISSUER);
        _assertEq(issuer.name, "Optimum Gym");
        _assertEq(uint256(issuer.registeredAt), NOW);
        _assertTrue(issuer.exists);
        _assertTrue(registry.isIssuer(ISSUER));
    }

    function testDuplicateRegisterReverts() public {
        _registerIssuer(ISSUER, "Optimum Gym");

        vm.expectRevert(UniskyPassRegistry.AlreadyRegistered.selector);
        vm.prank(ISSUER);
        registry.registerIssuer("Another name");
    }

    function testEmptyAndOversizedNamesRevert() public {
        vm.expectRevert(UniskyPassRegistry.InvalidName.selector);
        vm.prank(ISSUER);
        registry.registerIssuer("");

        vm.expectRevert(UniskyPassRegistry.InvalidName.selector);
        vm.prank(ISSUER);
        registry.registerIssuer(string(new bytes(65)));

        _registerIssuer(ISSUER, "Optimum Gym");

        vm.expectRevert(UniskyPassRegistry.InvalidName.selector);
        vm.prank(ISSUER);
        registry.updateIssuerName("");

        vm.expectRevert(UniskyPassRegistry.InvalidName.selector);
        vm.prank(ISSUER);
        registry.createProgram(string(new bytes(65)), DURATION);
    }

    function testNonIssuerCannotUpdateNameOrCreateProgram() public {
        vm.expectRevert(UniskyPassRegistry.NotRegisteredIssuer.selector);
        vm.prank(OTHER_ISSUER);
        registry.updateIssuerName("No profile");

        vm.expectRevert(UniskyPassRegistry.NotRegisteredIssuer.selector);
        vm.prank(OTHER_ISSUER);
        registry.createProgram("Monthly", DURATION);
    }

    function testIssuerCreatesProgram() public {
        _registerIssuer(ISSUER, "Optimum Gym");

        vm.prank(ISSUER);
        uint256 programId = registry.createProgram("Monthly", DURATION);

        _assertEq(programId, 1);
        _assertEq(registry.programCount(), 1);

        UniskyPassRegistry.Program memory program = registry.getProgram(programId);
        _assertEq(program.issuer, ISSUER);
        _assertEq(uint256(program.duration), uint256(DURATION));
        _assertTrue(program.active);
        _assertEq(program.name, "Monthly");

        uint256[] memory ids = registry.getIssuerPrograms(ISSUER);
        _assertEq(ids.length, 1);
        _assertEq(ids[0], 1);
    }

    function testZeroAndOversizedProgramDurationRevert() public {
        _registerIssuer(ISSUER, "Optimum Gym");
        uint64 oversizedDuration = registry.MAX_DURATION() + 1;

        vm.expectRevert(UniskyPassRegistry.InvalidDuration.selector);
        vm.prank(ISSUER);
        registry.createProgram("Zero", 0);

        vm.expectRevert(UniskyPassRegistry.InvalidDuration.selector);
        vm.prank(ISSUER);
        registry.createProgram("Too long", oversizedDuration);
    }

    function testIdsStartAtOneAndIncreaseMonotonically() public {
        _registerIssuer(ISSUER, "Optimum Gym");

        vm.prank(ISSUER);
        uint256 firstProgramId = registry.createProgram("Monthly", DURATION);
        vm.prank(ISSUER);
        uint256 secondProgramId = registry.createProgram("Annual", 365 days);

        vm.prank(ISSUER);
        uint256 firstPassId = registry.issuePass(firstProgramId, HOLDER, 0);
        vm.prank(ISSUER);
        uint256 secondPassId = registry.issuePass(secondProgramId, HOLDER, 0);

        _assertEq(firstProgramId, 1);
        _assertEq(secondProgramId, 2);
        _assertEq(firstPassId, 1);
        _assertEq(secondPassId, 2);
        _assertEq(registry.programCount(), 2);
        _assertEq(registry.passCount(), 2);

        uint256[] memory holderPasses = registry.getHolderPasses(HOLDER);
        _assertEq(holderPasses.length, 2);
        _assertEq(holderPasses[0], 1);
        _assertEq(holderPasses[1], 2);

        uint256[] memory programPasses = registry.getProgramPasses(firstProgramId);
        _assertEq(programPasses.length, 1);
        _assertEq(programPasses[0], 1);
    }

    function testUnknownProgramAndPassUseCustomErrors() public {
        vm.expectRevert(UniskyPassRegistry.ProgramNotFound.selector);
        registry.getProgram(0);

        vm.expectRevert(UniskyPassRegistry.ProgramNotFound.selector);
        registry.setProgramActive(999, false);

        vm.expectRevert(UniskyPassRegistry.PassNotFound.selector);
        registry.getPass(0);

        vm.expectRevert(UniskyPassRegistry.PassNotFound.selector);
        registry.extendPass(999, EXTENSION);

        vm.expectRevert(UniskyPassRegistry.PassNotFound.selector);
        registry.revokePass(999);
    }

    function testNonOwnerCannotMutateAnotherIssuersProgramOrPass() public {
        uint256 programId = _createProgram();

        vm.expectRevert(UniskyPassRegistry.NotProgramIssuer.selector);
        vm.prank(OTHER_ISSUER);
        registry.setProgramActive(programId, false);

        vm.expectRevert(UniskyPassRegistry.NotProgramIssuer.selector);
        vm.prank(OTHER_ISSUER);
        registry.issuePass(programId, HOLDER, 0);

        vm.prank(ISSUER);
        uint256 passId = registry.issuePass(programId, HOLDER, 0);

        vm.expectRevert(UniskyPassRegistry.NotPassIssuer.selector);
        vm.prank(OTHER_ISSUER);
        registry.extendPass(passId, EXTENSION);

        vm.expectRevert(UniskyPassRegistry.NotPassIssuer.selector);
        vm.prank(OTHER_ISSUER);
        registry.revokePass(passId);

        vm.expectRevert(UniskyPassRegistry.NotPassIssuer.selector);
        vm.prank(HOLDER);
        registry.extendPass(passId, EXTENSION);
    }

    function testZeroAddressHolderReverts() public {
        uint256 programId = _createProgram();

        vm.expectRevert(UniskyPassRegistry.ZeroHolder.selector);
        vm.prank(ISSUER);
        registry.issuePass(programId, address(0), 0);
    }

    function testInactiveProgramCannotIssueAndExistingPassIsUnaffected() public {
        uint256 programId = _createProgram();

        vm.prank(ISSUER);
        uint256 existingPassId = registry.issuePass(programId, HOLDER, 0);

        vm.prank(ISSUER);
        registry.setProgramActive(programId, false);

        vm.expectRevert(UniskyPassRegistry.ProgramInactive.selector);
        vm.prank(ISSUER);
        registry.issuePass(programId, OTHER_HOLDER, 0);

        _assertTrue(registry.isPassValid(existingPassId));
    }

    function testPastNonZeroValidFromReverts() public {
        uint256 programId = _createProgram();

        vm.expectRevert(UniskyPassRegistry.InvalidValidFrom.selector);
        vm.prank(ISSUER);
        registry.issuePass(programId, HOLDER, uint64(NOW - 1));
    }

    function testFutureStartPassIsNotStartedAndInvalid() public {
        uint256 programId = _createProgram();
        uint64 start = uint64(NOW + 1 days);

        vm.prank(ISSUER);
        uint256 passId = registry.issuePass(programId, HOLDER, start);

        _assertStatus(passId, UniskyPassRegistry.PassStatus.NotStarted);
        _assertFalse(registry.isPassValid(passId));

        vm.warp(start);
        _assertStatus(passId, UniskyPassRegistry.PassStatus.Active);
        _assertTrue(registry.isPassValid(passId));
    }

    function testActivePassIsValidUsingOnlyChainTime() public {
        uint256 passId = _issueActivePass();

        _assertStatus(passId, UniskyPassRegistry.PassStatus.Active);
        _assertTrue(registry.isPassValid(passId));

        vm.warp(NOW + DURATION - 1);
        _assertStatus(passId, UniskyPassRegistry.PassStatus.Active);
        _assertTrue(registry.isPassValid(passId));
    }

    function testPassExpiresExactlyAtExpiresAt() public {
        uint256 passId = _issueActivePass();

        vm.warp(NOW + DURATION);

        _assertStatus(passId, UniskyPassRegistry.PassStatus.Expired);
        _assertFalse(registry.isPassValid(passId));
    }

    function testRevocationIsPermanentAndRevokedPassCannotBeExtended() public {
        uint256 passId = _issueActivePass();

        vm.prank(ISSUER);
        registry.revokePass(passId);

        _assertStatus(passId, UniskyPassRegistry.PassStatus.Revoked);
        _assertFalse(registry.isPassValid(passId));

        vm.warp(NOW + 10 * 365 days);
        _assertStatus(passId, UniskyPassRegistry.PassStatus.Revoked);

        vm.expectRevert(UniskyPassRegistry.PassIsRevoked.selector);
        vm.prank(ISSUER);
        registry.extendPass(passId, EXTENSION);

        vm.expectRevert(UniskyPassRegistry.PassIsRevoked.selector);
        vm.prank(ISSUER);
        registry.revokePass(passId);
    }

    function testExtendActivePassAddsToCurrentExpiry() public {
        uint256 passId = _issueActivePass();
        uint64 oldExpiry = registry.getPass(passId).expiresAt;

        vm.warp(NOW + 1 days);
        vm.prank(ISSUER);
        registry.extendPass(passId, EXTENSION);

        uint64 newExpiry = registry.getPass(passId).expiresAt;
        _assertEq(uint256(newExpiry), uint256(oldExpiry + EXTENSION));
        _assertTrue(newExpiry > oldExpiry);
    }

    function testExtendExpiredPassRenewsFromCurrentChainTime() public {
        uint256 passId = _issueActivePass();
        uint64 oldExpiry = registry.getPass(passId).expiresAt;
        uint256 renewalTime = uint256(oldExpiry) + 2 days;

        vm.warp(renewalTime);
        vm.prank(ISSUER);
        registry.extendPass(passId, EXTENSION);

        uint64 newExpiry = registry.getPass(passId).expiresAt;
        _assertEq(uint256(newExpiry), renewalTime + EXTENSION);
        _assertTrue(newExpiry > oldExpiry);
        _assertStatus(passId, UniskyPassRegistry.PassStatus.Active);
    }

    function testZeroAndOversizedExtensionRevertWithoutShorteningExpiry() public {
        uint256 passId = _issueActivePass();
        uint64 oldExpiry = registry.getPass(passId).expiresAt;
        uint64 oversizedDuration = registry.MAX_DURATION() + 1;

        vm.expectRevert(UniskyPassRegistry.InvalidDuration.selector);
        vm.prank(ISSUER);
        registry.extendPass(passId, 0);

        vm.expectRevert(UniskyPassRegistry.InvalidDuration.selector);
        vm.prank(ISSUER);
        registry.extendPass(passId, oversizedDuration);

        _assertEq(uint256(registry.getPass(passId).expiresAt), uint256(oldExpiry));
    }

    function testUnknownPassStatusIsNonRevertingNotFound() public view {
        _assertStatus(0, UniskyPassRegistry.PassStatus.NotFound);
        _assertStatus(999, UniskyPassRegistry.PassStatus.NotFound);
        _assertFalse(registry.isPassValid(999));
    }

    function testIsPassValidForMatrix() public {
        uint256 passId = _issueActivePass();

        _assertTrue(registry.isPassValidFor(passId, HOLDER, ISSUER, 1));
        _assertFalse(registry.isPassValidFor(passId, OTHER_HOLDER, ISSUER, 1));
        _assertFalse(registry.isPassValidFor(passId, HOLDER, OTHER_ISSUER, 1));
        _assertFalse(registry.isPassValidFor(passId, HOLDER, ISSUER, 2));
        _assertFalse(registry.isPassValidFor(999, HOLDER, ISSUER, 1));

        vm.prank(ISSUER);
        registry.revokePass(passId);
        _assertFalse(registry.isPassValidFor(passId, HOLDER, ISSUER, 1));
    }

    function testPlainMonTransferRevertsAndContractRetainsNoFunds() public {
        vm.deal(address(this), 1 ether);

        (bool success,) = payable(address(registry)).call{value: 1 ether}("");

        _assertFalse(success);
        _assertEq(address(registry).balance, 0);
    }

    function testNonPayableMutationRejectsMon() public {
        vm.deal(address(this), 1 ether);

        (bool success,) = address(registry).call{value: 1}(
            abi.encodeCall(UniskyPassRegistry.registerIssuer, ("Funded registration"))
        );

        _assertFalse(success);
        _assertFalse(registry.isIssuer(address(this)));
        _assertEq(address(registry).balance, 0);
    }

    function testNoTokenTransferSurfaceExists() public {
        (bool transferSuccess,) = address(registry).call(
            abi.encodeWithSignature("transfer(address,uint256)", OTHER_HOLDER, 1)
        );
        (bool transferFromSuccess,) = address(registry).call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", HOLDER, OTHER_HOLDER, 1)
        );
        (bool safeTransferSuccess,) = address(registry).call(
            abi.encodeWithSignature(
                "safeTransferFrom(address,address,uint256)", HOLDER, OTHER_HOLDER, 1
            )
        );

        _assertFalse(transferSuccess);
        _assertFalse(transferFromSuccess);
        _assertFalse(safeTransferSuccess);
    }

    function testNoOwnerOrAdminSurfaceExists() public view {
        (bool ownerSuccess,) = address(registry).staticcall(abi.encodeWithSignature("owner()"));
        (bool adminSuccess,) = address(registry).staticcall(abi.encodeWithSignature("admin()"));

        _assertFalse(ownerSuccess);
        _assertFalse(adminSuccess);
    }

    function testAllMutationEventsCarryCorrectArguments() public {
        vm.expectEmit(true, false, false, true, address(registry));
        emit IssuerRegistered(ISSUER, "Optimum Gym");
        vm.prank(ISSUER);
        registry.registerIssuer("Optimum Gym");

        vm.expectEmit(true, false, false, true, address(registry));
        emit IssuerNameUpdated(ISSUER, "Optimum Studio");
        vm.prank(ISSUER);
        registry.updateIssuerName("Optimum Studio");

        vm.expectEmit(true, true, false, true, address(registry));
        emit ProgramCreated(1, ISSUER, "Monthly", DURATION);
        vm.prank(ISSUER);
        uint256 programId = registry.createProgram("Monthly", DURATION);

        vm.expectEmit(true, false, false, true, address(registry));
        emit ProgramActiveSet(programId, false);
        vm.prank(ISSUER);
        registry.setProgramActive(programId, false);

        vm.expectEmit(true, false, false, true, address(registry));
        emit ProgramActiveSet(programId, true);
        vm.prank(ISSUER);
        registry.setProgramActive(programId, true);

        vm.expectEmit(true, true, true, true, address(registry));
        emit PassIssued(
            1, programId, HOLDER, ISSUER, uint64(NOW), uint64(NOW) + DURATION
        );
        vm.prank(ISSUER);
        uint256 passId = registry.issuePass(programId, HOLDER, 0);

        uint64 extendedExpiry = uint64(NOW) + DURATION + EXTENSION;
        vm.expectEmit(true, false, false, true, address(registry));
        emit PassExtended(passId, extendedExpiry);
        vm.prank(ISSUER);
        registry.extendPass(passId, EXTENSION);

        vm.expectEmit(true, false, false, true, address(registry));
        emit PassRevoked(passId);
        vm.prank(ISSUER);
        registry.revokePass(passId);
    }

    function _registerIssuer(address issuer, string memory name) private {
        vm.prank(issuer);
        registry.registerIssuer(name);
    }

    function _createProgram() private returns (uint256 programId) {
        _registerIssuer(ISSUER, "Optimum Gym");
        vm.prank(ISSUER);
        programId = registry.createProgram("Monthly", DURATION);
    }

    function _issueActivePass() private returns (uint256 passId) {
        uint256 programId = _createProgram();
        vm.prank(ISSUER);
        passId = registry.issuePass(programId, HOLDER, 0);
    }

    function _assertStatus(uint256 passId, UniskyPassRegistry.PassStatus expected)
        private
        view
    {
        _assertEq(uint256(registry.getPassStatus(passId)), uint256(expected));
    }

    function _assertTrue(bool condition) private pure {
        require(condition, "assert true failed");
    }

    function _assertFalse(bool condition) private pure {
        require(!condition, "assert false failed");
    }

    function _assertEq(uint256 actual, uint256 expected) private pure {
        require(actual == expected, "uint assertion failed");
    }

    function _assertEq(address actual, address expected) private pure {
        require(actual == expected, "address assertion failed");
    }

    function _assertEq(string memory actual, string memory expected) private pure {
        require(
            keccak256(bytes(actual)) == keccak256(bytes(expected)), "string assertion failed"
        );
    }
}
