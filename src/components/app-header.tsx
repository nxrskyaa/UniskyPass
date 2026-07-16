import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { WalletButton } from "@/components/wallet-button";

const links = [
  { href: "/passes", label: "My Passes" },
  { href: "/issuer", label: "For Issuers" },
  { href: "/scanner", label: "Scanner" },
];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/88 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Unisky Pass home">
          <BrandMark className="transition-transform group-hover:-rotate-3" />
          <span className="text-[1.05rem] font-black tracking-[-0.04em]">UNISKY PASS</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft transition hover:bg-white hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <WalletButton />
      </div>
    </header>
  );
}
