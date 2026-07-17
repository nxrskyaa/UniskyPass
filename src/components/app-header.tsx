import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { NetworkSelector } from "@/components/network-selector";
import { WalletButton } from "@/components/wallet-button";

const productLinks = [
  { href: "/passes", label: "My Passes" },
  { href: "/issuer", label: "Issuer" },
  { href: "/scanner", label: "Scanner" },
];

const resourceLinks = [
  { href: "/docs", label: "Docs" },
  { href: "/changelog", label: "Updates" },
  { href: "/about", label: "About" },
];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/9 bg-paper/82 backdrop-blur-xl supports-[backdrop-filter]:bg-paper/76">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="Unisky Pass home">
          <BrandMark className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105" />
          <span className="hidden text-[1.05rem] font-black tracking-[-0.045em] sm:inline">UNISKY PASS</span>
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary navigation">
          {productLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft transition hover:bg-white hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <span className="mx-2 h-5 w-px bg-line" aria-hidden />
          {resourceLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-2.5 py-2 text-xs font-bold text-ink-soft transition hover:bg-white hover:text-violet"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex min-w-0 items-center gap-2">
          <NetworkSelector className="shrink-0" />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
