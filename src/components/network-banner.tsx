"use client";

import { CircleAlert, RadioTower } from "lucide-react";
import { useAccount } from "wagmi";
import { useNetwork } from "@/components/network-provider";
import { Button } from "@/components/ui/button";

export function NetworkBanner() {
  const { isConnected, chainId } = useAccount();
  const {
    deployment,
    selectedChainId,
    isSwitching,
    switchError,
    transactionGuard,
    selectNetwork,
  } = useNetwork();

  if (deployment.configurationError) {
    return (
      <div className="border-b border-ink bg-coral px-4 py-2 text-ink">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-center text-sm font-semibold">
          <CircleAlert className="size-4" aria-hidden />
          <span>{deployment.configurationError}</span>
        </div>
      </div>
    );
  }

  if (!isConnected || chainId === selectedChainId) return null;

  return (
    <div className="border-b border-ink bg-coral px-4 py-2 text-ink">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-sm font-semibold">
        <RadioTower className="size-4" aria-hidden />
        <span>
          Wallet is on the wrong network. Switch to {deployment.chain.name} to
          continue.
        </span>
        <Button
          size="sm"
          variant="secondary"
          disabled={isSwitching || transactionGuard !== "idle"}
          onClick={() =>
            void selectNetwork(selectedChainId).catch(() => undefined)
          }
        >
          {transactionGuard !== "idle"
            ? "Transaction pending"
            : isSwitching
              ? "Switching…"
              : "Switch wallet network"}
        </Button>
        {switchError ? (
          <span role="alert" className="w-full text-xs">
            {switchError}
          </span>
        ) : null}
      </div>
    </div>
  );
}
