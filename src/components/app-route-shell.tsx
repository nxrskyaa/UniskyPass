"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { MobileNav } from "@/components/mobile-nav";
import { NetworkBanner } from "@/components/network-banner";
import { Providers } from "@/components/providers";

export function AppRouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  if (isLanding) {
    return <main className="landing-main">{children}</main>;
  }

  return (
    <Providers>
      <NetworkBanner />
      <AppHeader />
      <main className="app-main">{children}</main>
      <AppFooter />
      <MobileNav />
    </Providers>
  );
}
