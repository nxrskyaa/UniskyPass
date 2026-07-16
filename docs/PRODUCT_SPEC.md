# Product specification

## Product definition

**Unisky Pass** is a mobile-first membership verification product for gyms,
coworking spaces, studios, communities, clubs, and similar organizations.
Issuers create time-based membership programs and issue non-transferable pass
records to wallet addresses. Members keep all of their passes in one wallet and
prove current ownership at check-in.

Tagline: **One wallet for every place you belong.**

The product is not an NFT platform, payment processor, subscription service, or
identity provider. The contract holds no funds. A member check-in is a wallet
signature, not a blockchain transaction.

## Problem and promise

A static membership image or QR can be copied. Unisky Pass instead asks the
member wallet to sign a new issuer-generated challenge that expires after 60
seconds. The scanner verifies both the signature and fresh pass state on Monad.

The precise product claim is:

> Unisky Pass prevents access through a copied static pass screenshot by
> requiring a fresh wallet signature bound to a temporary issuer challenge.

This claim does not cover deliberate wallet sharing. Replay tracking is limited
to one browser session; preventing replay across devices or cleared sessions
would require a shared backend or an onchain nonce registry, which are outside
the MVP.

## Users and modes

### Member / My Passes

A member connects the wallet to which a pass was issued. The member can:

- list passes for the connected wallet;
- see issuer, program, validity period, and status for each pass;
- distinguish `NotStarted`, `Active`, `Expired`, and `Revoked` states;
- scan an issuer challenge;
- choose an eligible pass for that issuer and program;
- sign an EIP-712 check-in proof without sending a transaction; and
- display the response QR to the issuer.

### Issuer / Issuer Dashboard

An issuer connects a wallet and can:

- register an issuer profile and update its short display name;
- create a program with a name and duration;
- pause or resume new issuance for a program;
- issue a pass to a checksummed wallet address, starting now or in the future;
- list its programs and the passes issued under them;
- extend an active or expired, non-revoked pass;
- permanently revoke a pass; and
- open Scanner Mode to perform check-in.

The modes are never mutually exclusive. The same wallet may hold passes and
operate as an issuer.

## Core MVP loop

```text
Issuer creates program -> issuer issues pass -> member sees pass
-> issuer displays challenge QR -> member scans and signs EIP-712 proof
-> member displays response QR -> issuer scans it
-> scanner verifies signature and fresh Monad state -> VALID or INVALID
```

This loop is the highest-priority acceptance path. If the six-day schedule is at
risk, secondary polish is cut before any part of this loop.

## Pass model

Only unlimited-use, time-based membership passes are supported. There are no
visit counters or single-use tickets.

A pass is valid only when all of the following are true:

1. the pass exists;
2. chain time is at or after `validFrom`;
3. chain time is before `expiresAt`;
4. the pass is not revoked;
5. the verified signer equals the stored holder;
6. the stored issuer equals the scanner's connected issuer; and
7. the stored program equals the challenged program.

Revocation is permanent. Extending an active pass adds time to its current
expiry. Extending an expired, non-revoked pass renews it from current chain time.
Expiry is never shortened.

## Functional requirements

| ID | Requirement |
| --- | --- |
| `FR-01` | Connect and disconnect a wallet, show its shortened address, and block sensitive actions on the wrong network. |
| `FR-02` | Switch between My Passes and Issuer Dashboard without assigning exclusive roles. |
| `FR-03` | Register an issuer and update its non-sensitive display name. |
| `FR-04` | Create and activate/deactivate a time-based program. |
| `FR-05` | Issue a pass to a validated non-zero wallet address, optionally with a future start. |
| `FR-06` | List issuer programs and issued passes using onchain getters and batched reads where useful. |
| `FR-07` | List holder passes and render accurate status and validity details. |
| `FR-08` | Extend eligible passes and clearly explain renewal semantics before signing. |
| `FR-09` | Revoke a pass only after an explicit irreversible-action confirmation. |
| `FR-10` | Generate a cryptographically random, session-bound, 60-second issuer challenge and live countdown. |
| `FR-11` | Let a member scan, select an eligible pass, sign `CheckInProof`, and render a response QR without a member transaction. |
| `FR-12` | Verify the response in the documented order and perform uncached `getPass` plus `isPassValidFor` reads before showing `VALID`. |
| `FR-13` | Mark a successfully verified nonce used in the current browser session and reject its reuse. |
| `FR-14` | Show a distinct, human-readable message for every documented wallet, network, QR, signature, pass, RPC, camera, and transaction failure. |

## UX requirements

- Mobile-first and comfortable for a real two-phone camera flow.
- Clean and consumer-friendly, with a distinctive visual system rather than a
  generic dashboard template.
- No oversized controls, walls of text, or crypto jargon in consumer copy.
- Visible loading, empty, retry, pending, confirmed, rejected, and reverted
  states.
- A live challenge countdown and a clear expired state.
- A high-contrast `VALID` / `INVALID` scanner result that cannot be confused.
- Accessible labels, keyboard operation where applicable, visible focus, and
  reduced-motion support.
- The landing page explains the product, why static screenshots are insufficient,
  how issuer and member flows work, and that the app never holds money.

## Data and privacy requirements

- Wallet addresses are the member identity.
- Do not collect legal names, emails, phone numbers, postal addresses, IDs,
  photos, biometrics, or location history.
- Issuer and program names must remain short, minimal, and non-sensitive because
  onchain values are public and permanent.
- Camera frames are processed locally for QR decoding and are not retained or
  uploaded by the application.
- No analytics, tracking profile, server-side account, database, or application
  event log is part of the MVP.

## Technical constraints

- Next.js App Router, TypeScript, Tailwind CSS, wagmi, and viem.
- `UniskyPassRegistry` on Monad, compiled with Solidity `0.8.28` using Foundry.
- Vercel hosts the frontend; Monad stores permanent application state.
- Production uses Monad mainnet chain ID `143`; every release first uses Monad
  testnet chain ID `10143`.
- The frontend never receives `DEPLOYER_PRIVATE_KEY`.
- Monad gas is charged from `gasLimit`, so estimates must target Monad, use no
  more than a 10% buffer, and display `gasLimit * gasPrice`.

## Out of scope

Without explicit approval, do not add payments, billing, subscriptions, ERC-20s,
native-token custody, NFTs, marketplaces, trading or transfers, escrow, refunds,
email or social login, databases, server-side accounts, OCR, AI, uploads,
visit-count passes, event tickets, onchain check-in history, staff accounts,
multi-scanner permissions, analytics, notifications, GPS, face or legal identity
verification, multichain support, upgradeable proxies, or admin controls.

## MVP definition of done

The MVP is done when:

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`,
  `forge build`, and `forge test` pass;
- the complete core loop works on Monad testnet with two wallets and a real phone
  camera, including replay and revocation checks;
- the human deployer deploys and verifies the unchanged contract on Monad
  mainnet using their own local key;
- Vercel production is configured only with the four public mainnet variables;
- the complete core loop passes again on the production URL and mainnet; and
- UI and documentation use the honest screenshot, replay, and wallet-sharing
  claims above.
