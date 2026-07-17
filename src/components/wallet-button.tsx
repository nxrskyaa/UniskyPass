"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Check, ChevronDown, PlugZap, Unplug, X } from "lucide-react";
import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/lib/chain/format";

export function WalletButton() {
  const [open, setOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const { connectors, connect, error, isPending } = useConnect({
    mutation: {
      onSuccess: () => setOpen(false),
    },
  });
  const { disconnect } = useDisconnect();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant={isConnected ? "secondary" : "primary"} size="sm">
          {isConnected && address ? (
            <>
              <span className="size-2 rounded-full bg-success" aria-hidden />
              <span className="hidden font-mono min-[400px]:inline">
                {shortenAddress(address)}
              </span>
              <span className="sr-only min-[400px]:hidden">
                Connected wallet {address}
              </span>
              <ChevronDown className="size-4" aria-hidden />
            </>
          ) : (
            <>
              <PlugZap className="size-4" aria-hidden />
              <span className="hidden min-[400px]:inline">Connect wallet</span>
              <span className="sr-only min-[400px]:hidden">Connect wallet</span>
            </>
          )}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/45 backdrop-blur-sm data-[state=open]:animate-[fade-in_.15s_ease-out]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[1.5rem] border border-ink bg-paper p-5 shadow-[7px_7px_0_var(--violet)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-bold tracking-tight">
                {isConnected ? "Your wallet" : "Choose a wallet"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm leading-6 text-ink-soft">
                Your wallet address is your membership identity. Unisky Pass never sees a password.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-lg p-2 text-ink-soft hover:bg-white hover:text-ink" aria-label="Close">
              <X className="size-5" />
            </Dialog.Close>
          </div>

          {isConnected && address ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-line bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-success">
                  <Check className="size-4" /> Connected
                </div>
                <p className="mt-2 break-all font-mono text-sm text-ink">{address}</p>
              </div>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => {
                  disconnect();
                  setOpen(false);
                }}
              >
                <Unplug className="size-4" /> Disconnect
              </Button>
            </div>
          ) : (
            <div className="mt-5 space-y-2">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  type="button"
                  disabled={isPending}
                  onClick={() => connect({ connector })}
                  className="flex min-h-14 w-full items-center justify-between rounded-xl border border-line bg-white px-4 text-left font-semibold transition hover:border-ink hover:shadow-[2px_2px_0_var(--ink)] disabled:opacity-50"
                >
                  <span>{connector.name}</span>
                  {isPending ? (
                    <span className="text-sm font-normal text-ink-soft">Opening…</span>
                  ) : (
                    <span aria-hidden>→</span>
                  )}
                </button>
              ))}
              {connectors.length === 0 ? (
                <p className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm leading-6 text-warning">
                  No browser wallet was found. Open this page in a wallet browser or install a compatible wallet.
                </p>
              ) : null}
              {error ? (
                <p role="alert" className="pt-2 text-sm font-medium text-danger">
                  {error.message}
                </p>
              ) : null}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
