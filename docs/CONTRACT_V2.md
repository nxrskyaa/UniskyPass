# Unisky Pass Registry V2

`UniskyPassRegistryV2` is a fresh deployment that keeps the V1 registry model and adds optional public pass metadata:

- `memberLabel`: a short display label for the holder wallet, max 64 bytes.
- `issuerNote`: an operational note for the issuer, max 160 bytes.

Both values are onchain and publicly readable. Do not put emails, phone numbers, legal names, IDs, or sensitive notes in them. The wallet address remains the canonical identity.

V2 does not migrate V1 state. Existing V1 passes remain valid on V1; a V2 deployment starts with new issuer, program, and pass IDs from 1.

## Deploy

Set `DEPLOYER_PRIVATE_KEY` in the shell used by Foundry. Never put it in `NEXT_PUBLIC_*`, Vercel, source control, or the frontend.

```powershell
npm run contracts:build
npm run contracts:test

# Monad testnet dry run
forge script script/DeployV2.s.sol:DeployV2 --root contracts `
  --rpc-url https://testnet-rpc.monad.xyz --broadcast --gas-estimate-multiplier 110

# Monad mainnet, after testnet verification
forge script script/DeployV2.s.sol:DeployV2 --root contracts `
  --rpc-url https://rpc.monad.xyz --broadcast --gas-estimate-multiplier 110
```

After deployment, record the address for each network and update the frontend ABI/config before issuing V2 passes. Do not point the V1 frontend at a V2 address until its `getPass` decoding and `issuePassWithDetails` flow are updated together.

## New write methods

- `issuePass(...)` remains available with empty metadata for compatibility.
- `issuePassWithDetails(...)` issues a pass with both optional fields.
- `updatePassDetails(...)` lets the issuer edit both fields.
- `updateMemberLabel(...)` lets only the holder edit their own display label.

Revocation remains permanent, passes remain non-transferable, ordinary MON transfers revert, and there is no owner/admin/upgrade/payment surface.
