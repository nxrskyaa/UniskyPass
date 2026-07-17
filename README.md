# Unisky Pass

**One wallet for every place you belong.**

Unisky Pass is a mobile-first membership-pass MVP for Monad. Gyms, coworking
spaces, studios, communities, and clubs can issue non-transferable, time-based
passes to a wallet. A member proves control of that wallet by signing a fresh,
60-second check-in challenge; the member does not send a transaction or pay gas
to check in.

This repository contains:

- a Next.js App Router frontend deployed on Vercel;
- the final `UniskyPassRegistry` Solidity contract and Foundry tests;
- an EIP-712 challenge/response check-in protocol encoded as QR codes; and
- deployment and verification tooling for Monad testnet and mainnet.

Unisky Pass has no first-party backend, database, payment flow, or custody.
Privy provides optional passwordless authentication and embedded EVM wallets;
permanent membership state and authority still live at wallet addresses on
Monad. Browser storage is used only for untrusted temporary UI preferences and
session-scoped replay tracking.

## Core flow

1. An issuer registers, creates a program, and issues a pass to a wallet.
2. The member connects an external wallet or logs in through Privy to use the
   embedded wallet that holds the pass, then opens **My Passes**.
3. The issuer opens **Scanner Mode** and displays a random, short-lived challenge
   QR.
4. The member scans it, selects an eligible pass, and signs an EIP-712 proof.
5. The member shows the response QR to the issuer.
6. The issuer scans it, verifies the signature, and performs a fresh Monad read
   before showing `VALID` or a specific failure reason.

An old static pass screenshot is not sufficient because every proof is bound to
a random issuer challenge, wallet, program, chain, contract, and expiry.

> Honest security boundary: Unisky Pass prevents access through a copied static
> pass screenshot by requiring a fresh wallet signature bound to a temporary
> issuer challenge. Replay prevention is scoped to one browser session. The MVP
> does not prevent deliberate wallet sharing, and full cross-device replay
> prevention would require a shared backend or an onchain nonce registry.

See [Security notes](docs/SECURITY_NOTES.md) for the complete threat model.

## Networks

| Environment | Chain ID | RPC | Explorer |
| --- | ---: | --- | --- |
| Monad testnet | `10143` | `https://testnet-rpc.monad.xyz` | `https://testnet.monadscan.com` |
| Monad mainnet | `143` | `https://rpc.monad.xyz` | `https://monadscan.com` |

The interface supports both networks at runtime. Mainnet and testnet have
separate registries and separate state; the wallet must match the network chosen
in the app. Every release must still complete a testnet dry run first.

## Prerequisites

- Node.js `20.19.0` or newer and npm (the repository engine requirement)
- Foundry (`forge`, `cast`, and `anvil`)
- A browser wallet that supports Monad, or an email-based Privy login that
  creates or restores an embedded EVM wallet
- Testnet MON for the dry run
- Mainnet MON only when the human deployer is ready to release

The deployer private key is needed only by Foundry in the human's local shell.
It must never be committed, prefixed with `NEXT_PUBLIC_`, imported by frontend
code, or configured in Vercel.

## Local development

From the repository root:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Configure `.env.local` with
both public deployments and choose only the initial default:

```dotenv
NEXT_PUBLIC_DEFAULT_MONAD_CHAIN_ID=10143
NEXT_PUBLIC_PRIVY_APP_ID=cmrojn0js00bg0djs58eirybr
# Optional: set only after creating a Privy app client for this environment.
NEXT_PUBLIC_PRIVY_CLIENT_ID=
NEXT_PUBLIC_MONAD_MAINNET_RPC_URL=https://rpc.monad.xyz
NEXT_PUBLIC_MONAD_MAINNET_EXPLORER_URL=https://monadscan.com
NEXT_PUBLIC_UNISKY_PASS_MAINNET_CONTRACT_ADDRESS=0x935D7681Fd0454f38848925fc03d918dA036Ed99
NEXT_PUBLIC_MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_TESTNET_EXPLORER_URL=https://testnet.monadscan.com
NEXT_PUBLIC_UNISKY_PASS_TESTNET_CONTRACT_ADDRESS=0x7a2fDcaa6eAC3a0c8E0E6E391Ca9c7ef2B737690
```

Production normally sets `NEXT_PUBLIC_DEFAULT_MONAD_CHAIN_ID=143`; changing the
default does not remove either network from the selector. The Privy App ID and
optional Client ID are public browser identifiers. This client-only app does not
need a Privy App Secret, and no Privy secret or authorization key belongs in
`.env.local`, Vercel, source control, or a `NEXT_PUBLIC_` variable.

Before local or hosted login testing, configure the Privy Dashboard to enable
Email and Wallet. Enable SMS only where it is available for the project's Privy
plan and target countries; do not promise phone login for an unsupported region.
Set embedded Ethereum wallet creation to `users-without-wallets`, support Monad
mainnet and testnet, and allow only exact controlled origins. For this project,
allow `http://localhost:3000` during development and
`https://unisky-pass.vercel.app` in production. Register a specific controlled
preview origin or app client instead of the unsafe generic
`https://*.vercel.app` wildcard.

## Build and test

Frontend:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run start
```

Contract:

```powershell
Set-Location contracts
forge build
forge test
Set-Location ..
```

The release gate is `npm run lint`, `npm run typecheck`, `npm test`,
`npm run build`, `forge build`, and `forge test`, followed by the manual check-in
matrix in [Test plan](docs/TEST_PLAN.md).

## Deploy

Deployment is deliberately testnet-first:

```powershell
# DEPLOYER_PRIVATE_KEY must already exist in this local process environment.
Set-Location contracts
forge script script/Deploy.s.sol:Deploy --rpc-url https://testnet-rpc.monad.xyz --broadcast --gas-estimate-multiplier 110
Set-Location ..
node scripts/verify-contract.mjs --address 0xDEPLOYED_ADDRESS --chain-id 10143
```

After the two-wallet, real-camera testnet flow passes, the human deployer may run
the same script against `https://rpc.monad.xyz`, keeping
`--gas-estimate-multiplier 110`, and verify with chain ID `143`.
The complete commands, safe key handling, Vercel environment setup, rollback,
and smoke tests are in [Deployment plan](docs/DEPLOYMENT_PLAN.md).

## Demo script

Use two wallets and two devices where possible:

1. Connect the issuer wallet, or log in through Privy and use the embedded
   wallet, on Monad; then register an issuer.
2. Create a time-based program and issue a pass to the member wallet.
3. Connect or log back into the member wallet and confirm the pass appears with
   the right status.
4. Open Scanner Mode as the issuer and create a challenge.
5. Scan and sign as the member; no member transaction should be requested.
6. Scan the response as the issuer and confirm a fresh onchain check returns
   `VALID`.
7. Scan the same response again and confirm `challenge already used`.
8. Revoke the pass, create a new challenge, and confirm the scanner returns
   `pass revoked` after a fresh contract read.

## Documentation

- [Product specification](docs/PRODUCT_SPEC.md)
- [User flows](docs/USER_FLOWS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Contract specification](docs/CONTRACT_SPEC.md)
- [Check-in protocol](docs/CHECKIN_PROTOCOL.md)
- [Security notes](docs/SECURITY_NOTES.md)
- [Privacy notes](docs/PRIVACY_NOTES.md)
- [Test plan](docs/TEST_PLAN.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Deployment plan](docs/DEPLOYMENT_PLAN.md)

## Explicitly out of scope

Payments, subscriptions, token custody, ERC-20s, NFTs, pass trading, visit-count
passes, single-use tickets, event tickets, first-party databases or server
accounts, social/OAuth methods not enabled in Privy, AI, OCR, uploads, onchain
check-in history, staff permissions, analytics, notifications, location or
biometric checks, chains beyond Monad mainnet and testnet, upgradeable proxies,
and admin controls are not part of this MVP.

Unisky Pass is a membership verification product, not an NFT platform, and the
contract never holds user funds.
