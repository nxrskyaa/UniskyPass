"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, QrCode, Store, TicketCheck } from "lucide-react";
import { cn } from "@/lib/cn";

const links = [
  { href: "/passes", label: "Passes", icon: TicketCheck },
  { href: "/issuer", label: "Issuer", icon: Store },
  { href: "/scanner", label: "Scan", icon: QrCode },
  { href: "/docs", label: "Docs", icon: BookOpen },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-3 left-1/2 z-40 grid w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 grid-cols-4 border border-white/18 bg-ink p-1.5 text-white shadow-[4px_4px_0_var(--violet)] xl:hidden"
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
              "flex min-h-12 flex-col items-center justify-center gap-0.5 text-[0.66rem] font-semibold transition duration-200",
              active ? "bg-lime text-ink" : "text-white/58 hover:bg-white/10 hover:text-white",
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
