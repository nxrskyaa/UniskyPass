# Test plan

## Objectives

Testing must prove five things:

1. `UniskyPassRegistry` enforces its final authorization, time, revocation,
   event, and no-normal-fund-transfer invariants.
2. The frontend handles every wallet, network, transaction, RPC, empty, and pass
   state without inventing success.
3. Check-in rejects malformed, stale, replayed, mismatched, and stale-state
   proofs, while the happy path needs no member transaction.
4. The complete flow works over HTTPS with real wallets and phone cameras on
   testnet before a human deploys mainnet.
5. Privy login creates or restores the intended active wallet without exposing
   optional email/phone identifiers to application persistence or Monad.

This plan distinguishes automated gates from manual scenarios. Do not mark a
manual scenario passed merely because the build succeeds.

## Environments

| Environment | Purpose | Chain ID |
| --- | --- | ---: |
| Local frontend | Static/unit/component validation and mocked failure states | Configurable |
| Foundry local EVM | Deterministic contract tests with `vm.warp` | Local |
| Monad testnet + Vercel preview | Mandatory full two-wallet, real-camera rehearsal | `10143` |
| Monad mainnet + Vercel production | Final smoke test only after all earlier gates | `143` |

All environment values—RPC, chain ID, explorer, and registry address—must refer
to the same deployment during a test.

For runtime selection, the connected wallet must match the selected deployment.
Switching networks must also switch the registry, RPC, explorer, and query scope
together.

The Privy App ID and optional Client ID are public environment values. Test with
Email and Wallet enabled; test SMS only when it is enabled and available for the
configured plan and country. The production origin must be exact, and no test
may rely on a generic `https://*.vercel.app` allow rule.

## Standard automated gates

From the repository root:

```powershell
npm ci
npm run lint
npm run typecheck
npm test
npm run build
Set-Location contracts
forge build
forge test
Set-Location ..
```

`npm test` is the deterministic Vitest run. `npm run test:watch` is for local
iteration and is not a release gate.

## Foundry contract test matrix

Use `vm.warp` for all time-dependent cases and independent issuer, holder, and
attacker addresses. Assert custom-error selectors and complete event arguments,
not merely generic revert/success.

### Issuer and program behavior

- Register an issuer and assert stored name, timestamp, existence, and
  `IssuerRegistered` arguments.
- Duplicate registration reverts `AlreadyRegistered`.
- Empty and over-64-byte issuer names revert `InvalidName`.
- An unregistered wallet cannot update a name or create a program.
- A registered issuer can update its name and emits `IssuerNameUpdated`.
- A registered issuer creates a program; ID starts at `1`, duration/name/issuer
  are correct, active defaults true, the issuer list is updated, and
  `ProgramCreated` arguments are exact.
- Zero duration and duration above `MAX_DURATION` revert `InvalidDuration`.
- Empty and over-64-byte program names revert `InvalidName`.
- A different issuer cannot toggle another issuer's program.
- Program active state toggles and emits `ProgramActiveSet`.

### Issuance and authorization

- The program issuer can issue with `validFrom = 0`; chain time is used and ID
  starts at `1`.
- A future start is stored exactly and produces `NotStarted` / invalid status.
- A non-zero start in the past reverts `InvalidValidFrom`.
- A non-owner cannot issue against another issuer's program.
- An inactive program rejects new issuance with `ProgramInactive`.
- Zero holder rejects with `ZeroHolder`.
- Holder and program ID arrays receive the new pass exactly once.
- `PassIssued` contains exact pass/program/holder/issuer/start/expiry arguments.

### Status and time boundaries

- Unknown ID is `NotFound`; `isPassValid` and `isPassValidFor` return false
  without reverting.
- Immediately before `validFrom` is `NotStarted` and invalid.
- Exactly at `validFrom` is `Active` and valid.
- Immediately before `expiresAt` is active.
- Exactly at `expiresAt` is `Expired` and invalid.
- Revocation produces `Revoked` regardless of start/expiry and invalidates the
  pass.

### Extension and revocation

- A different issuer cannot extend or revoke the pass.
- Zero or over-maximum extension reverts `InvalidDuration`.
- Extending an active pass adds to its current expiry.
- Extending an expired pass renews from current `block.timestamp`.
- Every successful extension increases expiry; it never shortens it.
- `PassExtended` reports the exact new expiry.
- Revocation is permanent and emits exact `PassRevoked` arguments.
- Extending or revoking an already revoked pass reverts `PassIsRevoked`.

### Matching and no-custody surface

- `isPassValidFor` is true for the exact active holder/issuer/program tuple.
- Wrong holder alone returns false.
- Wrong issuer alone returns false.
- Wrong program alone returns false.
- A plain MON call to the registry reverts because there is no payable,
  `receive`, or `fallback` entry point.
- Confirm no transfer, approval, owner, admin, withdrawal, or upgrade method is
  present in the ABI.

Forced native balance from another EVM contract is a documented edge case, not a
normal transfer test; any such balance is stuck because no withdrawal exists.

## Frontend logic tests

Where test tooling exists, prioritize deterministic tests for security-sensitive
pure logic:

- name byte-length, duration, timestamp, and address/checksum validation;
- pass status mapping at start/expiry boundaries;
- Monad network configuration coherence and wrong-network guards;
- `usp1.` base64url challenge/response round trips;
- rejection of wrong prefix/version/type, invalid JSON/base64url, extra-large
  input, malformed address/hex/signature, unsafe integer, and invalid 60-second
  relation;
- 32-byte cryptographic nonce format and no deterministic fallback;
- decimal string conversion for `uint256` IDs;
- exact EIP-712 domain, `CheckInProof` field names/types/order, and recovered
  signer;
- scanner-session exact-match and versioned used-nonce ledger behavior;
- verification pipeline short-circuit order;
- no contract call before structural/signature prerequisites pass;
- fresh contract call required before `VALID`;
- query/RPC failure can never fall back to cached validity; and
- distinct error-code-to-human-message mapping.

Privy/wagmi integration tests should cover initialization readiness, Email OTP,
external-wallet login, embedded-wallet creation for a user without a wallet,
returning-login recovery of the same address, logout, multiple linked wallets,
active-wallet selection, and blocked account changes during active/uncertain
transactions. Add SMS cases only when that method is actually available.

Mock wallet/RPC integration should cover transaction confirmation, pending,
user rejection, contract revert, malformed response, and unavailable RPC. A
mocked oversized/failed `getHolderPasses` response must render an availability
error, not a false empty wallet; the final contract has a documented unbounded
enumeration concern.

## Manual frontend state matrix

Verify on both a narrow phone viewport and desktop:

- Privy initializing without a false disconnected flash;
- Email OTP success, invalid/expired OTP, cancellation, and retry;
- external-wallet login and returning embedded-wallet login;
- SMS success/failure only where enabled and available, with Email/Wallet
  fallback when unavailable;
- embedded-wallet creation failure and provider-unavailable recovery;
- multiple linked wallets, explicit active-wallet selection, and account-state
  reset after switching;
- logout, wallet switching, and connecting another wallet blocked while a
  transaction is active or uncertain;
- wallet disconnected;
- wrong network and successful network switch;
- missing/mixed environment configuration;
- RPC unavailable and retry;
- contract unavailable/wrong address;
- empty issuer state;
- empty pass wallet;
- transaction waiting for wallet, submitted/pending, confirmed, rejected, and
  reverted;
- active, not-started, expired, and revoked pass cards/details;
- unauthorized issuer action;
- irreversible revocation confirmation;
- active extension and expired renewal copy;
- long but valid display names, escaped safely;
- loading/skeleton, retry, and offline-like behavior;
- keyboard focus, labels, contrast, reduced motion, and screen-reader result
  announcement; and
- no horizontal overflow or blocked primary action on common phone sizes.

## Check-in protocol matrix

Each failure must show the distinct message in `CHECKIN_PROTOCOL.md`:

- camera permission denied;
- invalid QR prefix/payload/version;
- challenge from another scanner session;
- expired challenge;
- reused successful challenge;
- wrong network;
- wrong configured contract;
- wrong connected issuer;
- invalid/tampered signature;
- recovered signer differs from holder;
- wrong stored holder;
- wrong stored issuer;
- wrong stored program;
- pass not found;
- pass not active yet;
- pass expired;
- pass revoked; and
- fresh contract read failure.

Also prove:

- the member receives only an EIP-712 signature prompt and sends no transaction;
- countdown expires at 60 seconds;
- a replacement challenge invalidates the prior active scanner challenge;
- response reuse fails after one successful scan in the same session;
- a new/cleared session demonstrates the documented lack of global nonce memory,
  without mislabeling it as secure cross-device prevention;
- chain ID and contract domain prevent cross-chain/cross-contract signature reuse;
  and
- display names cannot determine validity.

## Mandatory stale-state test

This scenario is a release blocker:

1. Create a valid challenge and have the active holder sign it.
2. Before the issuer scans the response, revoke the pass and wait for the
   revocation receipt/state refresh.
3. Scan the already-created response.
4. Confirm the scanner makes new `getPass` and `isPassValidFor` calls.
5. Confirm the result is `Pass revoked`, never `VALID` from member or query cache.

Repeat with expiry by advancing/waiting past `expiresAt` where practical.

## Testnet end-to-end rehearsal

Use a verified testnet deployment, two wallets, and real phone cameras over a
Vercel HTTPS preview:

1. Complete an Email login and confirm its embedded wallet address is visible;
   complete external-wallet login on the other device. Test SMS only where it is
   enabled and available.
2. Register the issuer and create a program.
3. Issue an active pass to the second wallet.
4. Confirm it appears in My Passes.
5. Complete the challenge/sign/response/verification loop.
6. Confirm no member transaction or gas request occurs.
7. Re-scan and observe `Challenge already used`.
8. Test expired challenge, wrong member wallet, and wrong program.
9. Revoke between signature and scan and confirm the fresh-read failure.
10. Exercise camera denial/recovery on at least one mobile browser.
11. Confirm explorer links point to testnet and the verified contract.
12. Switch to mainnet and confirm testnet programs/passes disappear; switch back
    and confirm they return only from testnet query state.
13. Reject a wallet network-switch request and confirm the app keeps the prior
    deployment selected.
14. Log out and back in through Privy; confirm the embedded address is unchanged
    and no login identifier appears in local/session storage, QR data, logs, or
    contract calls.
15. Attempt to use a QR created on the other network and confirm `Wrong network`
    or `Wrong contract`, never `VALID`.

Do not proceed to mainnet if any core or security scenario fails.

## Mainnet production smoke test

After human deployment, source verification, coherent Vercel production
configuration, and a green build:

- confirm production chain ID/address/explorer in the UI;
- repeat issuer registration, program, issuance, My Passes, and complete
  check-in using controlled demo wallets;
- repeat same-session replay rejection and post-sign revocation rejection;
- repeat Email and external-wallet login, returning embedded-wallet recovery,
  logout, and active-wallet selection; test SMS only if production enables it;
- verify transaction hashes and contract source on the mainnet explorer;
- switch to testnet and confirm only testnet state, address, and explorer links
  are shown, then switch back to mainnet; and
- inspect the production environment to confirm no deployer key or Privy secret
  is present; only the public App ID and optional Client ID may be exposed.

## Evidence and sign-off

Record only public/non-sensitive evidence:

- commit and build result;
- Foundry test summary;
- deployed contract address and transaction hash;
- verification result/explorer link;
- Vercel preview and production URLs;
- tested wallet public addresses if appropriate; and
- manual matrix pass/fail notes and device/browser versions.

Never record private keys, seed phrases, full environment dumps, or unnecessary
full response signatures. Do not record email addresses, phone numbers, OTPs, or
Privy access tokens as test evidence.

Release sign-off requires all automated gates green, the complete testnet matrix,
human-approved mainnet deployment, and a passing production smoke test.
