# Deployment plan

## Release principles

- The contract is deployed and verified on Monad testnet before mainnet.
- The complete check-in loop is tested with two wallets and a real phone camera
  over HTTPS before mainnet.
- A human deploys mainnet using their own key in their local Foundry process.
- The deployer key is never committed, pasted into application files, prefixed
  `NEXT_PUBLIC_`, imported by Next.js, or configured in Vercel.
- Vercel receives only public frontend configuration: the default chain, RPC,
  explorer, verified contract address for each supported network, Privy App ID,
  and optional Privy Client ID. No Privy secret is used.
- Privy allows only exact controlled development, preview, and production
  origins; generic Vercel preview wildcards are forbidden.
- The frontend is deployed only after the contract address is known and verified.

## Network values

| Environment | Chain ID | Registry | RPC | Explorer |
| --- | ---: | --- | --- | --- |
| Testnet | `10143` | `0x7a2fDcaa6eAC3a0c8E0E6E391Ca9c7ef2B737690` | `https://testnet-rpc.monad.xyz` | `https://testnet.monadscan.com` |
| Mainnet | `143` | `0x935D7681Fd0454f38848925fc03d918dA036Ed99` | `https://rpc.monad.xyz` | `https://monadscan.com` |

Contract source identifier:

```text
src/UniskyPassRegistry.sol:UniskyPassRegistry
```

There are no constructor arguments.

## Prerequisites

- Node.js/npm and Foundry are installed.
- The repository is clean at an intentional release commit.
- `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`,
  `forge build`, and `forge test` pass.
- The deploy script target is `contracts/script/Deploy.s.sol:Deploy`.
- The human-controlled deployer wallet has sufficient MON on the target network.
- The human has reviewed the deployer address and target chain.
- Vercel CLI access is authenticated for the intended account/project.
- The Privy Dashboard app is controlled by the release owner, with Email and
  Wallet enabled, SMS enabled only where the plan/region supports it, embedded
  EVM wallet creation enabled for users without wallets, and both Monad networks
  configured.
- No deployed address is copied from an unverified log or chat message.

Every `forge script` deployment command must pass
`--gas-estimate-multiplier 110`. The current Foundry script default is higher,
and Monad charges from the submitted gas limit rather than receipt gas used. Do
not omit the flag or add a large manual gas limit.

## Safe local key handling

`Deploy.s.sol` reads `DEPLOYER_PRIVATE_KEY` through `vm.envUint`. Set it only in
the current local process. On PowerShell 7, a masked prompt can be used:

```powershell
$env:DEPLOYER_PRIVATE_KEY = Read-Host "DEPLOYER_PRIVATE_KEY" -MaskInput
```

On Windows PowerShell without `-MaskInput`, use a secure prompt and convert only
into the current process environment:

```powershell
$secureKey = Read-Host "DEPLOYER_PRIVATE_KEY" -AsSecureString
$keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
try {
  $env:DEPLOYER_PRIVATE_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer)
}
```

Do not echo the variable or run commands that dump the environment. After the
deployment and verification commands finish:

```powershell
Remove-Item Env:DEPLOYER_PRIVATE_KEY
```

## Stage 1 — Local release gates

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

Stop if any command fails. Keep the compiler/artifacts used for deployment so the
verification script can read exact Foundry metadata.

## Stage 2 — Monad testnet deployment

After setting the human's testnet deployer key in the current process:

```powershell
Set-Location contracts
forge script script/Deploy.s.sol:Deploy --rpc-url https://testnet-rpc.monad.xyz --broadcast --gas-estimate-multiplier 110
Set-Location ..
```

Record the public deployment transaction hash and emitted registry address. Do
not infer the address in advance. Confirm the receipt is successful and the
address has code on the testnet explorer.

## Stage 3 — Testnet source verification

From the repository root, use the cross-platform verification script:

```powershell
node scripts/verify-contract.mjs --address 0xDEPLOYED_TESTNET_ADDRESS --chain-id 10143
```

The script invokes Foundry in `contracts/`, reads:

```text
contracts/out/UniskyPassRegistry.sol/UniskyPassRegistry.json
```

and posts standard JSON plus Foundry metadata to:

```text
https://agents.devnads.com/v1/verify
```

This API is the primary path because it verifies across Monad explorers. Check
the script result and testnet explorer source before using the address.

Fallback only if the verification API fails:

```powershell
Set-Location contracts
forge verify-contract 0xDEPLOYED_TESTNET_ADDRESS src/UniskyPassRegistry.sol:UniskyPassRegistry --chain 10143 --verifier sourcify --verifier-url "https://sourcify-api-monad.blockvision.org/"
Set-Location ..
```

Record that fallback was needed and verify the explorer result manually.

## Stage 4 — Local dual-network configuration

Create `.env.local` from the committed example. Configure both verified
deployments and choose testnet as the initial local default:

```dotenv
NEXT_PUBLIC_DEFAULT_MONAD_CHAIN_ID=10143
NEXT_PUBLIC_PRIVY_APP_ID=cmrojn0js00bg0djs58eirybr
# Optional; set only after creating an environment-specific Privy app client.
NEXT_PUBLIC_PRIVY_CLIENT_ID=
NEXT_PUBLIC_MONAD_MAINNET_RPC_URL=https://rpc.monad.xyz
NEXT_PUBLIC_MONAD_MAINNET_EXPLORER_URL=https://monadscan.com
NEXT_PUBLIC_UNISKY_PASS_MAINNET_CONTRACT_ADDRESS=0x935D7681Fd0454f38848925fc03d918dA036Ed99
NEXT_PUBLIC_MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_TESTNET_EXPLORER_URL=https://testnet.monadscan.com
NEXT_PUBLIC_UNISKY_PASS_TESTNET_CONTRACT_ADDRESS=0x7a2fDcaa6eAC3a0c8E0E6E391Ca9c7ef2B737690
```

The Privy App ID and optional Client ID are public browser identifiers. Do not
put `DEPLOYER_PRIVATE_KEY`, a Privy App Secret, or a Privy authorization key in
`.env.local`. This client-only flow does not need those Privy secrets. Rebuild
after changing public variables because Next.js may inline them:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

## Stage 5 — Vercel testnet preview

Link the intended repository/project if it is not already linked:

```powershell
npx vercel link
```

Add or update these **Preview** environment variables through the Vercel
dashboard or the interactive CLI:

```powershell
npx vercel env add NEXT_PUBLIC_DEFAULT_MONAD_CHAIN_ID preview
npx vercel env add NEXT_PUBLIC_PRIVY_APP_ID preview
# Optional, only if a Preview app client exists:
npx vercel env add NEXT_PUBLIC_PRIVY_CLIENT_ID preview
npx vercel env add NEXT_PUBLIC_MONAD_MAINNET_RPC_URL preview
npx vercel env add NEXT_PUBLIC_MONAD_MAINNET_EXPLORER_URL preview
npx vercel env add NEXT_PUBLIC_UNISKY_PASS_MAINNET_CONTRACT_ADDRESS preview
npx vercel env add NEXT_PUBLIC_MONAD_TESTNET_RPC_URL preview
npx vercel env add NEXT_PUBLIC_MONAD_TESTNET_EXPLORER_URL preview
npx vercel env add NEXT_PUBLIC_UNISKY_PASS_TESTNET_CONTRACT_ADDRESS preview
```

Enter the public values from Stage 4, keeping `10143` as the Preview default.
The Client ID may remain unset when no Preview app client exists. Never add the
deployer key or a Privy secret. Create an HTTPS preview:

```powershell
npx vercel
```

Environment changes apply only to new deployments, so redeploy after any edit.

In Privy Dashboard before opening the preview:

1. Enable Email and Wallet login. Enable SMS only after confirming the target
   country is available for the current plan/provider.
2. Configure embedded Ethereum wallets with creation on login for users without
   a wallet.
3. Support Monad testnet (`10143`) and mainnet (`143`), with testnet as the
   Preview default.
4. Allow the exact Preview HTTPS origin, or use an environment-specific app
   client/stable preview domain controlled by the project owner.
5. For local QA only, allow the exact `http://localhost:3000` origin and remove
   it when it is no longer needed.

Never allow `https://*.vercel.app`: unrelated projects can use that namespace.

## Stage 6 — Mandatory testnet acceptance gate

On the Vercel preview, use two wallets and real phone cameras to complete:

1. Email OTP login, embedded-wallet creation, logout/login recovery of the same
   address, and external-wallet login;
2. SMS OTP only where it is enabled and available, otherwise a clear Email or
   Wallet fallback;
3. issuer registration;
4. program creation;
5. pass issuance to the member;
6. member pass discovery and detail;
7. challenge QR creation and countdown;
8. member EIP-712 signature with no transaction;
9. response scan and fresh onchain `VALID`;
10. same-session replay rejection;
11. expired/wrong-wallet/wrong-program errors; and
12. revocation between signature and verification, producing `Pass revoked`.

Also run the rest of `TEST_PLAN.md`, inspect mobile layout/camera permissions,
and confirm every link stays on testnet. Stop here if any core/security condition
fails.

## Stage 7 — Human Monad mainnet deployment

Mainnet is an explicit human action. Confirm the deployer wallet, mainnet balance,
source commit, green gates, and chain values again. Set the human's mainnet key
only in the current process, then run:

```powershell
Set-Location contracts
forge script script/Deploy.s.sol:Deploy --rpc-url https://rpc.monad.xyz --broadcast --gas-estimate-multiplier 110
Set-Location ..
```

Capture the public transaction hash and emitted address. Confirm successful code
deployment at `https://monadscan.com` before continuing. Then clear the key from
the environment.

The contract is immutable and has no owner/admin upgrade. A deployment cannot be
rolled back. If the transaction, bytecode, chain, or verification is wrong, do
not point Vercel at it; investigate and, only with human approval, deploy a new
verified instance.

## Stage 8 — Mainnet verification

From the repository root:

```powershell
node scripts/verify-contract.mjs --address 0xDEPLOYED_MAINNET_ADDRESS --chain-id 143
```

Confirm the explorer displays verified source and the expected ABI. Fallback
only if the API fails:

```powershell
Set-Location contracts
forge verify-contract 0xDEPLOYED_MAINNET_ADDRESS src/UniskyPassRegistry.sol:UniskyPassRegistry --chain 143 --verifier sourcify --verifier-url "https://sourcify-api-monad.blockvision.org/"
Set-Location ..
```

Do not configure production with an unverified or mismatched address.

## Stage 9 — Vercel production configuration and deploy

Add or replace these **Production** environment variables:

```powershell
npx vercel env add NEXT_PUBLIC_DEFAULT_MONAD_CHAIN_ID production
npx vercel env add NEXT_PUBLIC_PRIVY_APP_ID production
# Optional, only if a Production app client exists:
npx vercel env add NEXT_PUBLIC_PRIVY_CLIENT_ID production
npx vercel env add NEXT_PUBLIC_MONAD_MAINNET_RPC_URL production
npx vercel env add NEXT_PUBLIC_MONAD_MAINNET_EXPLORER_URL production
npx vercel env add NEXT_PUBLIC_UNISKY_PASS_MAINNET_CONTRACT_ADDRESS production
npx vercel env add NEXT_PUBLIC_MONAD_TESTNET_RPC_URL production
npx vercel env add NEXT_PUBLIC_MONAD_TESTNET_EXPLORER_URL production
npx vercel env add NEXT_PUBLIC_UNISKY_PASS_TESTNET_CONTRACT_ADDRESS production
```

Values:

```dotenv
NEXT_PUBLIC_DEFAULT_MONAD_CHAIN_ID=143
NEXT_PUBLIC_PRIVY_APP_ID=cmrojn0js00bg0djs58eirybr
# Optional; set only to the Production app-client ID from Privy Dashboard.
NEXT_PUBLIC_PRIVY_CLIENT_ID=
NEXT_PUBLIC_MONAD_MAINNET_RPC_URL=https://rpc.monad.xyz
NEXT_PUBLIC_MONAD_MAINNET_EXPLORER_URL=https://monadscan.com
NEXT_PUBLIC_UNISKY_PASS_MAINNET_CONTRACT_ADDRESS=0x935D7681Fd0454f38848925fc03d918dA036Ed99
NEXT_PUBLIC_MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_TESTNET_EXPLORER_URL=https://testnet.monadscan.com
NEXT_PUBLIC_UNISKY_PASS_TESTNET_CONTRACT_ADDRESS=0x7a2fDcaa6eAC3a0c8E0E6E391Ca9c7ef2B737690
```

If a variable already exists, update/remove-and-re-add it through the dashboard
or CLI rather than retaining a stale value. Inspect the environment list and
confirm `DEPLOYER_PRIVATE_KEY`, Privy App Secret, and Privy authorization keys
are absent. Only the public Privy App ID and optional Client ID belong in the
frontend environment.

In Privy Dashboard, allow the exact production origin
`https://unisky-pass.vercel.app`, set mainnet (`143`) as the default supported
chain while retaining testnet (`10143`), and re-check the enabled login methods.
Do not add `https://*.vercel.app`. Then deploy a new production build:

```powershell
npx vercel --prod
```

Record the production URL and deployment ID. Ensure the canonical domain resolves
to this deployment and HTTPS/camera permission works.

## Stage 10 — Production smoke test

Against the production URL and mainnet verified contract:

- confirm chain ID `143`, mainnet explorer links, and expected contract address;
- complete Email and external-wallet login, embedded-wallet logout/login
  recovery, and SMS only if production actually enables it;
- connect issuer/member demo wallets and complete the full core loop;
- confirm the member gets no transaction request during check-in;
- confirm same-session replay rejection;
- confirm a fresh read catches revocation after signing;
- exercise a distinct invalid-signature or wrong-wallet result;
- switch to testnet and confirm the address, explorer, passes, programs, queries,
  and QR domain all switch together, then return to mainnet;
- check real-phone camera permissions and scan reliability; and
- confirm email/phone identifiers and OTPs are absent from browser persistence,
  application logs, QR payloads, and onchain data; and
- confirm UI/security copy states session-only replay and wallet-sharing limits.

The definition of done is the complete loop passing on the Vercel production URL
against Monad mainnet, not merely a successful Vercel build.

## Rollback and failure handling

### Frontend

If production has a frontend regression, use Vercel to promote/restore the last
known-good deployment and correct environment values. A restored frontend must
still point to the intended verified contract/network. Re-run the smoke test.

### Contract

`UniskyPassRegistry` cannot be paused globally, upgraded, or rolled back. Do not
advertise a failed/unverified deployment. A replacement deployment is a new
address and requires human approval, source verification, the relevant
chain-keyed environment update, a new Vercel deployment, and complete smoke
testing.

### RPC or explorer

An RPC outage produces a visible unavailable/retry state and never cached
`VALID`. Explorer outage does not change state but blocks verification evidence;
do not complete release sign-off until verification can be confirmed.

## Release record

Retain only public evidence:

- release commit;
- testnet and mainnet addresses/transaction hashes;
- verification responses and explorer links;
- lint/build/Foundry results;
- Vercel preview/production deployment IDs and URLs; and
- manual device/browser test notes.

Never retain private keys, seed phrases, environment dumps, or unnecessary full
signed response payloads. Never retain login email addresses, phone numbers,
OTPs, or Privy access tokens in the release record.
