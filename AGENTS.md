<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Unisky Pass project rules

## Binding product scope

- Product name: **Unisky Pass**. Contract name: `UniskyPassRegistry`.
- Tagline: **One wallet for every place you belong.**
- This is a mobile-first, time-based membership-pass MVP on Monad. Do not call it
  an NFT platform in code, UI copy, or documentation.
- A wallet may be both a member and an issuer. The two modes are not exclusive.
- The core loop outranks secondary polish: create program, issue pass, member
  sees pass, issuer creates challenge, member signs, issuer verifies signature
  and fresh onchain state.

## Architecture boundaries

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, wagmi, and viem.
- Contract tooling: Foundry with Solidity `0.8.28`.
- Preserve the existing `src/app` layout. Do not create a second root `app/`
  tree.
- There is no application backend, database, server-side account system, or
  trusted browser persistence. Permanent state belongs on Monad. Temporary
  challenges, used nonces, drafts, and preferences may use browser storage but
  must always be treated as untrusted.
- Do not add an indexer for the MVP. Use contract getters and Multicall3-batched
  reads. There is no onchain check-in history.

## Contract invariants

- The supplied `contracts/src/UniskyPassRegistry.sol` source is final. Do not
  redesign, rename, upgrade, or silently improve its API. If a genuine concern
  is found, document it under `Contract concerns` in
  `docs/SECURITY_NOTES.md` and stop before changing the contract.
- Passes are plain non-transferable records. There is no token, transfer,
  payment, custody, owner, admin, proxy, or upgrade path.
- Issuer mutations must remain scoped to that issuer's own programs and passes.
- Revocation is permanent. Extending an active pass adds to its expiry;
  extending an expired, non-revoked pass renews from chain time. Expiry is never
  shortened.
- Contract validity uses `block.timestamp`, not the browser clock.
- `getHolderPasses` is unpaginated and any issuer can issue to a non-zero holder
  without consent. Preserve the final API, treat unsolicited passes as untrusted,
  batch follow-up reads, and show honest availability errors if enumeration
  fails; do not report a failed read as an empty wallet.
- Ordinary MON transfers revert, but forced EVM balance can become permanently
  stuck because there is no withdrawal. Never create or advertise a fund path.

## Monad rules

- Mainnet: chain ID `143`, RPC `https://rpc.monad.xyz`, explorer
  `https://monadscan.com`.
- Testnet: chain ID `10143`, RPC `https://testnet-rpc.monad.xyz`, explorer
  `https://testnet.monadscan.com`.
- Testnet is the mandatory dry-run environment; the human deploys mainnet using
  their own local key.
- Monad charges for the gas **limit**, not gas consumed. Estimate against the
  target Monad RPC, add no more than a 10% buffer, and display estimated cost as
  `gasLimit * gasPrice`. Never rely on an inflated wallet fallback.
- Use `monad` / `monadTestnet` from the installed viem or wagmi package when
  available; otherwise define the chains with the exact values above.
- Keep TypeScript target at least `ES2020` for BigInt literals.
- Use Monad's synchronous send capability only when the installed wagmi/viem API
  and local Next.js documentation confirm it is supported.

## Check-in invariants

- Members sign EIP-712 typed data; they never send a check-in transaction.
- Challenges expire after 60 seconds and use a cryptographically random nonce of
  at least 16 bytes. The implementation uses a 32-byte nonce.
- EIP-712 domain: name `Unisky Pass`, version `1`, configured chain ID, and the
  configured `UniskyPassRegistry` address. Production uses chain ID `143`.
- Verification order is binding: validate payload; match the active scanner
  session; reject a used nonce; check expiry; match connected issuer; recover
  signer; match holder; perform uncached `getPass` plus `isPassValidFor` reads;
  validate issuer/program/status; then mark the nonce used and show a result.
- Replay tracking is session-only. Never claim cross-device replay prevention or
  deliberate wallet-sharing prevention.
- Every documented failure mode needs a distinct, human-readable UI state.

## Privacy and security

- Wallet addresses are the only member identity. Do not collect legal names,
  emails, phone numbers, postal addresses, IDs, photos, biometrics, or location
  history.
- Issuer and program display names must be short and non-sensitive because they
  are public and permanent onchain.
- Never commit secrets. `DEPLOYER_PRIVATE_KEY` is Foundry-only; it must never be
  `NEXT_PUBLIC_`, imported by the app, stored in Vercel, logged, or requested by
  an agent.
- Consumer copy may say that a copied static screenshot is insufficient. It may
  not claim that all replay, fraud, identity sharing, or wallet sharing is
  prevented.

## Out of scope without explicit approval

Do not add payments or subscriptions, ERC-20s, native-token custody, NFTs or
trading, escrow, refunds, social/email login, databases, server accounts, OCR,
AI, uploads, visit-count passes, event tickets, onchain check-in logs, staff or
multi-scanner permissions, analytics, notifications, GPS, face/identity checks,
multichain support, upgradeable proxies, or admin controls.

## Required checks and delivery

- Before editing Next.js code, read the relevant installed guide in
  `node_modules/next/dist/docs/` as required by the block above.
- Keep the repository green after each vertical slice.
- Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`,
  `forge build`, and `forge test` as applicable. Check-in work also requires the
  manual failure-state matrix in `docs/TEST_PLAN.md`.
- Keep all documents in `docs/` mutually consistent with the implementation.
- Deploy and verify on testnet first. Mainnet deployment is a deliberate human
  step with the human's own key, followed by contract verification, Vercel
  production environment configuration, and a real-phone smoke test.
