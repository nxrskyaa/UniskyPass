import Link from "next/link";
import { ArrowUpRight, Code2 } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const productLinks = [
  { href: "/passes", label: "My Passes" },
  { href: "/issuer", label: "Issuer Studio" },
  { href: "/scanner", label: "Scanner" },
];

const resourceLinks = [
  { href: "/docs", label: "Documentation" },
  { href: "/changelog", label: "Changelog" },
  { href: "/about", label: "About" },
];

export function AppFooter() {
  return (
    <footer className="border-t border-white/10 bg-ink px-4 pb-28 pt-14 text-white sm:px-6 lg:px-8 xl:pb-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 border-b border-white/10 pb-12 md:grid-cols-[1.35fr_.65fr_.65fr_.75fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Unisky Pass home">
              <BrandMark className="size-9 border-white/20 shadow-none" />
              <span className="font-black tracking-[-0.045em]">UNISKY PASS</span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/48">
              Verifiable, time-based membership records on Monad. The contract holds no funds, passes never transfer, and check-in asks for a fresh wallet proof.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-lime/25 bg-lime/8 px-3 py-1.5 text-xs font-bold text-lime">
              <span className="size-1.5 rounded-full bg-lime" />
              MAINNET + TESTNET LIVE
            </div>
          </div>

          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Resources" links={resourceLinks} />

          <div>
            <p className="font-mono text-[0.65rem] font-bold tracking-[0.14em] text-white/60 uppercase">Builder</p>
            <p className="mt-4 font-bold">Nxrskyaa</p>
            <div className="mt-3 flex flex-col items-start gap-2 text-sm text-white/55">
              <a href="https://x.com/nxrskyaa" target="_blank" rel="noreferrer" className="group inline-flex items-center gap-1.5 transition hover:text-lime">
                x.com/nxrskyaa <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <a href="https://github.com/nxrskyaa" target="_blank" rel="noreferrer" className="group inline-flex items-center gap-1.5 transition hover:text-lime">
                <Code2 className="size-3.5" /> github.com/nxrskyaa
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 pt-7 text-xs text-white/60 lg:flex-row lg:items-center lg:justify-between">
          <p>© 2026 Unisky Pass. Built in public on Monad.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 font-mono">
            <a href="https://monadscan.com/address/0x935D7681Fd0454f38848925fc03d918dA036Ed99" target="_blank" rel="noreferrer" className="transition hover:text-lime">
              MAINNET · 0x935D…Ed99 ↗
            </a>
            <a href="https://testnet.monadscan.com/address/0x7a2fDcaa6eAC3a0c8E0E6E391Ca9c7ef2B737690" target="_blank" rel="noreferrer" className="transition hover:text-lime">
              TESTNET · 0x7a2f…7690 ↗
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ href: string; label: string }>;
}) {
  return (
    <div>
      <p className="font-mono text-[0.65rem] font-bold tracking-[0.14em] text-white/60 uppercase">{title}</p>
      <div className="mt-4 flex flex-col items-start gap-2.5 text-sm font-semibold text-white/58">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="transition hover:translate-x-0.5 hover:text-lime">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
