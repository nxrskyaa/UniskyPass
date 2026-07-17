# Architecture

## System context

Unisky Pass is a browser application backed directly by Monad. Vercel serves the
Next.js frontend, a wallet provider supplies accounts and signatures, and a
Monad RPC supplies contract reads, estimates, transaction submission, and
receipts. There is no application backend or database.

```text
                         wallet provider
                  connect / sign / transactions
                              ^
                              |
camera <-> Next.js app in browser <-> configured Monad RPC <-> UniskyPassRegistry
 local       served by Vercel       reads/writes/receipts     permanent state
 only

React memory: active scanner challenge (untrusted, current page only)
sessionStorage: used nonces (untrusted, session-only)
localStorage: optional drafts/preferences only (untrusted, never proof of validity)
```

Vercel is a frontend delivery boundary, not a trusted application-state service.
The app must not add API routes, server actions, server accounts, or persistence
that become required for pass validity or check-in.

## Source layout

The repository already uses a `src/` Next.js layout. Preserve it instead of
creating a parallel root `app/` tree.

```text
src/
  app/                 App Router routes and route-level UI
  components/          reusable product, wallet, pass, and scanner UI
  hooks/               wallet and contract interaction hooks
  lib/
    chain/              chain definitions, clients, ABI, addresses
    checkin/            challenge creation, EIP-712 types, verification pipeline
    qr/                 compact QR encoding and schema validation
    validation/         names, addresses, durations, and payload guards
  types/                shared TypeScript domain types
contracts/
  src/                  final UniskyPassRegistry source
  test/                 Foundry contract tests
  script/               Deploy.s.sol
scripts/
  verify-contract.mjs   cross-platform Monad verification API client
docs/                   binding product and operational documentation
```

Keep modules proportional to the six-day MVP. Shared security-sensitive
protocol logic should be centralized; ordinary route-specific display logic
does not need extra abstraction layers.

## Data ownership and trust

| Data | Location | Lifetime | Trust treatment |
| --- | --- | --- | --- |
| Issuers, programs, passes, timestamps, revocation | `UniskyPassRegistry` | Permanent/public | Source of truth after an RPC read |
| Connected account and chain | Wallet provider | Wallet session | Re-check before actions |
| Active scanner challenge | React memory | Current scanner page | Match exactly, but validate every field |
| Used challenge nonces | `sessionStorage` and memory | Current tab session | Local replay control only; not global truth |
| Draft form values / UI preferences | memory or `localStorage` | Local/browser-defined | Never proof of authority or validity |
| Selected chain | React context plus validated `localStorage` preference | Browser | UI preference only; wallet must still match |
| Chain, RPC, explorer, contract address | Immutable chain-keyed deployment map built from public configuration | Deployment | Resolve together; never mix fields across chains |
| Deployer key | Human's local Foundry process environment | Deployment command only | Secret; never available to frontend/Vercel |

All browser input, storage, QR content, wallet state, and RPC responses cross a
trust boundary. The scanner validates structure and binding before using them.

## Chain configuration

| Name | Testnet | Mainnet |
| --- | --- | --- |
| Chain ID | `10143` | `143` |
| RPC | `https://testnet-rpc.monad.xyz` | `https://rpc.monad.xyz` |
| Explorer | `https://testnet.monadscan.com` | `https://monadscan.com` |
| Native currency | MON, 18 decimals | MON, 18 decimals |

Use `monad` and `monadTestnet` from the installed viem/wagmi package. The app
keeps one deployment object per chain containing its chain definition, RPC,
explorer, and `UniskyPassRegistry` address. The selected deployment drives reads,
writes, query keys, explorer links, and check-in domains. A connected wallet must
match the selected chain; wrong-network state blocks reads, signatures, and
writes rather than silently mixing semantics.

The network selector stores only a preference in browser storage. Changing it
switches the connected wallet first, then clears network-scoped query/UI state.
If the wallet rejects the switch, the prior deployment remains selected.

Multicall3-backed reads use the chain's declared canonical deployment. On Monad
mainnet the canonical address is
`0xcA11bde05977b3631167028862bE2a173976CA11`; viem can use it automatically when
the chain definition includes it. Never invent or silently substitute a contract
address.

## Contract interaction model

### Reads

- `getIssuer` / `isIssuer` drive issuer onboarding.
- `getIssuerPrograms` plus batched `getProgram` calls drive issuer program lists.
- `getProgramPasses` plus batched `getPass` calls drive issued-pass lists.
- `getHolderPasses` plus batched `getPass` and `getProgram` calls drive My Passes.
- `getPassStatus` provides a non-reverting status probe.
- Scanner verification bypasses application caches and performs fresh
  `getPass` plus `isPassValidFor` calls immediately before a `VALID` result.

No indexer is required because the MVP reads the contract's explicit ID arrays
and does not offer event history, analytics, or onchain check-in logs.

### Writes

Issuer registration, program management, pass issuance, extension, and
revocation are wallet transactions. Each write has explicit confirmation,
submitted/pending, confirmed, rejected, reverted, and RPC-error states. UI data
is refreshed from the contract after confirmation; an optimistic draft is not
treated as committed state.

Monad charges based on the submitted gas limit rather than receipt gas used:

```text
estimatedCost = gasLimit * pricePerGas
```

Estimate against the selected Monad RPC, use a buffer no larger than 10%, show
the limit-based cost, and never rely on an inflated wallet fallback. Cold account
and storage accesses are more expensive than Ethereum defaults, so Ethereum
estimates are not reusable. Use `eth_sendRawTransactionSync` only if the installed
wagmi/viem version exposes and supports the relevant API; preserve the normal
receipt/error path otherwise.

## Check-in subsystem

The check-in path is client-side and has no member transaction:

1. `crypto.getRandomValues` creates a 32-byte nonce.
2. The QR module emits compact JSON encoded as base64url with prefix `usp1.`.
3. The member signs EIP-712 primary type `CheckInProof`, domain-bound to the
   selected deployment's chain and `UniskyPassRegistry` address.
4. The response carries the original challenge, pass, holder, and signature.
5. A single verification pipeline applies schema, session, replay, time, issuer,
   signature, signer, and fresh contract checks in that order.
6. A successful nonce is stored under the versioned session key and then the
   scanner renders `VALID`.

Details and compact key mappings are in
[Check-in protocol](CHECKIN_PROTOCOL.md). Session storage improves local replay
resistance but is explicitly not a cross-device or durable nonce authority.

## Time model

- Challenge `createdAt` and `expiresAt` are Unix seconds created and checked by
  the scanner browser; the interval is exactly 60 seconds.
- Pass `validFrom` and `expiresAt` are enforced by contract `block.timestamp`.
- The UI may show a local countdown, but local time never establishes pass
  validity.
- After writes such as revocation, the UI waits for a receipt and re-reads chain
  state. A submitted but not yet observable transaction is not final product
  state.

## Privacy model

Camera decoding and signature verification run in the browser. The application
does not upload camera frames or create user profiles. Public onchain data is
limited to wallet relationships, short issuer/program names, pass timing, and
revocation state. RPC and wallet providers remain independent infrastructure
trust boundaries and may observe network metadata.

## Deployment model

1. The contract is built, tested, deployed, and verified on testnet.
2. A Vercel preview uses the testnet public environment and completes the full
   two-wallet real-camera loop.
3. A human uses their own local `DEPLOYER_PRIVATE_KEY` to deploy the unchanged
   contract to mainnet.
4. The verification script posts Foundry artifacts to the Monad verification API.
5. Vercel receives the public deployment values for both networks; Preview
   defaults to testnet and Production defaults to mainnet.
6. The production URL completes the same smoke test on mainnet, then verifies
   that switching to testnet exposes only testnet state.

There is no automated mainnet key custody and no server component that can alter
contract state on a user's behalf.

## Failure containment

- Invalid or mixed configuration stops the relevant flow with a specific error.
- RPC failure never degrades to a cached `VALID` result.
- Camera failure permits retry but not unvalidated manual success.
- Contract writes are never considered complete before confirmation and refresh.
- A malformed or unknown QR version is rejected before signature recovery or RPC
  access.
- If a security concern is found in the final contract, document it and stop; do
  not silently change the binding contract API.
