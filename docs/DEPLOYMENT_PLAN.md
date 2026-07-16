# Deployment plan

## Release principles

- The contract is deployed and verified on Monad testnet before mainnet.
- The complete check-in loop is tested with two wallets and a real phone camera
  over HTTPS before mainnet.
- A human deploys mainnet using their own key in their local Foundry process.
- The deployer key is never committed, pasted into application files, prefixed
  `NEXT_PUBLIC_`, imported by Next.js, or configured in Vercel.
- Vercel receives only the public RPC, chain ID, verified contract address, and
  explorer URL.
- The frontend is deployed only after the contract address is known and verified.

## Network values

| Environment | Chain ID | RPC | Explorer |
| --- | ---: | --- | --- |
| Testnet | `10143` | `https://testnet-rpc.monad.xyz` | `https://testnet.monadscan.com` |
| Mainnet | `143` | `https://rpc.monad.xyz` | `https://monadscan.com` |

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

## Stage 4 — Local testnet configuration

Create `.env.local` from the committed example and set the verified address:

```dotenv
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_CHAIN_ID=10143
NEXT_PUBLIC_UNISKY_PASS_CONTRACT_ADDRESS=0xDEPLOYED_TESTNET_ADDRESS
NEXT_PUBLIC_BLOCK_EXPLORER_URL=https://testnet.monadscan.com
```

Do not put `DEPLOYER_PRIVATE_KEY` in `.env.local`. Rebuild after changing public
variables because Next.js may inline them:

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
npx vercel env add NEXT_PUBLIC_MONAD_RPC_URL preview
npx vercel env add NEXT_PUBLIC_MONAD_CHAIN_ID preview
npx vercel env add NEXT_PUBLIC_UNISKY_PASS_CONTRACT_ADDRESS preview
npx vercel env add NEXT_PUBLIC_BLOCK_EXPLORER_URL preview
```

Enter the four testnet values from Stage 4. Never add the deployer key. Create an
HTTPS preview:

```powershell
npx vercel
```

Environment changes apply only to new deployments, so redeploy after any edit.

## Stage 6 — Mandatory testnet acceptance gate

On the Vercel preview, use two wallets and real phone cameras to complete:

1. issuer registration;
2. program creation;
3. pass issuance to the member;
4. member pass discovery and detail;
5. challenge QR creation and countdown;
6. member EIP-712 signature with no transaction;
7. response scan and fresh onchain `VALID`;
8. same-session replay rejection;
9. expired/wrong-wallet/wrong-program errors; and
10. revocation between signature and verification, producing `Pass revoked`.

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
npx vercel env add NEXT_PUBLIC_MONAD_RPC_URL production
npx vercel env add NEXT_PUBLIC_MONAD_CHAIN_ID production
npx vercel env add NEXT_PUBLIC_UNISKY_PASS_CONTRACT_ADDRESS production
npx vercel env add NEXT_PUBLIC_BLOCK_EXPLORER_URL production
```

Values:

```dotenv
NEXT_PUBLIC_MONAD_RPC_URL=https://rpc.monad.xyz
NEXT_PUBLIC_MONAD_CHAIN_ID=143
NEXT_PUBLIC_UNISKY_PASS_CONTRACT_ADDRESS=0xVERIFIED_MAINNET_ADDRESS
NEXT_PUBLIC_BLOCK_EXPLORER_URL=https://monadscan.com
```

If a variable already exists, update/remove-and-re-add it through the dashboard
or CLI rather than retaining a stale value. Inspect the environment list and
confirm `DEPLOYER_PRIVATE_KEY` is absent. Deploy a new production build:

```powershell
npx vercel --prod
```

Record the production URL and deployment ID. Ensure the canonical domain resolves
to this deployment and HTTPS/camera permission works.

## Stage 10 — Production smoke test

Against the production URL and mainnet verified contract:

- confirm chain ID `143`, mainnet explorer links, and expected contract address;
- connect issuer/member demo wallets and complete the full core loop;
- confirm the member gets no transaction request during check-in;
- confirm same-session replay rejection;
- confirm a fresh read catches revocation after signing;
- exercise a distinct invalid-signature or wrong-wallet result;
- check real-phone camera permissions and scan reliability; and
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
address and requires human approval, source verification, all four environment
updates, a new Vercel deployment, and complete smoke testing.

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
signed response payloads.
