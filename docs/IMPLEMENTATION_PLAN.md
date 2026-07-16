# Implementation plan

## Delivery strategy

This plan targets one builder and six hackathon days. Work in small vertical
slices, keep the repository buildable after each slice, and commit one phase (or
a tightly related few) at a time with its validation evidence. The core
issuer-to-member-to-scanner loop is never cut.

The contract source is final. There is no backend, database, account service,
indexer, payment path, or onchain check-in history to implement.

## Dependency order

```text
docs/tooling -> contract tests -> testnet deploy + verify -> static shell
-> wallet/network -> issuer writes -> member reads -> pass management
-> EIP-712 + QR check-in -> testnet real-device gate -> human mainnet deploy
-> Vercel production + smoke test
```

The frontend may begin with static fixtures, but real contract wiring uses a
deployed and verified testnet address. Mainnet deployment happens only after the
testnet release gate.

## Phase 0 — Repository setup and binding documentation

**Goal:** establish one coherent architecture and scope before product code.

Deliverables:

- preserve the current `src/app` Next.js layout and read installed Next.js guides
  before code changes;
- create the intended frontend module folders without duplicate frameworks;
- add complete `.env.example` with public variables and local-only deployer key;
- add visible `.monskills` with `built-with=monskills` and `chain=monad`;
- create all product, protocol, security, privacy, test, implementation, and
  deployment documents; and
- lock scope and the final-contract rule in `AGENTS.md`.

Acceptance:

- every required document exists and terminology agrees;
- no secret or deployed address is invented;
- limitations state session-only replay prevention, no wallet-sharing prevention,
  no backend/database, human-owned mainnet deployment, and testnet-first; and
- `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` remain
  green.

## Phase 1 — Foundry contract, tests, deploy, and verification tooling

**Goal:** make the final registry reproducible and prove its invariants.

Deliverables:

- place the supplied `UniskyPassRegistry.sol` source verbatim;
- configure Foundry for Solidity `0.8.28`; deployment commands explicitly pass
  `--gas-estimate-multiplier 110` because the current Foundry script default is
  higher than Monad's allowed MVP buffer;
- implement the full test matrix in `TEST_PLAN.md`;
- add `contracts/script/Deploy.s.sol:Deploy`, reading
  `DEPLOYER_PRIVATE_KEY` from the process environment; and
- add `scripts/verify-contract.mjs` to submit Foundry standard JSON and metadata
  to the Monad verification API.

Acceptance:

```powershell
Set-Location contracts
forge build
forge test
Set-Location ..
```

Then deploy/verify on testnet and record only the public address/transaction.
Do not change the final source to address the documented unbounded holder-array
availability concern; preserve it in security notes and UI failure handling.

## Phase 2 — Static product shell

**Goal:** create the complete mobile-first information architecture before chain
wiring.

Deliverables:

- landing page with honest product explanation and no crypto-heavy copy;
- responsive navigation between My Passes and Issuer Dashboard;
- static issuer registration/program/issuance/management states;
- static member list/detail states;
- Scanner Mode challenge/member/result shells; and
- empty, loading, error, pending, and confirmation components.

Acceptance:

- phone and desktop layouts are usable and distinctive;
- the full core loop can be narrated through mock UI;
- irreversible revocation and screenshot claims are accurate; and
- `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

## Phase 3 — Wallet, network, and contract foundation

**Goal:** establish one coherent Monad interaction layer.

Deliverables:

- wagmi/viem provider and `monad` / `monadTestnet` definitions compatible with
  installed versions;
- connect, disconnect, account-change, and wrong-network UX;
- environment validation for RPC, chain ID, explorer, and verified address;
- ABI generated/copied from the Foundry artifact without hand drift;
- public client, wallet client/hooks, error mapping, receipt refresh, and
  Multicall3-batched read utilities; and
- Monad gas estimation with no more than 10% buffer and limit-based cost display.

Acceptance:

- disconnected, wrong-network, rejected, reverted, confirmed, and RPC failure
  states are manually verified;
- mixed configuration fails closed;
- no frontend bundle contains `DEPLOYER_PRIVATE_KEY`; and
- build/lint gates pass.

Use Monad synchronous transaction submission only if the installed library API
supports it; do not invent an unavailable wagmi hook.

## Phase 4 — Issuer operations

**Goal:** complete register, program, and issuance writes against testnet.

Deliverables:

- issuer lookup, registration, and display-name update;
- program creation and active-state toggle;
- wallet checksum/zero-address validation and future-start handling;
- pass issuance; and
- program/pass lists using contract arrays plus bounded batches of follow-up
  reads.

Acceptance:

- authorization and input errors are human-readable;
- transaction states and confirmed refresh are visible;
- inactive program behavior is correct; and
- issuer can create a program and issue a testnet pass to the second wallet.

## Phase 5 — Member pass wallet

**Goal:** make the issued pass visible and trustworthy for the holder.

Deliverables:

- `getHolderPasses` retrieval and batched `getPass`/`getProgram` details;
- `NotStarted`, `Active`, `Expired`, and `Revoked` presentation;
- pass detail with issuer/program/time and explorer context;
- empty, RPC failure, and retry states; and
- graceful behavior for failed/oversized holder enumeration, with unsolicited
  issuers treated as untrusted.

Acceptance:

- second wallet sees the pass issued in Phase 4;
- start and expiry boundaries match contract state;
- no cached/local data is presented as authoritative; and
- the documented contract availability concern is not hidden as an empty state.

## Phase 6 — Pass management

**Goal:** complete issuer lifecycle operations.

Deliverables:

- active extension from current expiry;
- expired renewal from chain time;
- permanent revocation with explicit confirmation; and
- authorization, rejected, reverted, and confirmed-refresh states.

Acceptance:

- expiry never appears shortened;
- revoked pass cannot be extended or restored;
- wrong issuer is blocked by UI and contract; and
- member status updates after confirmed chain state.

## Phase 7 — EIP-712 QR check-in

**Goal:** complete the no-member-transaction verification loop.

Deliverables:

- 32-byte challenge nonce, 60-second countdown, exact scanner-session storage;
- `usp1.` compact base64url challenge/response codecs;
- camera QR scan with permission/error handling;
- eligible pass selection and exact EIP-712 `CheckInProof` signature;
- response QR rendering;
- ordered verification pipeline with fresh `getPass` and `isPassValidFor` reads;
- versioned session used-nonce ledger; and
- every result/failure message in `CHECKIN_PROTOCOL.md`.

Acceptance:

- happy path works between two testnet wallets with no member transaction;
- same-session replay, expiry, signature and binding failures are distinct;
- revocation between signing and scanning returns `Pass revoked` after a new
  chain read; and
- QR parser and camera failures fail closed.

## Phase 8 — Polish and deployment readiness

**Goal:** turn the working testnet loop into a releasable mainnet frontend.

Deliverables:

- real-phone camera verification over a Vercel HTTPS preview;
- accessibility, responsive, loading, retry, and RPC resilience pass;
- copy/security/privacy review;
- dependency and secret review;
- final README demo script and operational docs; and
- complete automated and manual test evidence.

Acceptance:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
Set-Location contracts
forge test
Set-Location ..
```

The complete `TEST_PLAN.md` testnet matrix must pass before mainnet authorization.

## Day allocation

| Day | Primary target | Must end green with |
| --- | --- | --- |
| 1 | Phases 0–1 | Docs coherent, Foundry build/tests, testnet deploy/verify |
| 2 | Phases 2–3 | Responsive shell, wallet/network/contract foundation |
| 3 | Phase 4 | Issuer can create and issue on testnet |
| 4 | Phases 5–6 | Member reads plus extend/revoke lifecycle |
| 5 | Phase 7 | Complete EIP-712 QR loop and failure states |
| 6 | Phase 8 and release | Real-device testnet gate, human mainnet deploy, Vercel production smoke |

If time slips, cut animation, decorative polish, optional filtering, and other
secondary presentation first. Do not cut fresh onchain verification, failure
states, authorization tests, replay caveats, real camera testing, or testnet-first
deployment.

## Commit and review discipline

For each phase:

1. State the phase goal.
2. Keep changed files within that phase.
3. Run the proportional automated gates.
4. Execute relevant manual acceptance scenarios.
5. Note security/privacy impact and known risk.
6. Commit only a green, coherent slice with a clear message.

Never include private keys, seed phrases, `.env.local`, full environment dumps,
or invented deployment results in commits.

## Release handoff

The implementation agent may prepare scripts, builds, testnet deployment, and
Vercel configuration. A human explicitly supplies their own key and authorizes
the mainnet deployment. After source verification, the verified address is set
in the four public Vercel production variables and a production smoke test closes
the MVP.
