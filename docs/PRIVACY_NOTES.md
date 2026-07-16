# Privacy notes

## Privacy model

Unisky Pass uses wallet addresses as membership identity and intentionally avoids
traditional personal profiles. It has no application backend, database,
server-side account system, analytics pipeline, upload service, or onchain
check-in history.

This design minimizes collection, but it is not anonymous: public blockchain
records can be observed and correlated by anyone.

## Data that is public and permanent

`UniskyPassRegistry` exposes:

- issuer wallet addresses and registration timestamps;
- issuer display names;
- program IDs, names, durations, active flags, and issuer relationships;
- pass IDs, holder and issuer wallet addresses, program relationships, issue
  times, start times, expiry times, and revocation state; and
- mutation events for registrations, names, programs, issuance, extensions, and
  revocations.

Blockchain data cannot be deleted by Unisky Pass or Vercel. Updating an issuer
name does not erase the old value from transaction/event history. Revoking a
pass changes status but does not remove its record.

Because this data is public and permanent:

- issuer and program names must be minimal and non-sensitive;
- do not put a legal name in a display field unless the person knowingly accepts
  permanent public disclosure;
- never put emails, phone numbers, postal addresses, account numbers, IDs,
  medical details, or private notes in a name field; and
- an issuer must obtain and handle holder wallet addresses responsibly.

The final contract does not require holder consent before issuance. A wallet may
therefore receive unsolicited pass records. The UI must not imply that every
listed issuer is trusted or that a holder endorsed the relationship merely
because it appears onchain.

## Data the product must not collect

The MVP must not request or store:

- member legal names;
- email addresses or phone numbers;
- home/work postal addresses;
- government or organization identity documents;
- profile photos, face templates, or other biometrics;
- GPS coordinates or location history;
- payment or bank information;
- social-login identities;
- camera images or video recordings; or
- a server-side log of check-in attempts or history.

Wallet seed phrases and private keys are never application data. The app must
never ask for them.

## Browser-local temporary data

The application may use:

- memory/session storage for the current scanner challenge;
- `sessionStorage` key `unisky-pass:used-checkin-nonces:v1` for used nonces in
  the current scanner session;
- memory for decoded challenges, response payloads, and signatures during a live
  flow; and
- `localStorage` for non-sensitive drafts or UI preferences if implemented.

Browser storage is client-controlled and untrusted. It must not be treated as
proof of membership, authority, or global nonce use. Session data should expire
with the browser session, and product code should not prolong signature/response
retention beyond the live flow.

Clearing browser data removes local temporary state but cannot delete onchain
records. Disconnecting a wallet similarly affects only local session state.

## Camera handling

Camera access is requested only after the user chooses to scan a QR. Frames are
processed locally by the QR library and must not be retained, uploaded, or used
for face or location inference. A denial produces a clear permission error and
does not weaken validation.

The scanner needs HTTPS outside localhost for normal browser camera permissions.
Permission handling is controlled by the browser and operating system.

## Signatures and QR payloads

A check-in response contains public identifiers plus a wallet signature. It is
short-lived but should still be treated as sensitive bearer data during its
validity window. The app must not send it to analytics, application servers, or
logs. The issuer scans it locally and verifies it against the configured RPC.

The signature proves wallet control for the defined challenge; it does not
reveal the private key and must not be repurposed for authentication or other
messages.

## Infrastructure disclosures

Although Unisky Pass operates no user database, third-party infrastructure may
process network metadata under its own terms:

- Vercel serves the frontend and may receive normal HTTP metadata such as IP
  address, user agent, path, and timestamp in platform logs.
- The configured Monad RPC receives blockchain requests and may observe IP,
  request timing, queried wallet/pass addresses, and submitted transactions.
- Wallet software and wallet-connect infrastructure process accounts,
  signatures, and transaction requests according to their own policies.
- Monad explorers make public blockchain activity searchable.

Do not add product analytics, advertising pixels, session replay tools, or
tracking cookies without explicit approval and a new privacy review.

## Deployer data

`DEPLOYER_PRIVATE_KEY` is a human-held deployment secret, not member data. It is
used only by Foundry in the human's local process, never exposed to frontend
code, Vercel, browser storage, source control, logs, or documentation. Public
deployment addresses and transaction hashes may be documented.

## Data retention and deletion

| Category | Retention |
| --- | --- |
| Onchain registry data/events | Permanent according to Monad |
| Active challenge and used-nonce ledger | Current browser session |
| Response QR/signature in app state | Only the active check-in flow |
| Optional UI preference/draft | Until user/browser clears it |
| Camera frames | Not retained by the application |
| Application check-in history | Not collected |

There is no application account to delete. A user can disconnect the wallet and
clear site data, but onchain data remains public. This limitation must be
communicated before an issuer writes a display name or holder relationship.

## Product-copy requirements

- Say `wallet` or `membership pass`; do not imply anonymous identity.
- Do not say the product verifies a person's legal identity.
- Do not say a revocation deletes a holder record.
- Do not promise that wallet sharing is prevented.
- State that the app never holds money.
- If privacy behavior changes, update this document before release.
