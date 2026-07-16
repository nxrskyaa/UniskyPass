// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title UniskyPassRegistry
/// @notice Onchain registry for verifiable, time-based, NON-TRANSFERABLE membership
///         passes on Monad. One wallet for every place you belong.
///
///         Design guarantees:
///         - Holds NO funds: no payable functions, no receive/fallback, no withdrawals.
///         - No owner / admin / upgradeability: every issuer controls only its own
///           programs and passes.
///         - Passes are plain records, not tokens: there is no transfer function of
///           any kind, so a pass can never change holder.
///         - Validity is derived from chain time (block.timestamp) only.
///         - Stores only wallet addresses + short display names. Never store personal
///           data (emails, phone numbers, legal names) in the name fields.
///
///         Documented rules:
///         - Revocation is PERMANENT. A revoked pass can never be extended or become
///           valid again; the issuer must issue a new pass instead.
///         - Extending an ACTIVE pass adds time to its current expiry. Extending an
///           EXPIRED (but not revoked) pass renews it from the current chain time.
///           Expiry can never be shortened.
///         - Program and pass ids start at 1; id 0 always means "not found".
contract UniskyPassRegistry {
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
        uint64 duration; // pass validity length in seconds
        bool active; // inactive programs cannot issue new passes
        string name;
    }

    struct Pass {
        uint256 programId;
        address issuer; // denormalized from the program for cheap auth checks
        address holder;
        uint64 issuedAt;
        uint64 validFrom;
        uint64 expiresAt;
        bool revoked;
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
    error InvalidName(); // empty or longer than MAX_NAME_BYTES
    error InvalidDuration(); // zero or longer than MAX_DURATION
    error InvalidValidFrom(); // non-zero validFrom in the past
    error ZeroHolder();
    error ProgramNotFound();
    error ProgramInactive();
    error NotProgramIssuer();
    error PassNotFound();
    error NotPassIssuer();
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
        uint64 expiresAt
    );
    event PassExtended(uint256 indexed passId, uint64 newExpiresAt);
    event PassRevoked(uint256 indexed passId);

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    uint256 public constant MAX_NAME_BYTES = 64;
    uint64 public constant MAX_DURATION = 3650 days; // 10 years

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

    /// @notice Register the calling wallet as an issuer. Any wallet may be both a
    ///         member (pass holder) and an issuer; roles are never exclusive.
    function registerIssuer(string calldata name) external {
        if (_issuers[msg.sender].exists) revert AlreadyRegistered();
        _checkName(name);
        _issuers[msg.sender] =
            Issuer({name: name, registeredAt: uint64(block.timestamp), exists: true});
        emit IssuerRegistered(msg.sender, name);
    }

    /// @notice Update the caller's issuer display name.
    function updateIssuerName(string calldata name) external {
        if (!_issuers[msg.sender].exists) revert NotRegisteredIssuer();
        _checkName(name);
        _issuers[msg.sender].name = name;
        emit IssuerNameUpdated(msg.sender, name);
    }

    /// @notice Create a time-based pass program owned by the caller.
    /// @param duration Validity length in seconds granted to each issued pass.
    /// @return programId The new program id (ids start at 1).
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

    /// @notice Pause or resume a program. Inactive programs cannot issue new passes;
    ///         passes already issued are unaffected.
    function setProgramActive(uint256 programId, bool active) external {
        Program storage p = _requireProgram(programId);
        if (p.issuer != msg.sender) revert NotProgramIssuer();
        p.active = active;
        emit ProgramActiveSet(programId, active);
    }

    /// @notice Issue a pass to a holder wallet under one of the caller's programs.
    /// @param validFrom Unix timestamp when the pass starts. Pass 0 to start now.
    ///        A non-zero value must not be in the past.
    /// @return passId The new pass id (ids start at 1).
    function issuePass(uint256 programId, address holder, uint64 validFrom)
        external
        returns (uint256 passId)
    {
        Program storage p = _requireProgram(programId);
        if (p.issuer != msg.sender) revert NotProgramIssuer();
        if (!p.active) revert ProgramInactive();
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
            expiresAt: start + p.duration,
            revoked: false
        });
        _holderPasses[holder].push(passId);
        _programPasses[programId].push(passId);
        emit PassIssued(passId, programId, holder, msg.sender, start, start + p.duration);
    }

    /// @notice Extend a pass by `extraSeconds`. Active passes extend from their
    ///         current expiry; expired passes renew from the current chain time.
    ///         Revoked passes can never be extended. Expiry can never be shortened.
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

    /// @notice Permanently revoke a pass. Irreversible by design.
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
        Program storage p = _programs[programId];
        if (p.issuer == address(0)) revert ProgramNotFound();
        return p;
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

    /// @notice True only when the pass exists, has started, has not expired, and has
    ///         not been revoked. Never reverts.
    function isPassValid(uint256 passId) public view returns (bool) {
        return getPassStatus(passId) == PassStatus.Active;
    }

    /// @notice Non-reverting status probe for UIs and scanner verification.
    function getPassStatus(uint256 passId) public view returns (PassStatus) {
        Pass storage pass = _passes[passId];
        if (pass.issuer == address(0)) return PassStatus.NotFound;
        if (pass.revoked) return PassStatus.Revoked;
        uint64 nowTs = uint64(block.timestamp);
        if (nowTs < pass.validFrom) return PassStatus.NotStarted;
        if (nowTs >= pass.expiresAt) return PassStatus.Expired;
        return PassStatus.Active;
    }

    /// @notice One-call verification helper for Scanner Mode: checks validity AND
    ///         that the pass matches the expected holder, issuer, and program.
    ///         Never reverts.
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

    function _checkName(string calldata name) private pure {
        uint256 len = bytes(name).length;
        if (len == 0 || len > MAX_NAME_BYTES) revert InvalidName();
    }

    function _requireProgram(uint256 programId) private view returns (Program storage p) {
        p = _programs[programId];
        if (p.issuer == address(0)) revert ProgramNotFound();
    }

    function _requirePass(uint256 passId) private view returns (Pass storage pass) {
        pass = _passes[passId];
        if (pass.issuer == address(0)) revert PassNotFound();
    }
}
