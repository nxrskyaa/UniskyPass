"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useNetwork } from "@/components/network-provider";
import { useToast } from "@/components/toast-provider";
import { cn } from "@/lib/cn";
import {
  MONAD_MAINNET_CHAIN_ID,
  MONAD_TESTNET_CHAIN_ID,
  type SupportedChainId,
} from "@/lib/chain/config";

export type NetworkSelectorProps = {
  className?: string;
  tone?: "light" | "dark";
};

const networks = [
  {
    id: MONAD_MAINNET_CHAIN_ID,
    label: "Mainnet",
    detail: "Production",
    dot: "bg-success",
    active: "bg-lime text-ink",
  },
  {
    id: MONAD_TESTNET_CHAIN_ID,
    label: "Testnet",
    detail: "Release rehearsal",
    dot: "bg-warning",
    active: "bg-sky text-ink",
  },
] as const;

export function NetworkSelector({
  className,
  tone = "light",
}: NetworkSelectorProps) {
  const notify = useToast();
  const {
    selectedChainId,
    isSwitching,
    transactionGuard,
    selectNetwork,
  } = useNetwork();
  const [open, setOpen] = useState(false);
  const [pendingChainId, setPendingChainId] = useState<SupportedChainId>();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const selectedNetwork =
    networks.find(({ id }) => id === selectedChainId) ?? networks[0];
  const isLocked =
    transactionGuard !== "idle" ||
    isSwitching ||
    pendingChainId !== undefined;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function chooseNetwork(nextChainId: SupportedChainId) {
    if (nextChainId === selectedChainId) {
      setOpen(false);
      return;
    }

    setPendingChainId(nextChainId);
    try {
      await selectNetwork(nextChainId);
      setOpen(false);
    } catch (error: unknown) {
      notify({
        title: "Network unchanged",
        description:
          error instanceof Error
            ? error.message
            : "The wallet did not switch networks.",
        tone: "error",
      });
    } finally {
      setPendingChainId(undefined);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={`Monad network: ${selectedNetwork.label}`}
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-busy={pendingChainId !== undefined}
        disabled={isLocked}
        onClick={() => setOpen((current) => !current)}
        title={
          transactionGuard === "idle"
            ? `Selected network: Monad ${selectedNetwork.label}`
            : "Network selection is locked while a transaction is pending."
        }
        className={cn(
          "inline-flex min-h-10 items-center gap-2 border px-3 text-xs font-bold transition duration-200 disabled:cursor-wait disabled:opacity-55",
          tone === "dark"
            ? "border-white/16 bg-white/8 text-white shadow-[2px_2px_0_rgb(200_255_77/55%)] hover:bg-white/13"
            : "border-line bg-white/88 text-ink shadow-sm hover:border-ink/45 hover:bg-white",
        )}
      >
        <span
          className={cn(
            "size-2 shrink-0 rounded-full ring-4",
            selectedNetwork.dot,
            tone === "dark" ? "ring-white/8" : "ring-ink/5",
          )}
          aria-hidden
        />
        <span>{selectedNetwork.label}</span>
        <ChevronDown
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="listbox"
          aria-label="Monad network"
          className={cn(
            "absolute top-[calc(100%+0.6rem)] right-0 z-50 w-60 border p-1.5 shadow-[5px_6px_0_var(--violet)]",
            tone === "dark"
              ? "border-white/15 bg-[#191922] text-white"
              : "border-ink bg-paper text-ink",
          )}
        >
          <div className="flex items-center justify-between px-3 py-2">
            <span
              className={cn(
                "font-mono text-[0.6rem] font-black tracking-[0.16em] uppercase",
                tone === "dark" ? "text-white/45" : "text-ink-soft",
              )}
            >
              Select network
            </span>
            <span
              className={cn(
                "font-mono text-[0.6rem] font-black tracking-[0.16em] uppercase",
                tone === "dark" ? "text-lime" : "text-violet",
              )}
            >
              Monad
            </span>
          </div>

          <div className="grid gap-1">
            {networks.map((network) => {
              const isSelected = network.id === selectedChainId;
              const isPending = network.id === pendingChainId;

              return (
                <button
                  key={network.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={isLocked}
                  onClick={() => void chooseNetwork(network.id)}
                  className={cn(
                    "flex min-h-14 w-full items-center justify-between gap-3 px-3 text-left transition disabled:cursor-wait disabled:opacity-55",
                    isSelected
                      ? network.active
                      : tone === "dark"
                        ? "text-white/72 hover:bg-white/10 hover:text-white"
                        : "text-ink-soft hover:bg-white hover:text-ink",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn("size-2 shrink-0 rounded-full", network.dot)}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold">
                        Monad {network.label}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 block font-mono text-[0.62rem] font-bold tracking-[0.08em] uppercase",
                          isSelected
                            ? "text-ink/58"
                            : tone === "dark"
                              ? "text-white/38"
                              : "text-ink-soft/70",
                        )}
                      >
                        {network.detail} · Chain {network.id}
                      </span>
                    </span>
                  </span>
                  {isPending ? (
                    <span
                      className="size-4 shrink-0 animate-pulse rounded-full border-2 border-current border-t-transparent"
                      aria-label="Switching"
                    />
                  ) : isSelected ? (
                    <Check className="size-4 shrink-0" aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
