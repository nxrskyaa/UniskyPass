import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ExternalLink,
  Code2,
  KeyRound,
  Rocket,
  ShieldAlert,
  ShieldCheck,
  TestTube2,
} from "lucide-react";
import { PageIntro } from "@/components/page-intro";
import { Card, CardBody } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "Unisky Pass release history, including the Monad testnet rehearsal and mainnet launch.",
  alternates: { canonical: "/changelog" },
  openGraph: {
    title: "Unisky Pass Changelog",
    description:
      "Unisky Pass release history, including the Monad testnet rehearsal and mainnet launch.",
    url: "/changelog",
  },
};

const releases = [
  {
    date: "2026-07-17",
    eyebrow: "Onboarding update",
    title: "Privy wallet onboarding",
    status: "AUTH",
    icon: KeyRound,
    accent: "bg-coral",
    address: "0x935D7681Fd0454f38848925fc03d918dA036Ed99",
    explorer:
      "https://monadscan.com/address/0x935D7681Fd0454f38848925fc03d918dA036Ed99",
    summary:
      "Unisky Pass adds passwordless onboarding without changing the membership model: every issuer action, pass, and check-in proof still resolves to one active wallet address on Monad.",
    highlights: [
      "Privy offers Email and external-wallet login, with SMS shown only where it is enabled and available for the configured plan and country.",
      "Users without an external wallet receive or restore an embedded EVM wallet; returning login must recover the same active address.",
      "The active wallet can use Monad mainnet and testnet, while issuer, program, pass, query, and EIP-712 state remain isolated by chain and registry.",
      "The Privy App ID and optional Client ID are public browser identifiers protected by exact allowed origins; no Privy secret is required by the client-only app.",
      "Privy processes optional login identifiers, but Unisky Pass does not persist email/phone data or write it onchain.",
    ],
  },
  {
    date: "2026-07-17",
    eyebrow: "Production release",
    title: "Monad mainnet launch",
    status: "LIVE",
    icon: Rocket,
    accent: "bg-lime",
    address: "0x935D7681Fd0454f38848925fc03d918dA036Ed99",
    explorer:
      "https://monadscan.com/address/0x935D7681Fd0454f38848925fc03d918dA036Ed99",
    summary:
      "The complete Unisky Pass MVP moved to Monad mainnet: issuer operations, member passes, and the challenge-sign-scan verification loop in one focused release.",
    highlights: [
      "UniskyPassRegistry deployed on Monad mainnet chain ID 143 with no owner, admin, proxy, payment, or transfer surface.",
      "Issuer registration, program creation, issuance, extension, permanent revocation, and live pass status are available through the production flow.",
      "Members sign a 60-second EIP-712 CheckInProof without sending a transaction; scanners recover the signer and read fresh contract state before VALID.",
      "The mobile-first frontend ships explicit wallet, network, transaction, RPC, camera, QR, and membership failure states.",
      "Monadscan reports Source Code Verified — Exact Match with Solidity 0.8.28, optimizer 200; executable bytecode matches the repository artifact.",
    ],
  },
  {
    date: "2026-07-17",
    eyebrow: "Release rehearsal",
    title: "Monad testnet rehearsal",
    status: "TESTNET",
    icon: TestTube2,
    accent: "bg-sky",
    address: "0x7a2fDcaa6eAC3a0c8E0E6E391Ca9c7ef2B737690",
    explorer:
      "https://testnet.monadscan.com/address/0x7a2fDcaa6eAC3a0c8E0E6E391Ca9c7ef2B737690",
    summary:
      "The final registry and frontend release path were staged on Monad testnet before production, keeping chain configuration and contract identity explicit throughout the flow.",
    highlights: [
      "A dedicated UniskyPassRegistry deployment established the non-production rehearsal environment on chain ID 10143.",
      "The release path covers two-wallet issuance, My Passes discovery, real QR challenge/response, same-session replay rejection, and post-sign revocation checks.",
      "Challenge signatures use the testnet chain ID and testnet registry in the EIP-712 domain, so they cannot be replayed against the mainnet deployment.",
      "Testnet explorer links remain separate from production links to make dry-run evidence and network mistakes easy to spot.",
      "Testnet data has no mainnet effect and may be treated as rehearsal state only.",
    ],
  },
];

const launchLimits = [
  "Replay memory is browser-session only; there is no shared cross-device nonce service.",
  "The proof confirms control of the holder wallet, not a person's physical or legal identity.",
  "Deliberate wallet sharing is not prevented.",
  "Issuer registration is permissionless, and wallets can receive unsolicited pass records.",
  "Wallet relationships and pass timing are public and permanent onchain.",
  "The MVP has no first-party backend or account database, payments, analytics, or onchain check-in history; Privy independently handles optional authentication and embedded wallets.",
];

export default function ChangelogPage() {
  return (
    <div className="page-grid px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <PageIntro
          eyebrow="Release log"
          title="Six days from contract spec to the front door."
          description="A concise record of what shipped, where it lives, and which boundaries remain deliberate. Deployment and source-verification status are stated plainly alongside each release."
          action={
            <Link href="/docs" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink bg-ink px-4 text-sm font-bold text-white shadow-[3px_3px_0_var(--violet)] transition hover:-translate-y-0.5">
              Read the product guide <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        />

        <div className="mt-9 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section aria-label="Release entries" className="relative grid gap-7">
            <div className="absolute top-10 bottom-10 left-[1.4rem] hidden w-px bg-ink/20 sm:block" aria-hidden />
            {releases.map((release) => {
              const Icon = release.icon;
              return (
                <article key={release.title} className="relative sm:pl-16">
                  <span className={`absolute top-7 left-0 z-10 hidden size-11 place-items-center rounded-xl border border-ink ${release.accent} shadow-[2px_2px_0_var(--ink)] sm:grid`}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <Card className="overflow-hidden border-ink">
                    <div className={`${release.accent} flex flex-col gap-3 border-b border-ink px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7`}>
                      <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-[0.12em] uppercase">
                        <CalendarDays className="size-4" aria-hidden />
                        <time dateTime={release.date}>{release.date}</time>
                        <span aria-hidden>•</span>
                        <span>{release.eyebrow}</span>
                      </div>
                      <span className="w-fit rounded-full border border-ink bg-paper px-2.5 py-1 font-mono text-[0.68rem] font-black tracking-[0.12em]">
                        {release.status}
                      </span>
                    </div>
                    <CardBody className="p-6 sm:p-8">
                      <div className="flex items-start gap-4">
                        <span className={`grid size-11 shrink-0 place-items-center rounded-xl border border-ink ${release.accent} shadow-[2px_2px_0_var(--ink)] sm:hidden`}>
                          <Icon className="size-5" aria-hidden />
                        </span>
                        <div>
                          <h2 className="balance-text text-3xl font-black tracking-[-0.055em] sm:text-4xl">{release.title}</h2>
                          <p className="pretty-text mt-3 max-w-3xl text-base leading-7 text-ink-soft">{release.summary}</p>
                        </div>
                      </div>

                      <div className="mt-6 rounded-2xl border border-line bg-paper/70 p-4">
                        <p className="font-mono text-[0.68rem] font-bold tracking-[0.12em] text-ink-soft uppercase">Registry address</p>
                        <code className="mt-2 block break-all font-mono text-xs font-bold leading-5 sm:text-sm">{release.address}</code>
                        <a href={release.explorer} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-violet hover:text-violet-dark">
                          Open on Monadscan <ExternalLink className="size-3.5" aria-hidden />
                        </a>
                      </div>

                      <h3 className="mt-7 font-mono text-xs font-bold tracking-[0.14em] text-violet uppercase">What changed</h3>
                      <ul className="mt-4 grid gap-3">
                        {release.highlights.map((highlight) => (
                          <li key={highlight} className="flex gap-3 text-sm leading-6 text-ink-soft">
                            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-ink bg-lime">
                              <Check className="size-3" strokeWidth={3} aria-hidden />
                            </span>
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </CardBody>
                  </Card>
                </article>
              );
            })}
          </section>

          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start" aria-label="Release summary">
            <Card className="border-ink bg-ink text-white">
              <CardBody>
                <ShieldCheck className="size-6 text-lime" aria-hidden />
                <p className="mt-5 font-mono text-xs font-bold tracking-[0.14em] text-lime uppercase">MVP scope</p>
                <p className="mt-2 text-2xl font-black tracking-[-0.04em]">One contract. Two modes. One proof loop.</p>
                <p className="mt-3 text-sm leading-6 text-white/58">
                  Members and issuers share the same wallet-first app. The check-in response is a signature; permanent membership state stays on Monad.
                </p>
              </CardBody>
            </Card>
            <Card className="border-ink bg-violet text-white">
              <CardBody>
                <p className="font-mono text-xs font-bold tracking-[0.14em] text-lime uppercase">Builder</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Nxrskyaa</h2>
                <p className="mt-3 text-sm leading-6 text-white/65">Solo builder of the Unisky Pass six-day hackathon MVP.</p>
                <div className="mt-5 grid gap-2">
                  <a href="https://github.com/nxrskyaa" target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/25 bg-white/8 px-3 text-sm font-bold transition hover:bg-white/14">
                    <Code2 className="size-4" aria-hidden /> GitHub <ExternalLink className="ml-auto size-3.5" aria-hidden />
                  </a>
                  <a href="https://x.com/nxrskyaa" target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/25 bg-white/8 px-3 text-sm font-bold transition hover:bg-white/14">
                    <span className="font-mono font-black" aria-hidden>𝕏</span> @nxrskyaa <ExternalLink className="ml-auto size-3.5" aria-hidden />
                  </a>
                </div>
              </CardBody>
            </Card>
          </aside>
        </div>

        <section className="mt-16 rounded-[1.75rem] border-2 border-ink bg-coral/18 p-6 shadow-[6px_6px_0_var(--ink)] sm:mt-20 sm:p-9" aria-labelledby="limits-heading">
          <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr]">
            <div>
              <ShieldAlert className="size-8 text-danger" aria-hidden />
              <p className="mt-6 font-mono text-xs font-bold tracking-[0.15em] text-danger uppercase">Known at launch</p>
              <h2 id="limits-heading" className="balance-text mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">The boundaries are part of the release note.</h2>
              <p className="mt-4 text-sm leading-7 text-ink-soft">
                Unisky Pass is a focused MVP, not a formally audited identity or enterprise access-control system. These limits are kept visible instead of being hidden behind broad security language.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {launchLimits.map((limit) => (
                <li key={limit} className="rounded-2xl border border-ink/18 bg-white/72 p-4 text-sm leading-6 text-ink-soft">
                  {limit}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-8 flex flex-col gap-5 rounded-[1.5rem] border border-ink bg-lime px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="font-mono text-xs font-bold tracking-[0.14em] uppercase">Follow the build</p>
            <p className="mt-1 text-xl font-black tracking-[-0.03em]">Source, protocol notes, and product decisions are public.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="https://github.com/nxrskyaa/UniskyPass" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink bg-ink px-4 text-sm font-bold text-white">
              View repository <ExternalLink className="size-4" aria-hidden />
            </a>
            <Link href="/about" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink bg-paper px-4 text-sm font-bold shadow-[2px_2px_0_var(--ink)]">
              About Unisky Pass <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
