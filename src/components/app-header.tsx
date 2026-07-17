"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { NetworkSelector } from "@/components/network-selector";
import { WalletButton } from "@/components/wallet-button";
import { cn } from "@/lib/cn";

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
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur-xl",
        isHome
          ? "border-white/10 bg-ink/90 text-white supports-[backdrop-filter]:bg-ink/78"
          : "border-ink/9 bg-paper/82 text-ink supports-[backdrop-filter]:bg-paper/76",
      )}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="Unisky Pass home">
          <BrandMark className={cn("transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105", isHome && "!border-white/20")} />
          <span className="hidden text-[1.05rem] font-black tracking-[-0.045em] sm:inline">UNISKY PASS</span>
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary navigation">
          {productLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-semibold transition",
                isHome
                  ? "text-white/68 hover:bg-white/10 hover:text-white"
                  : "text-ink-soft hover:bg-white hover:text-ink",
              )}
            >
              {link.label}
            </Link>
          ))}
          <span className={cn("mx-2 h-5 w-px", isHome ? "bg-white/18" : "bg-line")} aria-hidden />
          {resourceLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-2.5 py-2 text-xs font-bold transition",
                isHome
                  ? "text-white/58 hover:bg-white/10 hover:text-lime"
                  : "text-ink-soft hover:bg-white hover:text-violet",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex min-w-0 items-center gap-2">
          <NetworkSelector className="shrink-0" tone={isHome ? "dark" : "light"} />
          <WalletButton tone={isHome ? "dark" : "light"} />
        </div>
      </div>
    </header>
  );
}
