"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { QrCode, Store, TicketCheck } from "lucide-react";
import { cn } from "@/lib/cn";

const links = [
  { href: "/passes", label: "Passes", icon: TicketCheck },
  { href: "/issuer", label: "Issuer", icon: Store },
  { href: "/scanner", label: "Scan", icon: QrCode },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed right-3 bottom-3 left-3 z-40 grid grid-cols-3 rounded-2xl border border-ink bg-ink p-1.5 text-white shadow-[4px_4px_0_var(--violet)] md:hidden"
      aria-label="Mobile navigation"
    >
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[0.68rem] font-semibold transition",
              active ? "bg-lime text-ink" : "text-white/65 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="size-4.5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
