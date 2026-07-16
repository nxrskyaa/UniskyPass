"use client";

import { CircleAlert, RadioTower } from "lucide-react";
import { useAccount, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  expectedChain,
  expectedChainId,
  networkConfigurationError,
} from "@/lib/chain/config";

export function NetworkBanner() {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending, error } = useSwitchChain();

  if (networkConfigurationError) {
    return (
      <div className="border-b border-ink bg-coral px-4 py-2 text-ink">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-center text-sm font-semibold">
          <CircleAlert className="size-4" aria-hidden />
          <span>{networkConfigurationError}</span>
        </div>
      </div>
    );
  }

  if (!isConnected || chainId === expectedChainId) return null;

  return (
    <div className="border-b border-ink bg-coral px-4 py-2 text-ink">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-sm font-semibold">
        <RadioTower className="size-4" aria-hidden />
        <span>Wrong network. Switch to {expectedChain.name} to continue.</span>
        <Button
          size="sm"
          variant="secondary"
          disabled={isPending}
          onClick={() => switchChain({ chainId: expectedChainId })}
        >
          {isPending ? "Switching…" : "Switch network"}
        </Button>
        {error ? <span className="w-full text-xs">{error.message}</span> : null}
      </div>
    </div>
  );
}
