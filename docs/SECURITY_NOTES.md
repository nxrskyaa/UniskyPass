# Security notes

## Scope and security posture

This is a six-day MVP, not a formally audited access-control or identity system.
Its security goal is narrow: require a fresh wallet signature bound to a specific
issuer challenge and verify current onchain pass state before showing `VALID`.

The contract has no intentional fund flow, payable entry point, owner,
administrator, proxy, or withdrawal path. Ordinary MON transfers revert. The
frontend has no first-party backend, database, server account, or mainnet
deployment key. Privy independently provides optional authentication and
embedded-wallet infrastructure.

## Honest claims

Approved claim:

> Unisky Pass prevents access through a copied static pass screenshot by
> requiring a fresh wallet signature bound to a temporary issuer challenge.

Required caveats:

- Replay prevention is scoped to the issuer's current browser session.
- Full cross-device or durable replay prevention needs a shared backend or an
  onchain nonce registry, intentionally outside the MVP.
- Deliberate wallet sharing is not prevented. Whoever controls the holder wallet
  can produce a valid proof.
- An onchain issuer registration proves control of an address, not the issuer's
  legal identity, reputation, or authorization to represent an organization.
- Email or SMS OTP login proves control of that login channel at that moment; it
  does not establish the user's legal or physical identity.

Do not claim that the product prevents all fraud, impersonation, QR replay,
credential sharing, or account compromise.

## Threat model

### Protected decisions

- Whether the response was signed by the stored holder wallet.
- Whether the response is bound to this issuer, program, chain, contract, nonce,
  and short challenge window.
- Whether the pass is active in fresh contract state at verification time.

### Trusted or assumed components

- The holder and issuer wallet providers correctly protect keys and present
  accurate signature/transaction prompts.
- Privy correctly authenticates enabled login methods, protects embedded-wallet
  operations, and returns the intended active wallet.
- The configured Monad RPC reports canonical-enough current state.
- The deployed address corresponds to the verified `UniskyPassRegistry` source.
- The issuer uses the intended production frontend and keeps the scanner browser
  and device free of malicious extensions/scripts.
- Browser cryptographic randomness is available.

### Not protected

- A compromised or voluntarily shared member wallet.
- A compromised issuer wallet or scanner device.
- A compromised email inbox, phone/SIM, OTP, Privy session, or linked external
  wallet.
- Global nonce consumption across browsers/devices.
- Legal identity, physical identity, or organizational authorization.
- Availability during RPC, wallet, network, camera, or Vercel outage.
- Malicious replacement frontends hosted at other URLs.

## Control matrix

| Threat | MVP control | Residual risk |
| --- | --- | --- |
| Copied static pass screenshot | Fresh random challenge plus holder EIP-712 signature | Wallet control can still be shared |
| Replayed response in same session | Successful nonce stored in versioned `sessionStorage` ledger | Clearing/ending session removes record |
| Replay on another device/session | Challenge must match active scanner session and expires in 60 seconds | No shared durable nonce authority |
| Cross-chain signature reuse | EIP-712 domain contains `chainId` | Misconfigured environment could break binding; fail on mixed config |
| Cross-contract signature reuse | Domain contains `verifyingContract` | A malicious lookalike UI can request a different signature; user must trust origin/prompt |
| Wrong issuer/program | Both are signed, session-matched, and compared with contract state | Compromised issuer wallet remains authoritative for its own passes |
| QR field tampering | Strict schema/session checks plus signature verification | Parser bugs or unbounded inputs; enforce limits and reject unknown versions |
| Stale UI pass state | Scanner performs uncached `getPass` and `isPassValidFor` reads | RPC can be stale, faulty, or malicious |
| Revocation after member signs | Fresh scanner read wins | A submitted revocation not yet confirmed/observable may not be seen |
| Challenge expiry bypass | Scanner checks 60-second expiry before signature and chain reads | Incorrect/altered browser clock affects client-only expiry |
| Frontend spoofing | Verified deployment URL, contract address display/explorer links | No light client or code-signing guarantee in browser |
| Privy App ID reuse | Exact allowed origins in Privy Dashboard | App ID and Client ID are public; an overly broad origin rule weakens the boundary |
| Email/SMS account takeover | Provider OTP flow and short-lived login code | Inbox compromise, SIM swap, forwarding, phishing, or device compromise |
| Wrong linked wallet | One explicit Privy/wagmi active wallet and account-scoped state reset | User may still select an unintended wallet and must confirm its address |
| Name/content injection | React text escaping and 64-byte contract bound | Unicode spoofing or misleading issuer names remain possible |
| Secret leakage | Deployer key remains local Foundry-only; no Privy secret is needed by the client | Human shell, clipboard, malware, logs, or history can still leak secrets |
| Excess gas cost | Monad RPC estimation, maximum 10% buffer, cost from gas limit | Wallet/provider may alter submitted fields; user must review |
| Holder-pass enumeration denial of service | Graceful RPC failure, batched follow-up reads, unsolicited-pass warnings | Unpaginated `getHolderPasses` can be spammed beyond practical read limits |

## Verification invariants

The scanner fails closed and follows the exact order in
[Check-in protocol](CHECKIN_PROTOCOL.md): schema, scanner-session match, used
nonce, expiry, issuer, signature, signer/holder, fresh contract reads,
issuer/program/status, then local nonce consumption. It never shows `VALID` from
a cached query, QR contents alone, a signature alone, or an RPC error fallback.

The response is bound through EIP-712 to:

- `passId` and `programId`;
- `holder` and `issuer`;
- a cryptographically random 32-byte nonce;
- challenge expiry;
- domain chain ID; and
- domain registry address.

The challenge creation time is not independently trusted; the full original
challenge must exactly match scanner-session state, and its signed expiry plus
session match controls the active window.

## Replay limitations

The key `unisky-pass:used-checkin-nonces:v1` is a browser-session ledger, not a
security database. `sessionStorage` is isolated by origin and tab/session
semantics, can be cleared, and is controlled by the client. It is useful for
rejecting immediate repeat scans on the same scanner, but cannot establish that
a nonce has never been used elsewhere.

Full cross-device prevention has two possible future designs, neither authorized
for this MVP:

- a shared backend nonce store with authenticated scanner sessions; or
- an onchain nonce-consumption registry, which adds issuer transactions, gas,
  latency, and contract/API scope.

## Wallet-sharing limitation

The protocol proves control of a wallet key, not presence of a particular human.
If the holder shares the wallet, seed phrase, device, session, or signing access,
another person can create a valid proof. GPS, biometrics, legal identity, and
face matching are explicitly out of scope. UI and marketing must state this
honestly.

## Privy authentication and active-wallet boundary

Privy login is an onboarding and wallet-access mechanism, not the membership
decision. The registry and EIP-712 proof use only the active wallet address.
Unisky Pass must not use email, phone, or a Privy user ID as an issuer, holder,
or authorization key, and must not persist those identifiers or OTPs.

The Privy App ID and optional app-client ID are intentionally public browser
configuration. They are not credentials. The production App ID must be
restricted to exact controlled origins in the Privy Dashboard; generic
`https://*.vercel.app` preview access is not acceptable. This client-only MVP
does not require a Privy App Secret or authorization key, and neither may be
added to source, browser variables, or Vercel.

Privy can link multiple wallets while wagmi exposes one active wallet to product
hooks. Connecting another wallet, switching the active wallet, or logging out is
blocked while a transaction is active or uncertain. After an accepted wallet
change, account-scoped queries, scanner challenges, and temporary check-in state
are reset before another protected action.

## RPC and finality assumptions

Fresh reads reduce stale application-cache risk but still trust the selected
Monad RPC. A malicious or lagging RPC could misreport state. The MVP does not run
a light client or compare multiple RPC providers.

After issuing, extending, or revoking, wait for the transaction receipt and then
re-read state. Monad confirmation is fast, but a submitted transaction is not
treated as effective before it is observable. A scanner that reads before a
revocation is confirmed may validly observe the old active state.

## Timestamp assumptions

Pass validity uses `block.timestamp`, the contract's intended chain-time source.
Challenge expiry uses scanner browser time because there is no backend. Users
should keep device time automatic. The 60-second window limits but does not
eliminate clock-manipulation risk.

## Frontend and QR hardening

- Validate the `usp1.` prefix and protocol version before decoding fields.
- Bound QR input length and reject malformed base64url, JSON, hex, integers, and
  addresses.
- Never evaluate QR content or inject display names as HTML.
- Do not log full signatures, response QRs, private keys, or seed phrases.
- Do not retain/upload camera frames.
- Treat local/session storage as attacker-controlled input.
- Block all check-in work on wrong or mixed chain/contract configuration.
- Keep dependencies small, maintained, locked, and reviewed for camera/QR scope.
- Use HTTPS in deployed camera testing; browser camera APIs may not work on an
  insecure non-local origin.

## Monad gas safety

Monad charges by submitted gas limit rather than actual gas used. All state
writes must estimate against the target Monad RPC, add no more than 10%, and show
the estimated cost as `gasLimit * gasPrice`. Never present receipt `gasUsed` as
the amount the user was charged and never accept a giant wallet fallback without
warning. Member check-in itself is signature-only and should never request gas.

## Deployment-key safety

- A human supplies `DEPLOYER_PRIVATE_KEY` in the local process environment.
- The application and agents never ask the human to paste the key into source,
  chat, logs, or a Vercel variable.
- The variable is not prefixed `NEXT_PUBLIC_` and no frontend module imports it.
- Clear it from the shell after deploy and retain only the public address/tx hash.
- Verify source before configuring the frontend address.
- Testnet is mandatory before mainnet.
- Treat `NEXT_PUBLIC_PRIVY_APP_ID` and an optional
  `NEXT_PUBLIC_PRIVY_CLIENT_ID` as public identifiers, never as secrets.
- Do not create or configure a Privy App Secret for this client-only flow.

## Contract concerns

### Unbounded unsolicited holder-pass growth

This is a genuine availability concern in the final API. Any wallet can register
as an issuer, create an active program, and issue a pass to any non-zero holder
without that holder's consent. Every issue appends to the holder's private array,
while `getHolderPasses(holder)` returns the entire unpaginated array. A funded
attacker can therefore spam a victim wallet until enumeration becomes slow,
costly, exceeds an RPC response limit, or cannot complete as an `eth_call`.

MVP mitigations are incomplete by design:

- presence in My Passes is not an endorsement; show and verify the issuing
  address and treat unsolicited passes as untrusted;
- batch/bound follow-up `getPass` and `getProgram` work where possible;
- catch enumeration/RPC failures and show an honest retry/availability error
  rather than an empty wallet or stale result; and
- do not let unsolicited records affect check-in, which still requires an exact
  issuer/program challenge and holder signature.

The frontend cannot paginate the initial getter because the final contract has
no range/cursor method. Complete remediation needs a future contract/API redesign
such as holder opt-in, issuer trust policy, per-holder caps, or paginated getters.
That redesign is outside the binding MVP and the final source must not be changed
silently.

### Forced MON can become stuck

Ordinary MON transfers and payable calls revert, and the product has no custody
flow. EVM mechanics can nevertheless force native balance to any address (for
example through another contract's forced balance transfer). Any such MON at the
registry is unrecoverable because there is deliberately no withdrawal function.
This does not create an application payment path; users must never send funds to
the registry.

Other intentional limitations remain: permissionless issuer registration does
not certify identity, names and wallet/pass relationships are public and
permanent, there is no admin recovery/upgrade mechanism, and revocation is
irreversible. This review is not a formal security audit.

The supplied contract is binding. If another genuine issue is discovered during
tests or review, stop and document it in this section before any source change.

## Pre-release security gate

- Run the complete Foundry authorization, time, event, and non-payable suite.
- Test malformed, expired, replayed, wrong-wallet, wrong-issuer, wrong-program,
  wrong-chain, and wrong-contract QR responses.
- Revoke between member signing and issuer verification and confirm fresh state
  prevents `VALID`.
- Repeat the check-in on real phones over HTTPS.
- Test Email and external-wallet login, returning embedded-wallet recovery,
  logout, multiple-wallet selection, and SMS only where enabled and available.
- Confirm login identifiers and OTPs do not appear in browser persistence,
  application logs, QR payloads, contract calls, or onchain display names.
- Confirm the Privy production origin is exact and no generic Vercel wildcard is
  allowed.
- Confirm source verification and frontend address/chain coherence.
- Search build output and Vercel configuration for private-key material.
- Review all user-facing security claims against this document.
