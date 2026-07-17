"use client";

import { RadioTower } from "lucide-react";
import { useNetwork } from "@/components/network-provider";
import { useToast } from "@/components/toast-provider";
import { cn } from "@/lib/cn";
import {
  MONAD_MAINNET_CHAIN_ID,
  MONAD_TESTNET_CHAIN_ID,
  isSupportedChainId,
} from "@/lib/chain/config";

export type NetworkSelectorProps = {
  className?: string;
};

export function NetworkSelector({ className }: NetworkSelectorProps) {
  const notify = useToast();
  const {
    selectedChainId,
    deployment,
    isSwitching,
    transactionGuard,
    selectNetwork,
  } = useNetwork();

  return (
    <label
      className={cn(
        "inline-flex min-h-9 items-center gap-2 rounded-lg border border-line bg-white px-2.5 text-xs font-bold text-ink shadow-sm",
        className,
      )}
      title={
        transactionGuard === "idle"
          ? `Selected network: ${deployment.chain.name}`
          : "Network selection is locked while a transaction is pending."
      }
    >
      <RadioTower
        className="hidden size-3.5 shrink-0 text-violet min-[360px]:block"
        aria-hidden
      />
      <span className="sr-only">Monad network</span>
      <select
        aria-label="Monad network"
        value={selectedChainId}
        disabled={isSwitching || transactionGuard !== "idle"}
        onChange={(event) => {
          const nextChainId = Number(event.target.value);
          if (isSupportedChainId(nextChainId)) {
            void selectNetwork(nextChainId).catch((error: unknown) => {
              notify({
                title: "Network unchanged",
                description:
                  error instanceof Error
                    ? error.message
                    : "The wallet did not switch networks.",
                tone: "error",
              });
            });
          }
        }}
        className="min-w-0 cursor-pointer appearance-none bg-transparent pr-1 outline-none disabled:cursor-wait disabled:opacity-60"
      >
        <option value={MONAD_MAINNET_CHAIN_ID}>Mainnet</option>
        <option value={MONAD_TESTNET_CHAIN_ID}>Testnet</option>
      </select>
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          selectedChainId === MONAD_MAINNET_CHAIN_ID
            ? "bg-success"
            : "bg-warning",
        )}
        aria-hidden
      />
    </label>
  );
}
