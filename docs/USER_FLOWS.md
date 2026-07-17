# User flows

## Shared entry and network handling

1. The visitor opens the landing page and can understand the product before
   connecting a wallet.
2. The visitor chooses **My Passes** or **Issuer Dashboard**. Either mode may be
   used by the same wallet.
3. A wallet connection request is made only after an explicit user action.
4. The visitor selects Monad Mainnet or Monad Testnet. The app resolves the
   chain, RPC, explorer, and registry address from that deployment selection.
5. The app compares the connected wallet chain with the selected chain. If they
   differ, it shows the expected network and a switch action. Reads
   that could mislead the user, signatures, and writes remain blocked until the
   network is correct.
6. If the RPC or contract address is missing or unavailable, the app shows a
   configuration/read error with retry; it never substitutes mock validity.

Production defaults to Monad mainnet (`143`) and Preview defaults to testnet
(`10143`), but both deployments are selectable. Mainnet issuer/program/pass
state exists only on mainnet; testnet state exists only on testnet. Issuer and
member must select and connect to the same network for check-in.

## Issuer onboarding

1. The user opens **Issuer Dashboard** and connects a wallet.
2. The app reads `isIssuer(wallet)`.
3. An unregistered wallet sees a short registration form for a non-sensitive
   issuer display name.
4. The app validates that the UTF-8 name is non-empty and no more than 64 bytes.
5. The wallet submits `registerIssuer(name)`.
6. UI states progress through wallet confirmation, submitted/pending, confirmed,
   rejected, or reverted.
7. After confirmation, the dashboard re-reads issuer state. A duplicate
   registration or stale UI is surfaced as a contract error, not reported as
   success.

The same wallet can still use My Passes.

## Create a program

1. A registered issuer selects **Create program**.
2. The issuer enters a short, non-sensitive name and a duration.
3. The app rejects an empty or over-64-byte name, zero duration, or duration over
   3,650 days before requesting a transaction.
4. The wallet submits `createProgram(name, durationSeconds)`.
5. After confirmation, the app refreshes `getIssuerPrograms` and the relevant
   `getProgram` records.
6. The issuer may later call `setProgramActive`. Deactivation blocks only new
   issuance; it does not invalidate passes already issued.

## Issue a pass

1. The issuer opens an active program and selects **Issue pass**.
2. The issuer enters the holder wallet and chooses **start now** or a future
   start time.
3. The app validates the address, rejects the zero address, normalizes/checksums
   it, and converts the date to Unix seconds.
4. For **start now**, the app sends `validFrom = 0`. A scheduled start must not be
   in the past.
5. The wallet submits `issuePass(programId, holder, validFrom)`.
6. After confirmation, the issuer's list and the member's next read reflect the
   new pass. The app does not claim success from an optimistic draft alone.

## View My Passes

1. A member connects the holder wallet.
2. The app reads `getHolderPasses(holder)`.
3. It batches `getPass` and `getProgram` reads through Multicall3 where useful.
4. An empty array renders a friendly empty state, not an error.
5. Each card shows issuer/program, validity range, and one of `NotStarted`,
   `Active`, `Expired`, or `Revoked` based on chain state.
6. A detail view exposes the pass ID and explorer links without crypto-heavy
   consumer copy.
7. Only an `Active` pass matching the challenge issuer/program is eligible for a
   check-in proof. Eligibility is advisory; the scanner always re-reads state.

## Extend a pass

1. The issuing wallet opens a pass it issued.
2. The UI explains the effect before signing:
   - active: add the selected duration to current expiry;
   - expired and not revoked: renew from current chain time;
   - revoked: cannot be extended.
3. The issuer enters a non-zero duration of at most 3,650 days.
4. The wallet submits `extendPass(passId, extraSeconds)`.
5. After confirmation, the app re-reads the pass. Expiry must be later than the
   prior value and must never be shortened.

## Revoke a pass

1. The issuing wallet selects **Revoke**.
2. A confirmation dialog says that revocation is permanent and a new pass is
   required to restore membership.
3. Only an explicit confirmation submits `revokePass(passId)`.
4. After confirmation, the app refreshes state and displays `Revoked`.
5. Pending revocation is not treated as effective until it is confirmed and
   observable through the configured Monad RPC.

## Check-in: issuer challenge

1. The issuer connects the issuing wallet on the configured network and opens
   Scanner Mode for a program.
2. The browser generates a 32-byte cryptographically random nonce.
3. It records the active challenge in the current scanner session and encodes a
   `usp1.` challenge QR containing issuer, program, chain, contract, creation
   time, and a 60-second expiry.
4. A live countdown is shown. Once expired, the QR can no longer produce a valid
   result; the issuer must create a new challenge.

## Check-in: member proof

1. The member chooses **Scan challenge** and grants camera access.
2. The app decodes and validates the challenge before offering a signature.
3. It rejects malformed, expired, wrong-chain, or wrong-contract challenges with
   specific messages.
4. It finds the connected wallet's passes for the challenged issuer/program and
   lets the member choose an eligible pass.
5. The wallet signs the EIP-712 `CheckInProof`. This is a signature request, not
   a transaction, and costs no member gas.
6. The app renders a `usp1.` response QR containing the original challenge,
   selected pass and holder, and signature.

## Check-in: issuer verification

The issuer scans the response in the same scanner session that created the
challenge. The app performs the following steps in order:

1. Decode the `usp1.` payload and validate its schema, bounds, and addresses.
2. Require an exact match to the active challenge in this scanner session.
3. Reject a nonce already marked used in this session.
4. Reject an expired challenge.
5. Require the challenged issuer to equal the connected issuer wallet.
6. Verify `CheckInProof` and recover the signer.
7. Require the recovered signer to equal the response holder.
8. Perform fresh, uncached Monad reads of `getPass(passId)` and
   `isPassValidFor(passId, holder, issuer, programId)`.
9. Distinguish not found, not started, expired, revoked, wrong issuer, and wrong
   program using the returned record/status.
10. Only after all checks pass, mark the nonce used in session storage and show
    `VALID`.

Example result:

> VALID MEMBER — Optimum Gym Monthly Pass — Holder verified — Membership
> active — Expires August 16, 2026.

Re-scanning the response in that browser session returns **Challenge already
used**. Closing/clearing the session removes the local ledger; this is a known
MVP limitation, not global replay protection.

## Required failure and recovery flows

| State | User-facing outcome | Recovery |
| --- | --- | --- |
| Wallet disconnected | Ask the user to connect the required wallet. | Connect and retry. |
| Wrong network | Name the expected Monad network. | Switch network; do not continue on mixed config. |
| Transaction rejected | Explain that no change was made. | Retry only on user action. |
| Transaction reverted | Surface the mapped contract reason. | Correct input/authority and retry. |
| RPC or contract unavailable | Do not display validity. | Retry or use the configured healthy RPC. |
| Empty issuer/pass state | Friendly empty state. | Create a program/issue a pass as appropriate. |
| Camera permission denied | Explain browser permission. | Grant permission or retry camera initialization. |
| QR payload invalid | `QR payload invalid`. | Scan a current Unisky Pass QR. |
| Challenge expired | `Challenge expired`. | Issuer creates a fresh challenge. |
| Challenge reused | `Challenge already used`. | Issuer creates a fresh challenge. |
| Invalid signature | `Invalid signature`. | Re-scan and sign with the correct wallet. |
| Wrong wallet/holder | `Wrong wallet`. | Connect the pass holder wallet. |
| Wrong issuer | `Wrong issuer`. | Use the issuing wallet/scanner. |
| Wrong program | `Wrong program`. | Start Scanner Mode for the correct program. |
| Pass not found | `Pass not found`. | Confirm chain, contract, and pass. |
| Pass not started | `Pass not active yet`. | Wait until its chain-time start. |
| Pass expired | `Pass expired`. | Issuer may extend if it is not revoked. |
| Pass revoked | `Pass revoked`. | A new pass must be issued. |
| State changes after signing | Fresh state wins; never show stale `VALID`. | Resolve membership state and create a new challenge. |

## Exit and privacy behavior

Disconnecting removes wallet-session UI state but cannot delete public onchain
records. Closing the scanner tab ends the useful lifetime of its active challenge
and session replay ledger. Camera frames and signed payloads are not uploaded to
an Unisky Pass backend because no such backend exists.
