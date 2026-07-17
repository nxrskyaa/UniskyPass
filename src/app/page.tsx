import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
  Clock3,
  ExternalLink,
  Fingerprint,
  History,
  RadioTower,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
  WalletCards,
  Zap,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const steps = [
  {
    number: "01",
    title: "Issue from one wallet",
    description:
      "A gym, studio, club, or community creates a program and sends a time-based pass directly to a member wallet.",
    icon: Store,
  },
  {
    number: "02",
    title: "Carry every membership",
    description:
      "Members see active, upcoming, expired, and revoked passes without maintaining another profile or password.",
    icon: WalletCards,
  },
  {
    number: "03",
    title: "Prove it live",
    description:
      "At the door, a fresh one-minute challenge binds the wallet, issuer, program, contract, and network together.",
    icon: ScanLine,
  },
];

const proofPoints = [
  {
    title: "Fresh challenge",
    text: "Every scan begins with a random, short-lived challenge created by the issuer device.",
  },
  {
    title: "Wallet signature",
    text: "Only the wallet controlling the holder address can produce the matching EIP-712 response.",
  },
  {
    title: "Live contract state",
    text: "The scanner reads the selected Monad deployment before it returns a VALID result.",
  },
  {
    title: "Chain-bound proof",
    text: "Mainnet and testnet use different contracts, and every QR is bound to exactly one of them.",
  },
];

const networkRail = [
  "MONAD MAINNET · 143",
  "MONAD TESTNET · 10143",
  "FRESH EIP-712 PROOFS",
  "NO APP-HELD FUNDS",
  "NON-TRANSFERABLE RECORDS",
];

export default function Home() {
  return (
    <>
      <section className="hero-stage relative isolate overflow-hidden border-b border-white/10 bg-ink px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <div className="hero-grid absolute inset-0 -z-20" aria-hidden />
        <div className="hero-glow hero-glow-one" aria-hidden />
        <div className="hero-glow hero-glow-two" aria-hidden />
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.03fr_.97fr]">
          <div className="relative z-10">
            <div className="hero-enter inline-flex items-center gap-2 rounded-full border border-lime/35 bg-lime/10 px-3 py-1.5 text-xs font-bold text-lime backdrop-blur">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-lime" />
              </span>
              Live on Monad mainnet + testnet
            </div>
            <h1 className="hero-enter hero-delay-1 balance-text mt-7 max-w-3xl text-[clamp(3.55rem,9vw,7rem)] leading-[0.84] font-black tracking-[-0.082em]">
              Membership that moves at <span className="text-lime">your speed.</span>
            </h1>
            <p className="hero-enter hero-delay-2 pretty-text mt-7 max-w-xl text-lg leading-8 text-white/62 sm:text-xl">
              One wallet for every place you belong. Issue time-based passes, prove ownership in seconds, and verify the live membership—not a screenshot.
            </p>
            <div className="hero-enter hero-delay-3 mt-9 flex flex-wrap gap-3">
              <Link
                href="/passes"
                className="group inline-flex min-h-12 items-center gap-2 rounded-xl border border-lime bg-lime px-5 font-bold text-ink shadow-[4px_4px_0_rgb(255_255_255/18%)] transition duration-300 hover:-translate-y-1 hover:shadow-[6px_7px_0_rgb(255_255_255/18%)]"
              >
                Open my passes
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
              <Link
                href="/issuer"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/24 bg-white/8 px-5 font-bold text-white backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-white/45 hover:bg-white/13"
              >
                Launch a program
              </Link>
            </div>
            <div className="hero-enter hero-delay-4 mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-white/52">
              <span className="flex items-center gap-1.5"><Check className="size-4 text-lime" /> No app-held funds</span>
              <span className="flex items-center gap-1.5"><Check className="size-4 text-lime" /> No transferable pass</span>
              <span className="flex items-center gap-1.5"><Check className="size-4 text-lime" /> Open contract state</span>
            </div>
          </div>

          <div
            className="hero-enter hero-delay-2 relative mx-auto min-h-[31rem] w-full max-w-xl lg:max-w-none"
            aria-hidden="true"
          >
            <div className="orbit-ring orbit-ring-one" aria-hidden />
            <div className="orbit-ring orbit-ring-two" aria-hidden />
            <div className="orbit-dot orbit-dot-one" aria-hidden />
            <div className="orbit-dot orbit-dot-two" aria-hidden />

            <div className="floating-chip floating-chip-one">
              <RadioTower className="size-4 text-lime" />
              MAINNET · LIVE
            </div>
            <div className="floating-chip floating-chip-two">
              <Zap className="size-4 text-sky" />
              60 SEC PROOF
            </div>

            <div className="hero-pass-shell absolute top-1/2 left-1/2 w-[min(92%,31rem)] rounded-[2rem] border border-white/20 bg-violet p-3 shadow-[0_35px_100px_rgb(0_0_0/55%),8px_10px_0_rgb(200_255_77/85%)]">
              <div className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#15151d] p-6 sm:p-8">
                <div className="pass-aurora" aria-hidden />
                <div className="scanner-beam" aria-hidden />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <BrandMark className="border-white/20 shadow-none" />
                    <div>
                      <p className="text-[0.65rem] font-bold tracking-[0.18em] text-white/45 uppercase">Unisky Pass</p>
                      <p className="font-bold">Optimum Gym</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-lime/40 bg-lime/12 px-2.5 py-1 text-xs font-bold text-lime">ACTIVE</span>
                </div>
                <div className="relative mt-20">
                  <p className="text-sm text-white/42">Membership</p>
                  <h2 className="mt-1 text-3xl font-black tracking-[-0.055em] sm:text-4xl">Monthly Access</h2>
                </div>
                <div className="relative mt-9 grid grid-cols-2 gap-3 border-t border-dashed border-white/18 pt-5 text-sm">
                  <div>
                    <p className="text-white/38">Member wallet</p>
                    <p className="mt-1 font-mono font-semibold">0x8A1F…7C20</p>
                  </div>
                  <div>
                    <p className="text-white/38">Valid until</p>
                    <p className="mt-1 font-semibold">Aug 16, 2026</p>
                  </div>
                </div>
                <div className="relative mt-6 flex items-center justify-between rounded-xl border border-white/8 bg-white/7 px-3.5 py-3">
                  <span className="flex items-center gap-2 text-sm font-semibold"><Fingerprint className="size-4 text-lime" /> Holder verified</span>
                  <ShieldCheck className="size-5 text-lime" />
                </div>
              </div>
            </div>

            <div className="verification-toast absolute right-0 bottom-3 flex items-center gap-3 rounded-2xl border border-white/18 bg-white p-3 text-ink shadow-[0_20px_60px_rgb(0_0_0/35%)] sm:right-4">
              <span className="grid size-10 place-items-center rounded-xl bg-lime"><BadgeCheck className="size-5" /></span>
              <div>
                <p className="text-[0.65rem] font-bold tracking-[0.12em] text-ink-soft uppercase">Scanner result</p>
                <p className="font-black">VALID · JUST NOW</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="network-rail overflow-hidden border-b border-ink bg-lime py-3">
        <p className="sr-only">Mainnet live. Testnet ready. Fresh wallet proof. Sixty-second challenges. Non-transferable membership. Open contract state.</p>
        <div className="network-rail-track flex w-max items-center" aria-hidden="true">
          {[...networkRail, ...networkRail].map((item, index) => (
            <span key={`${item}-${index}`} className="flex items-center gap-4 px-5 font-mono text-xs font-black tracking-[0.12em] whitespace-nowrap">
              {item}
              <Sparkles className="size-3.5" aria-hidden />
            </span>
          ))}
        </div>
      </div>

      <section className="page-grid px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="reveal-up grid gap-10 lg:grid-cols-[.78fr_1.22fr] lg:items-end">
            <div>
              <p className="font-mono text-xs font-bold tracking-[0.16em] text-violet uppercase">The core loop</p>
              <h2 className="balance-text mt-3 text-4xl font-black tracking-[-0.06em] sm:text-6xl">From issued to verified—without the admin maze.</h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-ink-soft lg:justify-self-end">
              Unisky Pass turns membership into a chain-readable record and turns check-in into a fresh proof. Every step stays understandable for the person at the door.
            </p>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {steps.map(({ number, title, description, icon: Icon }) => (
              <article key={number} className="reveal-up kinetic-card group relative overflow-hidden rounded-[1.65rem] border border-line bg-white/82 p-6 backdrop-blur">
                <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-violet transition-transform duration-500 group-hover:scale-x-100" />
                <div className="flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-xl border border-ink bg-paper shadow-[2px_2px_0_var(--ink)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"><Icon className="size-5" /></span>
                  <span className="font-mono text-sm font-black text-violet">{number}</span>
                </div>
                <h3 className="mt-10 text-2xl font-black tracking-[-0.035em]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-soft">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-white/10 bg-ink px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
        <div className="proof-noise absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.82fr_1.18fr] lg:items-center">
          <div className="reveal-up">
            <div className="inline-flex items-center gap-2 font-mono text-xs font-bold tracking-[0.16em] text-lime uppercase">
              <Activity className="size-4" /> Proof, not decoration
            </div>
            <h2 className="balance-text mt-4 text-4xl font-black tracking-[-0.06em] sm:text-6xl">A screenshot can look right. A live proof has to be right.</h2>
            <p className="pretty-text mt-6 max-w-xl text-lg leading-8 text-white/58">
              The scanner verifies who signed, what pass they control, which issuer challenged them, and which Monad deployment owns the record.
            </p>
            <Link href="/docs" className="group mt-8 inline-flex items-center gap-2 font-bold text-lime">
              Read the verification protocol
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {proofPoints.map(({ title, text }, index) => (
              <article key={title} className="reveal-up proof-card rounded-[1.4rem] border border-white/13 bg-white/6 p-5 backdrop-blur">
                <div className="flex items-center justify-between">
                  <ShieldCheck className="size-5 text-lime" />
                  <span className="font-mono text-[0.65rem] font-bold text-white/28">0{index + 1}</span>
                </div>
                <h3 className="mt-6 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/52">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="reveal-up text-center">
            <p className="font-mono text-xs font-bold tracking-[0.16em] text-violet uppercase">One protocol, two sides</p>
            <h2 className="balance-text mx-auto mt-3 max-w-4xl text-4xl font-black tracking-[-0.06em] sm:text-6xl">Built for the member and the person running the door.</h2>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <article className="reveal-up role-panel group relative overflow-hidden rounded-[2rem] border border-ink bg-violet p-7 text-white shadow-[7px_8px_0_var(--ink)] sm:p-9">
              <div className="role-orb bg-lime" aria-hidden />
              <UserRound className="relative size-8 text-lime" />
              <p className="relative mt-12 font-mono text-xs font-bold tracking-[0.14em] text-white/55 uppercase">For members</p>
              <h3 className="relative mt-2 text-4xl font-black tracking-[-0.05em]">Your memberships, in one wallet.</h3>
              <p className="relative mt-4 max-w-lg leading-7 text-white/70">Open every pass, see its live status, and answer a scanner challenge without submitting an onchain transaction.</p>
              <Link href="/passes" className="relative mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 font-bold text-ink transition-transform group-hover:translate-x-1">
                Explore member mode <ArrowRight className="size-4" />
              </Link>
            </article>
            <article className="reveal-up role-panel group relative overflow-hidden rounded-[2rem] border border-ink bg-lime p-7 shadow-[7px_8px_0_var(--ink)] sm:p-9">
              <div className="role-orb bg-violet" aria-hidden />
              <Store className="relative size-8 text-violet" />
              <p className="relative mt-12 font-mono text-xs font-bold tracking-[0.14em] text-ink-soft uppercase">For issuers</p>
              <h3 className="relative mt-2 text-4xl font-black tracking-[-0.05em]">Create, issue, scan, repeat.</h3>
              <p className="relative mt-4 max-w-lg leading-7 text-ink-soft">Control only the programs and passes your wallet creates. Pause issuance, extend access, revoke permanently, and verify at the door.</p>
              <Link href="/issuer" className="relative mt-7 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-3 font-bold text-white transition-transform group-hover:translate-x-1">
                Open issuer studio <ArrowRight className="size-4" />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-paper-deep/65 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          {[
            { href: "/docs", eyebrow: "Protocol & guides", title: "Read the docs", text: "Set up a wallet, issue a pass, run a scanner, and understand exactly what gets verified.", icon: BookOpen },
            { href: "/changelog", eyebrow: "Shipping in public", title: "Follow the updates", text: "See testnet milestones, mainnet releases, product changes, and the work that is still ahead.", icon: History },
            { href: "/about", eyebrow: "Open builder story", title: "Meet the builder", text: "Why Unisky Pass exists, how it is designed, and where to follow Nxrskyaa's work.", icon: UserRound },
          ].map(({ href, eyebrow, title, text, icon: Icon }) => (
            <Link key={href} href={href} className="reveal-up kinetic-card group rounded-[1.5rem] border border-line bg-white/82 p-6">
              <div className="flex items-center justify-between">
                <Icon className="size-5 text-violet" />
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="mt-8 font-mono text-[0.65rem] font-bold tracking-[0.13em] text-violet uppercase">{eyebrow}</p>
              <h3 className="mt-2 text-2xl font-black tracking-[-0.04em]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink-soft">{text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="reveal-up relative mx-auto max-w-6xl overflow-hidden rounded-[2.2rem] border-2 border-ink bg-lime px-6 py-14 text-center shadow-[10px_11px_0_var(--ink)] sm:px-10 sm:py-20">
          <div className="cta-orbit" aria-hidden />
          <Clock3 className="relative mx-auto size-7" />
          <p className="relative mt-5 font-mono text-xs font-bold tracking-[0.16em] uppercase">Ready at the door</p>
          <h2 className="balance-text relative mx-auto mt-4 max-w-4xl text-4xl font-black tracking-[-0.065em] sm:text-7xl">Carry less. Prove more. Belong anywhere.</h2>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/passes" className="group inline-flex min-h-12 items-center gap-2 rounded-xl border border-ink bg-ink px-5 font-bold text-white">
              View my passes <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="https://monadscan.com/address/0x935D7681Fd0454f38848925fc03d918dA036Ed99" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-ink bg-paper px-5 font-bold shadow-[2px_2px_0_var(--ink)] transition hover:-translate-y-0.5">
              Mainnet contract <ExternalLink className="size-4" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
