import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { MobileNav } from "@/components/mobile-nav";
import { NetworkBanner } from "@/components/network-banner";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Unisky Pass — One wallet for every place you belong",
    template: "%s — Unisky Pass",
  },
  description:
    "Create and verify time-based membership passes. No screenshots, no shared logins, and no money held by the app.",
  applicationName: "Unisky Pass",
  keywords: ["membership pass", "check-in", "Monad", "wallet verification"],
  openGraph: {
    title: "Unisky Pass",
    description: "One wallet for every place you belong.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f2e9",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-full antialiased">
        <Providers>
          <NetworkBanner />
          <AppHeader />
          <main className="min-h-[calc(100vh-5rem)] pb-24 md:pb-0">{children}</main>
          <AppFooter />
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
