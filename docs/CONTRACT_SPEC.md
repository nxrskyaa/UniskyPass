# Contract specification

## Status and scope

`UniskyPassRegistry` is the final, binding contract for Unisky Pass. Its source
belongs at `contracts/src/UniskyPassRegistry.sol`, uses Solidity `0.8.28`, and
must not be renamed, redesigned, made upgradeable, or given an owner/admin.

The registry stores non-transferable time-based pass records. It is not an ERC
token, has no intentional fund-receipt or custody flow, contains no payable
function, and has no `receive` or `fallback`. Sending plain MON to it through an
ordinary call reverts. As with any EVM address, MON can be forced to the address
by another contract; it would be permanently stuck because no withdrawal exists.

The same bytecode is dry-run on Monad testnet (`10143`) before a human deploys it
to Monad mainnet (`143`) with their own key. Deployed addresses are configuration,
not constants in this document.

## Design invariants

- Program and pass IDs begin at `1`; `0` means not found.
- Any wallet may register as an issuer. Registration does not establish a legal
  or real-world identity.
- A wallet may simultaneously be an issuer and a pass holder.
- Each issuer controls only its own programs and passes.
- A pass holder never changes. There is no transfer or approval surface.
- Program deactivation stops new issuance but leaves existing passes unchanged.
- Validity is based only on `block.timestamp`.
- Revocation is permanent and a revoked pass cannot be extended.
- An active pass extension starts from its current expiry.
- An expired pass extension starts from current chain time.
- Extension never shortens expiry.
- Every mutation emits the specified event and failures use custom errors.
- The contract has no owner, admin, pause-all, upgrade, withdrawal, custody, or
  privileged recovery path.

## Constants and counters

| Member | Type | Value / meaning |
| --- | --- | --- |
| `MAX_NAME_BYTES` | `uint256` | `64`; applies to issuer and program names by byte length |
| `MAX_DURATION` | `uint64` | `3650 days`; ten-year maximum per program duration or extension call |
| `programCount` | `uint256` | Last allocated program ID |
| `passCount` | `uint256` | Last allocated pass ID |

Repeated valid extension calls may extend a non-revoked pass more than ten years
in aggregate; `MAX_DURATION` limits each call, not lifetime aggregate duration.

## Data types

### `Issuer`

| Field | Type | Meaning |
| --- | --- | --- |
| `name` | `string` | Public non-sensitive display name, 1–64 UTF-8 bytes |
| `registeredAt` | `uint64` | Chain timestamp when registered |
| `exists` | `bool` | Registration marker |

### `Program`

| Field | Type | Meaning |
| --- | --- | --- |
| `issuer` | `address` | Wallet that created and controls the program |
| `duration` | `uint64` | Validity seconds assigned when a pass is issued |
| `active` | `bool` | Whether new passes may be issued |
| `name` | `string` | Public non-sensitive display name, 1–64 UTF-8 bytes |

### `Pass`

| Field | Type | Meaning |
| --- | --- | --- |
| `programId` | `uint256` | Source program |
| `issuer` | `address` | Denormalized issuing wallet used for authorization |
| `holder` | `address` | Permanent holder wallet |
| `issuedAt` | `uint64` | Chain timestamp at issue |
| `validFrom` | `uint64` | Inclusive start timestamp |
| `expiresAt` | `uint64` | Exclusive expiry timestamp |
| `revoked` | `bool` | Permanent revocation marker |

### `PassStatus`

Enum ordinals and evaluation order are binding:

| Value | Ordinal | Condition |
| --- | ---: | --- |
| `NotFound` | `0` | No pass exists for the ID |
| `NotStarted` | `1` | Pass exists, is not revoked, and `now < validFrom` |
| `Active` | `2` | Pass exists, is not revoked, and `validFrom <= now < expiresAt` |
| `Expired` | `3` | Pass exists, is not revoked, and `now >= expiresAt` |
| `Revoked` | `4` | Pass exists and `revoked == true`, regardless of time |

At the exact `expiresAt` timestamp, the pass is expired.

## Write interface

### `registerIssuer(string name)`

Registers `msg.sender`. Reverts with `AlreadyRegistered` if already registered
and `InvalidName` for an empty or over-64-byte name. Emits
`IssuerRegistered(msg.sender, name)`.

### `updateIssuerName(string name)`

Updates the registered caller's display name. Reverts with
`NotRegisteredIssuer` or `InvalidName`. Emits `IssuerNameUpdated`.

### `createProgram(string name, uint64 duration) returns (uint256 programId)`

Requires a registered caller, a valid name, and `0 < duration <= MAX_DURATION`.
Creates an active program, appends its new ID to the caller's program list, and
emits `ProgramCreated`. Reverts with `NotRegisteredIssuer`, `InvalidName`, or
`InvalidDuration`.

### `setProgramActive(uint256 programId, bool active)`

Only the program issuer may change new-issuance status. Reverts with
`ProgramNotFound` or `NotProgramIssuer`. Emits `ProgramActiveSet`. Existing
passes are not modified.

### `issuePass(uint256 programId, address holder, uint64 validFrom) returns (uint256 passId)`

Only the program issuer may issue. The program must be active and `holder` must
not be zero. `validFrom == 0` resolves to current chain time; a non-zero value
must be at least current chain time. Expiry is `resolvedStart +
program.duration`. The new ID is appended to holder and program lists and
`PassIssued` is emitted.

Possible errors: `ProgramNotFound`, `NotProgramIssuer`, `ProgramInactive`,
`ZeroHolder`, or `InvalidValidFrom`.

### `extendPass(uint256 passId, uint64 extraSeconds)`

Only the stored issuer may extend. The pass must exist, must not be revoked, and
`0 < extraSeconds <= MAX_DURATION`.

```text
base = max(current expiresAt, current block.timestamp)
new expiresAt = base + extraSeconds
```

Emits `PassExtended(passId, newExpiresAt)`. Possible errors:
`PassNotFound`, `NotPassIssuer`, `PassIsRevoked`, or `InvalidDuration`.

### `revokePass(uint256 passId)`

Only the stored issuer may permanently set `revoked = true`. Emits
`PassRevoked`. A repeated revoke returns `PassIsRevoked`; there is no undo.
Other possible errors are `PassNotFound` and `NotPassIssuer`.

## Read interface

| Function | Behavior |
| --- | --- |
| `getIssuer(address)` | Returns the struct; an unknown issuer has default values. |
| `isIssuer(address)` | Returns the issuer `exists` flag. |
| `getProgram(uint256)` | Returns a program or reverts `ProgramNotFound`. |
| `getPass(uint256)` | Returns a pass or reverts `PassNotFound`. |
| `getIssuerPrograms(address)` | Returns all program IDs recorded for the issuer. |
| `getHolderPasses(address)` | Returns all pass IDs recorded for the holder. |
| `getProgramPasses(uint256)` | Returns all pass IDs recorded for the program ID. |
| `isPassValid(uint256)` | Returns true only for `Active`; never reverts. |
| `getPassStatus(uint256)` | Returns the enum above; never reverts. |
| `isPassValidFor(uint256,address,address,uint256)` | Returns true only if active and holder, issuer, and program all match; never reverts. |

Array getters return complete ID arrays. The MVP may batch follow-up record reads
with Multicall3, but it does not introduce an indexer or event-history service.
Very large arrays are an acknowledged availability risk, not a reason to alter
the final contract during the hackathon. Any registered issuer can issue to any
non-zero holder without holder consent, so a funded attacker can append
unsolicited IDs until `getHolderPasses(holder)` becomes slow or exceeds an RPC
response/`eth_call` limit. The UI treats unsolicited passes as untrusted, batches
follow-up reads, and fails gracefully, but the unpaginated first read cannot be
fully mitigated in the frontend. A real fix needs a future contract/API redesign.

## Events

| Event | Indexed fields | Purpose |
| --- | --- | --- |
| `IssuerRegistered(address,string)` | `issuer` | Issuer registration |
| `IssuerNameUpdated(address,string)` | `issuer` | Display-name update |
| `ProgramCreated(uint256,address,string,uint64)` | `programId`, `issuer` | Program creation |
| `ProgramActiveSet(uint256,bool)` | `programId` | Issuance state change |
| `PassIssued(uint256,uint256,address,address,uint64,uint64)` | `passId`, `programId`, `holder` | Pass issuance |
| `PassExtended(uint256,uint64)` | `passId` | New expiry |
| `PassRevoked(uint256)` | `passId` | Permanent revocation |

Events are useful for explorer visibility but are not consumed by an MVP
indexer, analytics feature, or check-in history.

## Custom errors

`AlreadyRegistered`, `NotRegisteredIssuer`, `InvalidName`, `InvalidDuration`,
`InvalidValidFrom`, `ZeroHolder`, `ProgramNotFound`, `ProgramInactive`,
`NotProgramIssuer`, `PassNotFound`, `NotPassIssuer`, and `PassIsRevoked` must be
mapped to concise user-facing messages where a frontend action can trigger them.

## Scanner use

The scanner must not infer validity from a QR or stale My Passes cache. After
signature checks it performs fresh calls to:

```text
getPass(passId)
isPassValidFor(passId, holder, issuer, programId)
```

`getPassStatus` may additionally distinguish a human-readable invalid reason.
The pass record must also match the signed holder, challenged issuer, and
challenged program before `VALID` is shown.

## Gas and Monad behavior

Contract state access must be estimated against the target Monad RPC. Monad
charges the sender from the submitted gas limit, not receipt gas used, so the
frontend uses a tight estimate and at most a 10% buffer. A displayed estimate is
`gasLimit * gasPrice`. The member check-in signature uses no contract call and
therefore no member gas.

## Verification and immutability

After each deployment, `scripts/verify-contract.mjs` generates Foundry standard
JSON and metadata and posts them to the Monad verification API. Verification is
required on testnet and mainnet. The frontend address is set only from the
verified deployment output.

There is no proxy or upgrade mechanism. A future source change would require a
new deployment and explicit migration/product decision; it cannot be presented
as an in-place upgrade.
