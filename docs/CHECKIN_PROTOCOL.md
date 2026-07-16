# Check-in protocol

## Purpose and security claim

Unisky Pass check-in proves that a wallet controlling an active pass responded
to a specific issuer's fresh challenge. The member signs typed data and never
sends a transaction.

The protocol makes a copied static pass screenshot insufficient. The MVP's used
nonce ledger exists only in the issuer's current browser session; it is not a
global replay registry and it does not prevent deliberate wallet sharing.

## Version and transport

Protocol version is `1`. Both QR payloads are compact JSON encoded as unpadded
base64url and prefixed with:

```text
usp1.<base64url-json>
```

Unknown prefixes, versions, message kinds, missing/extra fields, malformed
base64url/JSON, invalid addresses, out-of-range integers, invalid hex, or payloads
over 4,096 characters are rejected before wallet or RPC work. IDs are serialized
as base-10 strings to preserve `uint256` precision across JSON.

Verbose names below describe application types. The compact keys are wire
format and must remain stable for version 1.

## Challenge QR

The scanner uses `crypto.getRandomValues` to generate a 32-byte nonce (the
minimum protocol requirement is 16 random bytes). Times are Unix seconds. The
challenge expires exactly 60 seconds after creation.

| Compact key | Verbose field | Wire type | Validation |
| --- | --- | --- | --- |
| `v` | version | number | exactly `1` |
| `t` | type | string | exactly `"c"` |
| `n` | nonce | string | `0x`-prefixed 32-byte hex |
| `i` | issuer | string | EVM address |
| `p` | programId | string | positive base-10 `uint256` |
| `c` | chainId | number | configured chain, `143` in production |
| `a` | contractAddress | string | configured `UniskyPassRegistry` address |
| `iat` | createdAt | number | integer Unix seconds |
| `exp` | expiresAt | number | exactly `createdAt + 60` |

Verbose TypeScript shape:

```ts
type CheckInChallenge = {
  nonce: `0x${string}`;
  issuer: `0x${string}`;
  programId: bigint;
  chainId: number;
  contractAddress: `0x${string}`;
  createdAt: number;
  expiresAt: number;
};
```

The issuer browser records the exact active challenge in the current scanner
session and displays a live countdown. Creating a replacement challenge makes
the prior challenge no longer active for that scanner flow.

For the mandatory testnet dry run, challenge chain ID and contract address use
the coherent testnet environment (`10143`). Production uses mainnet chain ID
`143`. A payload must never combine values from different environments.

## Member selection and EIP-712 signature

The member decodes and validates the challenge, connects the challenged network,
and selects an active pass whose stored holder is the connected wallet and whose
issuer/program match the challenge. This eligibility read improves UX but is not
the scanner's final authority.

The wallet signs this EIP-712 domain:

```text
name:              "Unisky Pass"
version:           "1"
chainId:           challenge.chainId
verifyingContract: challenge.contractAddress
```

Production values are chain ID `143` and the address configured in
`NEXT_PUBLIC_UNISKY_PASS_CONTRACT_ADDRESS`.

Primary type: `CheckInProof`.

| Field | EIP-712 type | Value |
| --- | --- | --- |
| `passId` | `uint256` | Selected pass ID |
| `programId` | `uint256` | Challenge program ID |
| `holder` | `address` | Connected member wallet |
| `issuer` | `address` | Challenge issuer |
| `nonce` | `bytes32` | Challenge nonce |
| `challengeExpiresAt` | `uint64` | Challenge `expiresAt` |

Field names, types, order, domain name, and version are protocol constants. The
member sees a signature request only. Any transaction request in this flow is a
failure and must be rejected.

## Response QR

The response carries the original challenge fields unchanged plus the selected
pass, holder, and signature.

| Compact key | Verbose field | Wire type |
| --- | --- | --- |
| `v` | version | number, exactly `1` |
| `t` | type | string, exactly `"r"` |
| `n` | nonce | 32-byte hex string |
| `i` | issuer | address string |
| `p` | programId | base-10 string |
| `c` | chainId | number |
| `a` | contractAddress | address string |
| `iat` | createdAt | Unix-seconds number |
| `exp` | expiresAt | Unix-seconds number |
| `pid` | passId | positive base-10 `uint256` string |
| `h` | holder | address string |
| `sig` | signature | `0x`-prefixed 65-byte ECDSA signature hex |

Verbose response shape:

```ts
type CheckInResponse = CheckInChallenge & {
  passId: bigint;
  holder: `0x${string}`;
  signature: `0x${string}`;
};
```

The response QR is a bearer artifact for its remaining short lifetime. Do not
log, upload, or persist it beyond what the active flow requires.

## Verification pipeline

The scanner performs every step in this exact order and fails closed:

1. **Decode and validate.** Require `usp1.`, response kind/version, valid schema,
   canonical numeric bounds, addresses, nonce, signature, and 60-second relation.
2. **Match scanner session.** Require the response's complete original challenge
   to match the active challenge created by this scanner session. A valid
   signature for another scanner's challenge is not accepted here.
3. **Check local replay ledger.** Reject the nonce if it is already used in this
   session. The versioned key is `unisky-pass:used-checkin-nonces:v1`.
4. **Check challenge time.** Reject when scanner time is at or after `expiresAt`.
5. **Match issuer wallet.** Require the connected wallet to equal challenge
   `issuer`, and require the configured chain/contract to match the challenge.
6. **Recover signer.** Verify EIP-712 `CheckInProof` with the challenge domain and
   response message.
7. **Match holder.** Require recovered signer to equal response `holder`.
8. **Read fresh chain state.** Bypass UI/query caches and call current Monad RPC
   for `getPass(passId)` and
   `isPassValidFor(passId, holder, issuer, programId)`.
9. **Explain state.** Require stored holder, issuer, and program to match and
   require active chain-time status. Use `getPassStatus` or the record to
   distinguish not found, not started, expired, and revoked.
10. **Consume locally.** Only after all checks pass, add the nonce to the current
    session ledger and show `VALID`.

Never consume a nonce before the pipeline succeeds, and never show a provisional
`VALID` while the contract read is pending. If the RPC read fails, the result is
`Contract read failed`, not cached validity.

## Required result mapping

| Check failure | Result text |
| --- | --- |
| Decode/schema/version/prefix | QR payload invalid |
| Active challenge mismatch | Challenge does not belong to this scanner session |
| Used nonce | Challenge already used |
| `now >= expiresAt` | Challenge expired |
| Connected/configured chain mismatch | Wrong network |
| Configured/response registry mismatch | Wrong contract |
| Connected issuer mismatch | Wrong issuer |
| EIP-712 recovery failure | Invalid signature |
| Recovered signer differs from holder | Wrong wallet |
| Stored holder differs | Wrong wallet |
| Stored issuer differs | Wrong issuer |
| Stored program differs | Wrong program |
| Pass status `NotFound` | Pass not found |
| Pass status `NotStarted` | Pass not active yet |
| Pass status `Expired` | Pass expired |
| Pass status `Revoked` | Pass revoked |
| Fresh RPC/contract call fails | Contract read failed |
| Camera startup denied | Camera permission denied |

Success may read:

> VALID MEMBER — {issuer name} {program name} — Holder verified — Membership
> active — Expires {localized expiry}.

Names are display-only and escaped by the UI; validity comes from addresses,
IDs, signature recovery, and contract state.

## Replay and screenshot analysis

- A static pass card screenshot contains no fresh issuer nonce or holder
  signature and is insufficient.
- A response screenshot is bound to one issuer, program, holder, nonce, chain,
  contract, and 60-second expiry.
- Reuse after a successful scan in the same browser session is rejected by the
  used-nonce ledger.
- Clearing/ending that session removes the ledger. There is no shared nonce
  authority across browsers or devices.
- Full durable replay prevention would require a backend/shared store or an
  onchain nonce registry. Both are intentionally outside this MVP.
- A person who deliberately gives another person control of the holder wallet
  can still produce a valid signature. Wallet sharing is not prevented.

## Clock and state changes

Browser time enforces challenge freshness; contract `block.timestamp` enforces
pass validity. A materially incorrect scanner clock can affect the 60-second
window and is an acknowledged client-only limitation.

Pass state may change after signing. Revocation, expiry, extension, or other
state observed by the scanner's fresh read always wins over the member's earlier
eligibility read. A signature never freezes pass validity.
