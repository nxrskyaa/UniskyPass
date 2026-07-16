import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Clock3,
  Fingerprint,
  QrCode,
  ShieldCheck,
  Smartphone,
  Store,
  WalletCards,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const steps = [
  {
    number: "01",
    title: "A place creates a pass",
    description: "Your gym, studio, club, or community sets the membership duration and sends the pass to your wallet.",
    icon: Store,
  },
  {
    number: "02",
    title: "It lives with your wallet",
    description: "See every place you belong in one view. No account recovery forms and no personal profile to maintain.",
    icon: WalletCards,
  },
  {
    number: "03",
    title: "Prove it at the door",
    description: "Sign a fresh, one-minute challenge. The scanner checks your signature and current membership state.",
    icon: QrCode,
  },
];

export default function Home() {
  return (
    <>
      <section className="page-grid overflow-hidden border-b border-ink/12 px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.03fr_.97fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-ink bg-lime px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0_var(--ink)]">
              <BadgeCheck className="size-4" aria-hidden />
              Membership that proves itself
            </div>
            <h1 className="balance-text mt-7 max-w-3xl text-[clamp(3.4rem,9vw,6.9rem)] leading-[0.86] font-black tracking-[-0.078em]">
              One wallet for every place you <span className="text-violet">belong.</span>
            </h1>
            <p className="pretty-text mt-7 max-w-xl text-lg leading-8 text-ink-soft sm:text-xl">
              A membership pass that cannot be copied as a screenshot. Hold it in your wallet, prove it in seconds, and keep your personal details to yourself.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/passes"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-ink bg-ink px-5 font-bold text-white shadow-[3px_3px_0_var(--violet)] transition hover:-translate-y-0.5 hover:shadow-[4px_5px_0_var(--violet)]"
              >
                Open my passes <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/issuer"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-ink bg-paper px-5 font-bold shadow-[2px_2px_0_var(--ink)] transition hover:-translate-y-0.5 hover:bg-white"
              >
                Create passes
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-ink-soft">
              <span className="flex items-center gap-1.5"><Check className="size-4 text-success" /> No app-held funds</span>
              <span className="flex items-center gap-1.5"><Check className="size-4 text-success" /> No personal profiles</span>
              <span className="flex items-center gap-1.5"><Check className="size-4 text-success" /> Verified on Monad</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="absolute -top-6 -right-7 size-32 rounded-full border border-ink bg-sky shadow-[5px_5px_0_var(--ink)]" />
            <div className="absolute -bottom-8 -left-5 size-20 rotate-12 rounded-2xl border border-ink bg-coral shadow-[4px_4px_0_var(--ink)]" />
            <div className="relative rotate-[1.5deg] rounded-[2rem] border-2 border-ink bg-violet p-3 shadow-[10px_12px_0_var(--ink)]">
              <div className="relative overflow-hidden rounded-[1.35rem] bg-ink p-6 text-white sm:p-8">
                <div className="absolute -top-20 -right-16 size-56 rounded-full border-[26px] border-white/5" />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <BrandMark className="border-white/20 shadow-none" />
                    <div>
                      <p className="text-xs font-bold tracking-[0.16em] text-white/50 uppercase">Unisky Pass</p>
                      <p className="font-bold">Optimum Gym</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-lime/40 bg-lime/15 px-2.5 py-1 text-xs font-bold text-lime">ACTIVE</span>
                </div>
                <div className="relative mt-16">
                  <p className="text-sm text-white/50">Membership</p>
                  <h2 className="mt-1 text-3xl font-black tracking-[-0.05em] sm:text-4xl">Monthly Access</h2>
                </div>
                <div className="relative mt-9 grid grid-cols-2 gap-3 border-t border-dashed border-white/20 pt-5 text-sm">
                  <div>
                    <p className="text-white/45">Member wallet</p>
                    <p className="mt-1 font-mono font-semibold">0x8A1F…7C20</p>
                  </div>
                  <div>
                    <p className="text-white/45">Valid until</p>
                    <p className="mt-1 font-semibold">Aug 16, 2026</p>
                  </div>
                </div>
                <div className="relative mt-6 flex items-center justify-between rounded-xl bg-white/8 px-3.5 py-3">
                  <span className="flex items-center gap-2 text-sm font-semibold"><Fingerprint className="size-4 text-lime" /> Holder verified</span>
                  <ShieldCheck className="size-5 text-lime" />
                </div>
              </div>
            </div>
            <div className="absolute -right-3 bottom-9 flex -rotate-3 items-center gap-2 rounded-xl border border-ink bg-lime px-3 py-2 text-sm font-black shadow-[3px_3px_0_var(--ink)] sm:right-1">
              <Clock3 className="size-4" /> Check in under 60 sec
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
            <div>
              <p className="font-mono text-xs font-bold tracking-[0.16em] text-violet uppercase">How it works</p>
              <h2 className="balance-text mt-3 text-4xl font-black tracking-[-0.055em] sm:text-5xl">A faster door, with better proof.</h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-ink-soft lg:justify-self-end">
              A picture of a pass proves nothing about who is holding the phone. Unisky Pass asks the wallet for a fresh signature, then checks that the membership is still active right now.
            </p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {steps.map(({ number, title, description, icon: Icon }) => (
              <article key={number} className="rounded-[1.5rem] border border-line bg-white/75 p-6 transition hover:border-ink hover:shadow-[4px_4px_0_var(--violet)]">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl border border-ink bg-paper shadow-[2px_2px_0_var(--ink)]"><Icon className="size-5" /></span>
                  <span className="font-mono text-sm font-black text-violet">{number}</span>
                </div>
                <h3 className="mt-8 text-xl font-black tracking-tight">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-soft">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-ink bg-ink px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-xs font-bold tracking-[0.16em] text-lime uppercase">
              <Smartphone className="size-4" /> Why screenshots are not enough
            </div>
            <h2 className="balance-text mt-4 text-4xl font-black tracking-[-0.055em] sm:text-5xl">The pass changes from a picture into a proof.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Fresh challenge", "Every scan starts with a random, one-minute challenge from the issuer."],
              ["Wallet signature", "Only the wallet that holds the pass can produce the matching response."],
              ["Live membership", "The scanner reads the latest contract state before it says VALID."],
              ["Replay blocked", "A response can be used once per scanner session; old screenshots expire."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-white/14 bg-white/6 p-5">
                <ShieldCheck className="size-5 text-lime" />
                <h3 className="mt-4 font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center rounded-[2rem] border-2 border-ink bg-lime px-6 py-12 text-center shadow-[8px_8px_0_var(--ink)] sm:px-10 sm:py-16">
          <p className="font-mono text-xs font-bold tracking-[0.16em] uppercase">Ready at the door</p>
          <h2 className="balance-text mt-4 max-w-3xl text-4xl font-black tracking-[-0.06em] sm:text-6xl">Carry less. Prove more. Belong anywhere.</h2>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/passes" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-ink bg-ink px-5 font-bold text-white">
              View my passes <ArrowRight className="size-4" />
            </Link>
            <Link href="/issuer" className="inline-flex min-h-12 items-center rounded-xl border border-ink bg-paper px-5 font-bold shadow-[2px_2px_0_var(--ink)]">
              Start as an issuer
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
