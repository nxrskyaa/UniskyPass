"use client";

import { LoaderCircle, WalletCards } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { WalletButton } from "@/components/wallet-button";
import type { WalletSessionStatus } from "@/hooks/use-wallet-session";

export function WalletSessionNotice({
  status,
  signedOutTitle,
  signedOutDescription,
}: {
  status: Exclude<WalletSessionStatus, "ready">;
  signedOutTitle: string;
  signedOutDescription: string;
}) {
  if (status === "loading") {
    return (
      <EmptyState
        icon={<LoaderCircle className="size-5 animate-spin" />}
        title="Restoring your wallet"
        description="Privy is restoring your login session and syncing the active wallet with Unisky Pass."
      />
    );
  }

  if (status === "needs-wallet") {
    return (
      <EmptyState
        icon={<WalletCards className="size-5" />}
        title="Finish wallet setup"
        description="Your Privy session is active, but no Ethereum wallet is ready. Open the wallet menu to retry embedded wallet creation or connect an external wallet."
        action={<WalletButton />}
      />
    );
  }

  return (
    <EmptyState
      icon={<WalletCards className="size-5" />}
      title={signedOutTitle}
      description={signedOutDescription}
      action={<WalletButton />}
    />
  );
}
