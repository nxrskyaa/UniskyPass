import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CircleHelp,
  Clock3,
  ExternalLink,
  FileCheck2,
  KeyRound,
  Network,
  QrCode,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Store,
  WalletCards,
} from "lucide-react";
import { PageIntro } from "@/components/page-intro";
import { Card, CardBody } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "Quick-start guides for Unisky Pass members and issuers, plus check-in, network, security, and troubleshooting references.",
  alternates: { canonical: "/docs" },
  openGraph: {
    title: "Unisky Pass Documentation",
    description:
      "Quick-start guides for Unisky Pass members and issuers, plus check-in, network, security, and troubleshooting references.",
    url: "/docs",
  },
};

const memberSteps = [
  {
    title: "Open the holder wallet",
    description:
      "Connect the external wallet used for issuance, or log in with Email (and SMS where available) to restore your Privy embedded wallet. Confirm the active address and selected network.",
  },
  {
    title: "Review the live pass state",
    description:
      "Check the issuer, program, start, expiry, and status. Active means the pass has started, has not expired, and has not been revoked.",
  },
  {
    title: "Scan the issuer challenge",
    description:
      "At the door, open Check-in and scan the QR shown by the issuer. The challenge is tied to their wallet, program, chain, and registry for 60 seconds.",
  },
  {
    title: "Sign, then show your response",
    description:
      "Choose the matching pass and sign the CheckInProof message. This is not a transaction and costs no member gas. Show the resulting QR to the issuer.",
  },
];

const issuerSteps = [
  {
    title: "Register the issuer wallet",
    description:
      "Open the Issuer Dashboard, connect an external wallet or use a Privy embedded wallet, confirm the active address, and register a short, non-sensitive display name.",
  },
  {
    title: "Create a time-based program",
    description:
      "Give the program a concise name and duration. Programs begin active; pausing one blocks new issuance without invalidating existing passes.",
  },
  {
    title: "Issue to the correct wallet",
    description:
      "Paste and verify the member's wallet address, add an optional public member label and issuer note, then issue immediately or schedule a future start. Onchain issuance is permanent and public.",
  },
  {
    title: "Run Scanner Mode",
    description:
      "Select the program, create a challenge, let the member scan and sign, then scan their response. Only a fresh signature plus fresh contract state can return VALID.",
  },
];

const checkInSteps = [
  ["01", "Challenge", "Issuer creates a cryptographically random QR that expires in 60 seconds."],
  ["02", "Signature", "Member signs EIP-712 CheckInProof with the pass-holder wallet."],
  ["03", "Response", "Member displays a QR bound to the challenge, holder, pass, chain, and registry."],
  ["04", "Fresh read", "Issuer verifies the signer and re-reads pass state from Monad before VALID."],
];

const troubleshooting = [
  ["Login did not finish", "Wait for Privy to initialize, then retry Email or Wallet. Request a new OTP if the prior code expired."],
  ["SMS is unavailable", "Phone login depends on the enabled Privy plan, provider, and country. Use Email or Wallet when SMS is not offered."],
  ["Wrong active wallet", "Open the wallet menu and select the exact address used for the issuer or pass. Account changes reset temporary scanner state."],
  ["No passes appear", "Confirm the connected wallet, expected network, and registry. An RPC failure must not be mistaken for an empty wallet."],
  ["Wrong network", "Use Monad mainnet for the live deployment or Monad testnet for rehearsal. Do not mix a chain, RPC, registry, and explorer from different environments."],
  ["Pass not active yet", "The pass has a future validFrom time. Contract time, not the phone clock, decides when it becomes active."],
  ["Pass expired", "The issuer may extend a non-revoked pass. An expired extension renews from current chain time."],
  ["Pass revoked", "Revocation is permanent. The issuer must create a new pass."],
  ["Challenge expired", "Ask the issuer for a new challenge. Every challenge lasts exactly 60 seconds."],
  ["Challenge already used", "That response succeeded earlier in this scanner session. Create and sign a fresh challenge."],
  ["Camera permission denied", "Allow camera access for the site and retry. Camera scanning normally requires HTTPS outside localhost."],
  ["Contract read failed", "The scanner cannot safely decide. Retry when the configured Monad RPC is available; it must never fall back to cached VALID state."],
];

const deployments = [
  {
    network: "Monad mainnet",
    use: "Live product",
    chainId: "143",
    rpc: "https://rpc.monad.xyz",
    address: "0x634659d15A5a98D59ff06e9Eb7deC08bD5894fF5",
    explorer:
      "https://monadscan.com/address/0x634659d15A5a98D59ff06e9Eb7deC08bD5894fF5",
    status: "Deployed, live, and source-code verified as an exact match (Solidity 0.8.28, optimizer 200).",
  },
  {
    network: "Monad testnet",
    use: "Release rehearsal",
    chainId: "10143",
    rpc: "https://testnet-rpc.monad.xyz",
    address: "0x56e47d0233b9eAa2f6701Bb90DFD6352000D5e26",
    explorer:
      "https://testnet.monadscan.com/address/0x56e47d0233b9eAa2f6701Bb90DFD6352000D5e26",
    status: "Testnet registry for the dry-run release path.",
  },
];

function QuickStartCard({
  eyebrow,
  title,
  icon: Icon,
  steps,
  href,
  action,
}: {
  eyebrow: string;
  title: string;
  icon: typeof WalletCards;
  steps: typeof memberSteps;
  href: string;
  action: string;
}) {
  return (
    <Card className="border-ink">
      <CardBody className="p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl border border-ink bg-lime shadow-[2px_2px_0_var(--ink)]">
            <Icon className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-mono text-xs font-bold tracking-[0.14em] text-violet uppercase">{eyebrow}</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">{title}</h2>
          </div>
        </div>
        <ol className="mt-7 grid gap-5">
          {steps.map((step, index) => (
            <li key={step.title} className="grid grid-cols-[2rem_1fr] gap-3">
              <span className="grid size-8 place-items-center rounded-lg border border-ink bg-paper font-mono text-xs font-black shadow-[1px_1px_0_var(--ink)]">
                {index + 1}
              </span>
              <div>
                <h3 className="font-black">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-ink-soft">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link href={href} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink bg-ink px-4 text-sm font-bold text-white shadow-[3px_3px_0_var(--violet)] transition hover:-translate-y-0.5">
          {action} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </CardBody>
    </Card>
  );
}

export default function DocsPage() {
  return (
    <div className="page-grid px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <PageIntro
          eyebrow="Product guide"
          title="From issued pass to a verified door."
          description="Start with the path that matches what you are doing. Members sign a fresh proof; issuers create and verify it. Permanent membership state lives on Monad, while the check-in itself costs the member no gas."
          action={
            <Link href="/changelog" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink bg-paper px-4 text-sm font-bold shadow-[2px_2px_0_var(--ink)] transition hover:-translate-y-0.5 hover:bg-white">
              See what shipped <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        />

        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Documentation sections">
          {[
            ["#members", "Members"],
            ["#issuers", "Issuers"],
            ["#check-in", "Check-in"],
            ["#networks", "Networks"],
            ["#troubleshooting", "Troubleshooting"],
            ["#security", "Security & privacy"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="rounded-full border border-line bg-white/70 px-3 py-1.5 text-xs font-bold text-ink-soft transition hover:border-ink hover:text-ink">
              {label}
            </a>
          ))}
        </nav>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <div id="members" className="scroll-mt-28">
            <QuickStartCard
              eyebrow="Member quick start"
              title="Use a pass"
              icon={WalletCards}
              steps={memberSteps}
              href="/passes"
              action="Open My Passes"
            />
          </div>
          <div id="issuers" className="scroll-mt-28">
            <QuickStartCard
              eyebrow="Issuer quick start"
              title="Create and verify passes"
              icon={Store}
              steps={issuerSteps}
              href="/issuer"
              action="Open Issuer Dashboard"
            />
          </div>
        </section>

        <section id="check-in" className="mt-16 scroll-mt-28 sm:mt-20" aria-labelledby="check-in-heading">
          <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
            <div>
              <p className="font-mono text-xs font-bold tracking-[0.16em] text-violet uppercase">Check-in protocol</p>
              <h2 id="check-in-heading" className="balance-text mt-3 text-3xl font-black tracking-[-0.05em] sm:text-4xl">Four steps. Zero member transactions.</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-ink-soft lg:justify-self-end">
              A response only works for its exact issuer challenge. The EIP-712 domain binds it to the selected Monad chain and registry, while the scanner&apos;s final decision comes from a new contract read.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {checkInSteps.map(([number, title, description]) => (
              <article key={number} className="rounded-[1.4rem] border border-ink bg-white/82 p-5 shadow-[3px_3px_0_var(--paper-deep)]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-violet">{number}</span>
                  {number === "01" ? <QrCode className="size-5" aria-hidden /> : null}
                  {number === "02" ? <KeyRound className="size-5" aria-hidden /> : null}
                  {number === "03" ? <ScanLine className="size-5" aria-hidden /> : null}
                  {number === "04" ? <FileCheck2 className="size-5" aria-hidden /> : null}
                </div>
                <h3 className="mt-7 text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{description}</p>
              </article>
            ))}
          </div>

          <div className="mt-5 flex gap-3 rounded-2xl border border-ink bg-ink p-5 text-white">
            <Clock3 className="mt-0.5 size-5 shrink-0 text-lime" aria-hidden />
            <p className="text-sm leading-6 text-white/65">
              The member&apos;s signature is not an onchain check-in record. Unisky Pass intentionally stores no visit history. A successfully scanned nonce is remembered only in that scanner&apos;s browser session.
            </p>
          </div>
        </section>

        <section id="networks" className="mt-16 scroll-mt-28 sm:mt-20" aria-labelledby="networks-heading">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="font-mono text-xs font-bold tracking-[0.16em] text-violet uppercase">Network reference</p>
              <h2 id="networks-heading" className="balance-text mt-3 text-3xl font-black tracking-[-0.05em] sm:text-4xl">Use the address for the network you are on.</h2>
            </div>
            <Network className="hidden size-10 text-violet sm:block" aria-hidden />
          </div>

          <div className="mt-7 overflow-hidden rounded-[1.4rem] border border-ink bg-white/82 shadow-[4px_4px_0_var(--ink)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-ink text-white">
                  <tr>
                    <th className="px-5 py-4 font-bold">Network</th>
                    <th className="px-5 py-4 font-bold">Chain ID</th>
                    <th className="px-5 py-4 font-bold">Registry</th>
                    <th className="px-5 py-4 font-bold">Public RPC</th>
                    <th className="px-5 py-4 font-bold">Explorer</th>
                  </tr>
                </thead>
                <tbody>
                  {deployments.map((deployment) => (
                    <tr key={deployment.chainId} className="border-t border-line align-top first:border-t-0">
                      <td className="px-5 py-5">
                        <p className="font-black">{deployment.network}</p>
                        <p className="mt-1 text-xs text-ink-soft">{deployment.use}</p>
                      </td>
                      <td className="px-5 py-5 font-mono font-bold">{deployment.chainId}</td>
                      <td className="max-w-xs px-5 py-5">
                        <code className="break-all font-mono text-xs leading-5">{deployment.address}</code>
                        <p className="mt-2 text-xs leading-5 text-ink-soft">{deployment.status}</p>
                      </td>
                      <td className="px-5 py-5"><code className="font-mono text-xs">{deployment.rpc}</code></td>
                      <td className="px-5 py-5">
                        <a href={deployment.explorer} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-bold text-violet hover:text-violet-dark">
                          Monadscan <ExternalLink className="size-3.5" aria-hidden />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="troubleshooting" className="mt-16 scroll-mt-28 sm:mt-20" aria-labelledby="troubleshooting-heading">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl border border-ink bg-sky shadow-[2px_2px_0_var(--ink)]">
              <CircleHelp className="size-5" aria-hidden />
            </span>
            <div>
              <p className="font-mono text-xs font-bold tracking-[0.14em] text-violet uppercase">Troubleshooting</p>
              <h2 id="troubleshooting-heading" className="mt-1 text-3xl font-black tracking-[-0.05em]">Failures should tell you what to do next.</h2>
            </div>
          </div>
          <div className="mt-7 grid gap-3 lg:grid-cols-2">
            {troubleshooting.map(([problem, response]) => (
              <div key={problem} className="rounded-2xl border border-line bg-white/72 p-5">
                <h3 className="font-black">{problem}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{response}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="security" className="mt-16 grid scroll-mt-28 gap-5 lg:grid-cols-2 sm:mt-20">
          <Card className="border-ink bg-lime">
            <CardBody className="p-7 sm:p-8">
              <ShieldCheck className="size-8" aria-hidden />
              <p className="mt-6 font-mono text-xs font-bold tracking-[0.14em] uppercase">What is protected</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">A copied static pass is not enough.</h2>
              <p className="mt-4 text-sm leading-7 text-ink-soft">
                The proof is bound to a random nonce, issuer, program, holder, expiry, chain, and registry. The scanner recovers the signer and checks fresh onchain state before VALID.
              </p>
            </CardBody>
          </Card>
          <Card className="border-ink bg-coral/20">
            <CardBody className="p-7 sm:p-8">
              <ShieldAlert className="size-8 text-danger" aria-hidden />
              <p className="mt-6 font-mono text-xs font-bold tracking-[0.14em] text-danger uppercase">What is not protected</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">Wallet control is not human identity.</h2>
              <p className="mt-4 text-sm leading-7 text-ink-soft">
                Wallet sharing is not prevented, replay memory is session-only, and issuer registration is permissionless. Privy login proves access to a login channel and wallet, not legal identity. The MVP is not a formal security audit or a cross-device access-control backend.
              </p>
            </CardBody>
          </Card>
        </section>

        <section className="mt-5 rounded-[1.5rem] border border-ink bg-ink p-6 text-white sm:p-8">
          <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="font-mono text-xs font-bold tracking-[0.14em] text-lime uppercase">Privacy in one paragraph</p>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-white/65">
                Unisky Pass has no first-party account database. Privy processes optional Email or available SMS login and embedded-wallet sessions, but Unisky Pass does not persist those identifiers or write them onchain. Wallet relationships, issuer/program names, pass timing, and revocation are public on Monad and cannot be deleted. Camera frames stay local; Privy, Vercel, wallet software, and the configured RPC remain independent infrastructure providers.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/about" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/8 px-4 text-sm font-bold transition hover:bg-white/14">
                About the project <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a href="https://github.com/nxrskyaa/UniskyPass" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-lime/50 bg-lime px-4 text-sm font-bold text-ink">
                Source on GitHub <ExternalLink className="size-4" aria-hidden />
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
