# Privacy notes

## Privacy model

Unisky Pass uses wallet addresses as the only onchain membership identity and
intentionally avoids first-party personal profiles. It has no application
backend, first-party account database, analytics pipeline, upload service, or
onchain check-in history. Privy provides optional passwordless authentication
and embedded-wallet recovery as an independent service.

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

## Optional Privy login data

A user may connect an external wallet without supplying a contact identifier, or
choose Privy Email OTP and, where enabled and available, SMS OTP. In the latter
flows, Privy processes the email address or phone number, one-time code,
authentication session, and linked embedded-wallet record under its own terms.
SMS availability depends on the configured Privy plan, provider, and country;
the interface must not promise that every phone number is supported.

Unisky Pass must not copy an email address or phone number from Privy's user
object into application state beyond what the SDK needs for the live flow. It
must never write the identifier to Monad, browser storage, analytics, logs, QR
payloads, issuer/program names, or a first-party database. Email or phone control
does not establish membership or legal identity; the active wallet address is
the registry and check-in identity.

## Data the product must not collect or persist

The MVP must not request or store:

- member legal names;
- email addresses or phone numbers outside the optional Privy-hosted login flow;
- home/work postal addresses;
- government or organization identity documents;
- profile photos, face templates, or other biometrics;
- GPS coordinates or location history;
- payment or bank information;
- social-login identities from methods not explicitly enabled in Privy;
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

Email addresses, phone numbers, OTPs, Privy access tokens, and embedded-wallet
key material are not permitted in application-managed browser storage.

Browser storage is client-controlled and untrusted. It must not be treated as
proof of membership, authority, or global nonce use. Session data should expire
with the browser session, and product code should not prolong signature/response
retention beyond the live flow.

Clearing browser data removes local temporary state but cannot delete onchain
records or guarantee deletion of a Privy user record. Logging out ends the local
Privy session; disconnecting or switching an external wallet affects wallet
connection state. Neither operation deletes Monad state.

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

Although Unisky Pass operates no first-party user database, third-party
infrastructure may process authentication, wallet, or network metadata under its
own terms:

- Vercel serves the frontend and may receive normal HTTP metadata such as IP
  address, user agent, path, and timestamp in platform logs.
- Privy processes enabled authentication identifiers, OTP delivery, session and
  linked-account metadata, and embedded-wallet operations. Its App ID and
  optional Client ID are public; exact allowed origins restrict browser use.
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
| Privy authentication and linked-wallet records | Managed by Privy under its configured retention and provider terms; not copied into an Unisky database |

There is no first-party Unisky account database to delete. A user can log out,
disconnect a wallet, and clear site data, but those actions do not themselves
delete the Privy user record and cannot delete onchain data. Privy account-data
requests follow the provider's configured dashboard/support process. The
permanence of Monad data must be communicated before an issuer writes a display
name or holder relationship.

## Product-copy requirements

- Say `wallet` or `membership pass`; do not imply anonymous identity.
- Say that Email and Wallet are login options and that SMS is offered only where
  it is enabled and available.
- Say Privy processes optional login identifiers; do not claim the app never
  asks for or processes email/phone at all.
- Do not say the product verifies a person's legal identity.
- Do not say a revocation deletes a holder record.
- Do not promise that wallet sharing is prevented.
- State that the app never holds money.
- If privacy behavior changes, update this document before release.
