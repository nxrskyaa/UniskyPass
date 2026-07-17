import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  Fingerprint,
  Code2,
  Globe2,
  HeartHandshake,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { PageIntro } from "@/components/page-intro";
import { Card, CardBody } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why Unisky Pass exists, how it protects membership check-ins, and the honest limits of the MVP.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Unisky Pass",
    description:
      "Why Unisky Pass exists, how it protects membership check-ins, and the honest limits of the MVP.",
    url: "/about",
  },
};

const principles = [
  {
    icon: WalletCards,
    title: "The wallet is the membership",
    description:
      "Passes are non-transferable records issued to a wallet. There is no second account, password, or profile to keep in sync.",
  },
  {
    icon: ScanLine,
    title: "A check-in is a fresh proof",
    description:
      "The member signs a new 60-second challenge. The issuer then checks the signature and current contract state before showing VALID.",
  },
  {
    icon: LockKeyhole,
    title: "Privacy is a product boundary",
    description:
      "The app does not ask for legal names, email, phone, photos, biometrics, or location history. Public wallet data stays on Monad.",
  },
];

const deployments = [
  {
    name: "Monad mainnet",
    label: "LIVE",
    chainId: "143",
    rpc: "https://rpc.monad.xyz",
    address: "0x935D7681Fd0454f38848925fc03d918dA036Ed99",
    explorer:
      "https://monadscan.com/address/0x935D7681Fd0454f38848925fc03d918dA036Ed99",
    note: "Production registry is deployed, live, and source-code verified as an exact match (Solidity 0.8.28, optimizer 200).",
    accent: "bg-lime",
  },
  {
    name: "Monad testnet",
    label: "REHEARSAL",
    chainId: "10143",
    rpc: "https://testnet-rpc.monad.xyz",
    address: "0x7a2fDcaa6eAC3a0c8E0E6E391Ca9c7ef2B737690",
    explorer:
      "https://testnet.monadscan.com/address/0x7a2fDcaa6eAC3a0c8E0E6E391Ca9c7ef2B737690",
    note: "Dry-run registry used for the mandatory testnet release path.",
    accent: "bg-sky",
  },
];

const honestLimits = [
  "A valid proof demonstrates control of the holder wallet, not the physical identity of the person holding the phone.",
  "Replay prevention is scoped to the issuer's current browser session. There is no shared backend or onchain nonce registry.",
  "Deliberate wallet sharing is not prevented. Anyone with signing control of the holder wallet can create a valid response.",
  "Issuer registration is permissionless. A pass in a wallet is not an endorsement, and unsolicited pass records are possible.",
  "Wallet relationships, display names, and pass timing are public and permanent onchain.",
];

export default function AboutPage() {
  return (
    <div className="page-grid px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <PageIntro
          eyebrow="About Unisky Pass"
          title="Membership should be a proof, not another profile."
          description="Unisky Pass gives places a direct way to issue time-based membership and gives members a fast way to prove wallet control at the door. No payment custody, no identity database, and no static pass screenshot presented as security."
          action={
            <Link
              href="/docs"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink bg-ink px-4 text-sm font-bold text-white shadow-[3px_3px_0_var(--violet)] transition hover:-translate-y-0.5"
            >
              Read the guide <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        />

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.08fr_.92fr]">
          <div className="relative overflow-hidden rounded-[1.75rem] border-2 border-ink bg-ink p-7 text-white shadow-[7px_8px_0_var(--violet)] sm:p-10">
            <div className="absolute -top-24 -right-16 size-64 rounded-full border-[30px] border-white/5" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-lime/40 bg-lime/10 px-3 py-1.5 font-mono text-xs font-bold tracking-[0.14em] text-lime uppercase">
                <Fingerprint className="size-4" aria-hidden />
                Why it exists
              </span>
              <h2 className="balance-text mt-7 max-w-2xl text-4xl font-black tracking-[-0.06em] sm:text-5xl">
                A picture can be copied. A wallet response has to be made now.
              </h2>
              <p className="pretty-text mt-5 max-w-2xl text-base leading-7 text-white/62 sm:text-lg sm:leading-8">
                Traditional digital passes often stop at something that looks official. Unisky Pass asks a better question: can the wallet that holds this membership answer the issuer&apos;s fresh challenge while the pass is still active on Monad?
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  ["60 sec", "challenge lifetime"],
                  ["0 tx", "member check-in"],
                  ["Fresh", "onchain read"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-white/12 bg-white/6 p-4">
                    <p className="text-2xl font-black tracking-[-0.04em] text-lime">{value}</p>
                    <p className="mt-1 text-xs font-semibold text-white/48">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {principles.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="transition hover:border-ink hover:shadow-[4px_4px_0_var(--violet)]">
                <CardBody className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-ink bg-lime shadow-[2px_2px_0_var(--ink)]">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h2 className="text-lg font-black tracking-tight">{title}</h2>
                    <p className="mt-2 text-sm leading-6 text-ink-soft">{description}</p>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16 sm:mt-20" aria-labelledby="deployment-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs font-bold tracking-[0.16em] text-violet uppercase">Deployment truth</p>
              <h2 id="deployment-heading" className="balance-text mt-3 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
                The same registry, rehearsed before release.
              </h2>
            </div>
            <a
              href="https://docs.monad.xyz/developer-essentials/network-information"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-violet hover:text-violet-dark"
            >
              Monad network information <ExternalLink className="size-4" aria-hidden />
            </a>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            {deployments.map((deployment) => (
              <Card key={deployment.chainId} className="overflow-hidden border-ink">
                <div className={`${deployment.accent} flex items-center justify-between border-b border-ink px-5 py-3 sm:px-6`}>
                  <span className="font-black">{deployment.name}</span>
                  <span className="rounded-full border border-ink bg-paper px-2.5 py-1 font-mono text-[0.68rem] font-black tracking-[0.12em]">
                    {deployment.label}
                  </span>
                </div>
                <CardBody>
                  <dl className="grid gap-4 text-sm">
                    <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:items-start">
                      <dt className="font-semibold text-ink-soft">Chain ID</dt>
                      <dd className="font-mono font-bold">{deployment.chainId}</dd>
                    </div>
                    <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:items-start">
                      <dt className="font-semibold text-ink-soft">Registry</dt>
                      <dd className="break-all font-mono text-xs font-bold leading-5">{deployment.address}</dd>
                    </div>
                    <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:items-start">
                      <dt className="font-semibold text-ink-soft">Public RPC</dt>
                      <dd className="break-all font-mono text-xs leading-5">{deployment.rpc}</dd>
                    </div>
                  </dl>
                  <p className="mt-5 border-t border-dashed border-line pt-4 text-sm leading-6 text-ink-soft">{deployment.note}</p>
                  <a
                    href={deployment.explorer}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-ink bg-paper px-3.5 text-sm font-bold shadow-[2px_2px_0_var(--ink)] transition hover:-translate-y-0.5 hover:bg-white"
                  >
                    View registry on Monadscan <ExternalLink className="size-4" aria-hidden />
                  </a>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-5 lg:grid-cols-[.82fr_1.18fr] sm:mt-20">
          <Card className="border-ink bg-violet text-white shadow-[6px_6px_0_var(--ink)]">
            <CardBody className="p-7 sm:p-8">
              <HeartHandshake className="size-8 text-lime" aria-hidden />
              <p className="mt-7 font-mono text-xs font-bold tracking-[0.15em] text-lime uppercase">Built in the open</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em]">A solo six-day build by Nxrskyaa.</h2>
              <p className="mt-4 text-sm leading-7 text-white/70">
                Unisky Pass was built as a deliberately focused hackathon MVP: one contract, one core membership loop, and clear limits instead of a fictional enterprise stack.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="https://github.com/nxrskyaa"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3.5 text-sm font-bold transition hover:bg-white/16"
                >
                  <Code2 className="size-4" aria-hidden /> GitHub <ExternalLink className="size-3.5" aria-hidden />
                </a>
                <a
                  href="https://x.com/nxrskyaa"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3.5 text-sm font-bold transition hover:bg-white/16"
                >
                  <Globe2 className="size-4" aria-hidden /> @nxrskyaa <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </div>
            </CardBody>
          </Card>

          <Card className="border-ink">
            <CardBody className="p-7 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl border border-ink bg-coral shadow-[2px_2px_0_var(--ink)]">
                  <ShieldCheck className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-mono text-xs font-bold tracking-[0.14em] text-violet uppercase">Honest by design</p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">What this MVP does not promise</h2>
                </div>
              </div>
              <ul className="mt-6 grid gap-3">
                {honestLimits.map((limit) => (
                  <li key={limit} className="flex gap-3 rounded-xl border border-line bg-paper/70 p-3.5 text-sm leading-6 text-ink-soft">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-coral" aria-hidden />
                    {limit}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </section>

        <section className="mt-16 rounded-[1.75rem] border-2 border-ink bg-lime px-6 py-9 shadow-[7px_7px_0_var(--ink)] sm:mt-20 sm:px-9 sm:py-11">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-mono text-xs font-bold tracking-[0.15em] uppercase">Choose your path</p>
              <h2 className="balance-text mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">Carry a pass, or create one for your community.</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/passes" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink bg-ink px-4 text-sm font-bold text-white">
                Open my passes <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/issuer" className="inline-flex min-h-11 items-center rounded-xl border border-ink bg-paper px-4 text-sm font-bold shadow-[2px_2px_0_var(--ink)]">
                Start as an issuer
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
