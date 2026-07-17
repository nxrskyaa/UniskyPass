// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title UniskyPassRegistryV2
/// @notice Verifiable, time-based, non-transferable membership records on Monad.
///
/// V2 keeps the V1 contract's security model and adds two kinds of optional,
/// public metadata:
/// - memberLabel: a short display label for the wallet holder;
/// - issuerNote: a short operational note for the issuing place.
///
/// These strings are public and permanent until changed by the authorised party.
/// Never put email addresses, phone numbers, legal names, IDs, or other sensitive
/// personal data in them. The wallet address remains the canonical identity.
///
/// This is a fresh deployment, not an upgrade. V1 state is not copied or migrated.
contract UniskyPassRegistryV2 {
    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------

    struct Issuer {
        string name;
        uint64 registeredAt;
        bool exists;
    }

    struct Program {
        address issuer;
        uint64 duration;
        bool active;
        string name;
    }

    struct Pass {
        uint256 programId;
        address issuer;
        address holder;
        uint64 issuedAt;
        uint64 validFrom;
        uint64 expiresAt;
        bool revoked;
        string memberLabel;
        string issuerNote;
    }

    enum PassStatus {
        NotFound,
        NotStarted,
        Active,
        Expired,
        Revoked
    }

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error AlreadyRegistered();
    error NotRegisteredIssuer();
    error InvalidName();
    error InvalidLabel();
    error InvalidNote();
    error InvalidDuration();
    error InvalidValidFrom();
    error ZeroHolder();
    error ProgramNotFound();
    error ProgramInactive();
    error NotProgramIssuer();
    error PassNotFound();
    error NotPassIssuer();
    error NotPassHolder();
    error PassIsRevoked();

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

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
        uint64 expiresAt,
        string memberLabel,
        string issuerNote
    );
    event PassDetailsUpdated(uint256 indexed passId, string memberLabel, string issuerNote);
    event MemberLabelUpdated(uint256 indexed passId, string memberLabel);
    event PassExtended(uint256 indexed passId, uint64 newExpiresAt);
    event PassRevoked(uint256 indexed passId);

    // ---------------------------------------------------------------------
    // Constants and storage
    // ---------------------------------------------------------------------

    uint256 public constant MAX_NAME_BYTES = 64;
    uint256 public constant MAX_LABEL_BYTES = 64;
    uint256 public constant MAX_NOTE_BYTES = 160;
    uint64 public constant MAX_DURATION = 3650 days;

    uint256 public programCount;
    uint256 public passCount;

    mapping(address => Issuer) private _issuers;
    mapping(uint256 => Program) private _programs;
    mapping(uint256 => Pass) private _passes;
    mapping(address => uint256[]) private _issuerPrograms;
    mapping(address => uint256[]) private _holderPasses;
    mapping(uint256 => uint256[]) private _programPasses;

    // ---------------------------------------------------------------------
    // Issuer actions
    // ---------------------------------------------------------------------

    function registerIssuer(string calldata name) external {
        if (_issuers[msg.sender].exists) revert AlreadyRegistered();
        _checkName(name);
        _issuers[msg.sender] =
            Issuer({name: name, registeredAt: uint64(block.timestamp), exists: true});
        emit IssuerRegistered(msg.sender, name);
    }

    function updateIssuerName(string calldata name) external {
        if (!_issuers[msg.sender].exists) revert NotRegisteredIssuer();
        _checkName(name);
        _issuers[msg.sender].name = name;
        emit IssuerNameUpdated(msg.sender, name);
    }

    function createProgram(string calldata name, uint64 duration)
        external
        returns (uint256 programId)
    {
        if (!_issuers[msg.sender].exists) revert NotRegisteredIssuer();
        _checkName(name);
        if (duration == 0 || duration > MAX_DURATION) revert InvalidDuration();

        programId = ++programCount;
        _programs[programId] =
            Program({issuer: msg.sender, duration: duration, active: true, name: name});
        _issuerPrograms[msg.sender].push(programId);
        emit ProgramCreated(programId, msg.sender, name, duration);
    }

    function setProgramActive(uint256 programId, bool active) external {
        Program storage program = _requireProgram(programId);
        if (program.issuer != msg.sender) revert NotProgramIssuer();
        program.active = active;
        emit ProgramActiveSet(programId, active);
    }

    /// @notice V1-compatible issue path with empty optional metadata.
    function issuePass(uint256 programId, address holder, uint64 validFrom)
        external
        returns (uint256 passId)
    {
        return _issuePass(programId, holder, validFrom, "", "");
    }

    /// @notice Issue a pass with optional public display metadata.
    /// @dev Do not use these fields for sensitive or legal identity data.
    function issuePassWithDetails(
        uint256 programId,
        address holder,
        uint64 validFrom,
        string calldata memberLabel,
        string calldata issuerNote
    ) external returns (uint256 passId) {
        _checkLabel(memberLabel);
        _checkNote(issuerNote);
        return _issuePass(programId, holder, validFrom, memberLabel, issuerNote);
    }

    /// @notice Issuers can correct the public label and operational note.
    function updatePassDetails(
        uint256 passId,
        string calldata memberLabel,
        string calldata issuerNote
    ) external {
        Pass storage pass = _requirePass(passId);
        if (pass.issuer != msg.sender) revert NotPassIssuer();
        if (pass.revoked) revert PassIsRevoked();
        _checkLabel(memberLabel);
        _checkNote(issuerNote);

        pass.memberLabel = memberLabel;
        pass.issuerNote = issuerNote;
        emit PassDetailsUpdated(passId, memberLabel, issuerNote);
    }

    /// @notice The holder may set their own short public display label.
    function updateMemberLabel(uint256 passId, string calldata memberLabel) external {
        Pass storage pass = _requirePass(passId);
        if (pass.holder != msg.sender) revert NotPassHolder();
        if (pass.revoked) revert PassIsRevoked();
        _checkLabel(memberLabel);

        pass.memberLabel = memberLabel;
        emit MemberLabelUpdated(passId, memberLabel);
    }

    function extendPass(uint256 passId, uint64 extraSeconds) external {
        Pass storage pass = _requirePass(passId);
        if (pass.issuer != msg.sender) revert NotPassIssuer();
        if (pass.revoked) revert PassIsRevoked();
        if (extraSeconds == 0 || extraSeconds > MAX_DURATION) revert InvalidDuration();

        uint64 nowTs = uint64(block.timestamp);
        uint64 base = pass.expiresAt > nowTs ? pass.expiresAt : nowTs;
        pass.expiresAt = base + extraSeconds;
        emit PassExtended(passId, pass.expiresAt);
    }

    function revokePass(uint256 passId) external {
        Pass storage pass = _requirePass(passId);
        if (pass.issuer != msg.sender) revert NotPassIssuer();
        if (pass.revoked) revert PassIsRevoked();
        pass.revoked = true;
        emit PassRevoked(passId);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function getIssuer(address issuer) external view returns (Issuer memory) {
        return _issuers[issuer];
    }

    function isIssuer(address issuer) external view returns (bool) {
        return _issuers[issuer].exists;
    }

    function getProgram(uint256 programId) external view returns (Program memory) {
        Program storage program = _programs[programId];
        if (program.issuer == address(0)) revert ProgramNotFound();
        return program;
    }

    function getPass(uint256 passId) external view returns (Pass memory) {
        Pass storage pass = _passes[passId];
        if (pass.issuer == address(0)) revert PassNotFound();
        return pass;
    }

    function getIssuerPrograms(address issuer) external view returns (uint256[] memory) {
        return _issuerPrograms[issuer];
    }

    function getHolderPasses(address holder) external view returns (uint256[] memory) {
        return _holderPasses[holder];
    }

    function getProgramPasses(uint256 programId) external view returns (uint256[] memory) {
        return _programPasses[programId];
    }

    function isPassValid(uint256 passId) public view returns (bool) {
        return getPassStatus(passId) == PassStatus.Active;
    }

    function getPassStatus(uint256 passId) public view returns (PassStatus) {
        Pass storage pass = _passes[passId];
        if (pass.issuer == address(0)) return PassStatus.NotFound;
        if (pass.revoked) return PassStatus.Revoked;
        uint64 nowTs = uint64(block.timestamp);
        if (nowTs < pass.validFrom) return PassStatus.NotStarted;
        if (nowTs >= pass.expiresAt) return PassStatus.Expired;
        return PassStatus.Active;
    }

    function isPassValidFor(
        uint256 passId,
        address expectedHolder,
        address expectedIssuer,
        uint256 expectedProgramId
    ) external view returns (bool) {
        Pass storage pass = _passes[passId];
        return isPassValid(passId) && pass.holder == expectedHolder
            && pass.issuer == expectedIssuer && pass.programId == expectedProgramId;
    }

    // ---------------------------------------------------------------------
    // Internal
    // ---------------------------------------------------------------------

    function _issuePass(
        uint256 programId,
        address holder,
        uint64 validFrom,
        string memory memberLabel,
        string memory issuerNote
    ) private returns (uint256 passId) {
        Program storage program = _requireProgram(programId);
        if (program.issuer != msg.sender) revert NotProgramIssuer();
        if (!program.active) revert ProgramInactive();
        if (holder == address(0)) revert ZeroHolder();

        uint64 nowTs = uint64(block.timestamp);
        uint64 start;
        if (validFrom == 0) {
            start = nowTs;
        } else {
            if (validFrom < nowTs) revert InvalidValidFrom();
            start = validFrom;
        }

        passId = ++passCount;
        _passes[passId] = Pass({
            programId: programId,
            issuer: msg.sender,
            holder: holder,
            issuedAt: nowTs,
            validFrom: start,
            expiresAt: start + program.duration,
            revoked: false,
            memberLabel: memberLabel,
            issuerNote: issuerNote
        });
        _holderPasses[holder].push(passId);
        _programPasses[programId].push(passId);
        emit PassIssued(
            passId,
            programId,
            holder,
            msg.sender,
            start,
            start + program.duration,
            memberLabel,
            issuerNote
        );
    }

    function _checkName(string calldata name) private pure {
        uint256 length = bytes(name).length;
        if (length == 0 || length > MAX_NAME_BYTES) revert InvalidName();
    }

    function _checkLabel(string calldata label) private pure {
        if (bytes(label).length > MAX_LABEL_BYTES) revert InvalidLabel();
    }

    function _checkNote(string calldata note) private pure {
        if (bytes(note).length > MAX_NOTE_BYTES) revert InvalidNote();
    }

    function _requireProgram(uint256 programId) private view returns (Program storage program) {
        program = _programs[programId];
        if (program.issuer == address(0)) revert ProgramNotFound();
    }

    function _requirePass(uint256 passId) private view returns (Pass storage pass) {
        pass = _passes[passId];
        if (pass.issuer == address(0)) revert PassNotFound();
    }
}
