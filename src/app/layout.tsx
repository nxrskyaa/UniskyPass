import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppRouteShell } from "@/components/app-route-shell";
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
  metadataBase: new URL("https://unisky-pass.vercel.app"),
  title: {
    default: "Unisky Pass — Verifiable membership on Monad",
    template: "%s — Unisky Pass",
  },
  description:
    "Create, carry, and verify time-based membership passes with fresh wallet proofs on Monad mainnet and testnet.",
  applicationName: "Unisky Pass",
  keywords: ["membership pass", "check-in", "Monad", "wallet verification"],
  authors: [{ name: "Nxrskyaa", url: "https://x.com/nxrskyaa" }],
  creator: "Nxrskyaa",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Unisky Pass — Membership that proves itself",
    description: "One wallet for every place you belong. Built on Monad mainnet and testnet.",
    type: "website",
    url: "/",
    siteName: "Unisky Pass",
  },
  twitter: {
    card: "summary",
    title: "Unisky Pass — Membership that proves itself",
    description: "Create, carry, and verify membership passes on Monad.",
    creator: "@nxrskyaa",
  },
};

export const viewport: Viewport = {
  themeColor: "#111217",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-full antialiased">
        <AppRouteShell>{children}</AppRouteShell>
      </body>
    </html>
  );
}
