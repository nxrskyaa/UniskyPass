"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  Check,
  ChevronDown,
  LoaderCircle,
  LogIn,
  LogOut,
  Plus,
  ShieldCheck,
  WalletCards,
  X,
} from "lucide-react";
import {
  useConnectWallet,
  useCreateWallet,
  useLogin,
  usePrivy,
  useWallets,
  type ConnectedWallet,
} from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useNetwork } from "@/components/network-provider";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/lib/chain/format";

function walletName(wallet: ConnectedWallet) {
  if (
    wallet.walletClientType === "privy" ||
    wallet.walletClientType === "privy-v2"
  ) {
    return "Privy embedded wallet";
  }

  return wallet.meta.name || "External wallet";
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The wallet action could not be completed.";
}

export function WalletButton({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [open, setOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const { address } = useAccount();
  const {
    ready: privyReady,
    authenticated,
    isModalOpen,
    logout,
  } = usePrivy();
  const { login } = useLogin();
  const { connectWallet } = useConnectWallet();
  const { createWallet } = useCreateWallet();
  const { ready: walletsReady, wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();
  const { transactionGuard } = useNetwork();

  const isReady = privyReady && walletsReady;
  const accountActionsLocked = transactionGuard !== "idle";
  const activeAddress = address?.toLowerCase();

  if (!privyReady || !authenticated) {
    return (
      <Button
        variant={tone === "dark" ? "secondary" : "primary"}
        size="sm"
        disabled={!privyReady || isModalOpen}
        onClick={() => login()}
      >
        {!privyReady || isModalOpen ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        ) : (
          <LogIn className="size-4" aria-hidden />
        )}
        <span className="hidden min-[440px]:inline">
          {!privyReady ? "Loading" : isModalOpen ? "Opening" : "Log in / connect"}
        </span>
        <span className="sr-only min-[440px]:hidden">
          {!privyReady ? "Loading wallet login" : "Log in or connect wallet"}
        </span>
      </Button>
    );
  }

  async function runWalletAction(key: string, action: () => Promise<unknown>) {
    if (accountActionsLocked) return;

    setPendingAction(key);
    setActionError(undefined);
    try {
      await action();
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setPendingAction(undefined);
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setActionError(undefined);
      }}
    >
      <Dialog.Trigger asChild>
        <Button variant="secondary" size="sm">
          {address ? (
            <>
              <span className="size-2 rounded-full bg-success" aria-hidden />
              <span className="hidden font-mono min-[400px]:inline">
                {shortenAddress(address)}
              </span>
              <span className="sr-only min-[400px]:hidden">
                Active wallet {address}
              </span>
              <ChevronDown className="size-4" aria-hidden />
            </>
          ) : (
            <>
              <WalletCards className="size-4" aria-hidden />
              <span className="hidden min-[440px]:inline">Choose wallet</span>
              <span className="sr-only min-[440px]:hidden">Choose active wallet</span>
            </>
          )}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/75 data-[state=open]:animate-[fade-in_.15s_ease-out]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1.5rem] border border-ink bg-paper p-5 shadow-[7px_7px_0_var(--violet)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-bold tracking-tight">
                Your Unisky wallet
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm leading-6 text-ink-soft">
                Your active wallet address is your only onchain membership identity.
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="rounded-lg p-2 text-ink-soft hover:bg-white hover:text-ink"
              aria-label="Close"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>

          <div className="mt-5 rounded-xl border border-line bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-success">
              <ShieldCheck className="size-4" /> Privy session active
            </div>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              Email or supported SMS is handled by Privy for login. Unisky Pass does not store it or write it to Monad.
            </p>
          </div>

          <div className="mt-5">
            <p className="text-xs font-bold tracking-[0.14em] text-ink-soft uppercase">
              Active wallet
            </p>
            {!isReady ? (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-line bg-white p-4 text-sm text-ink-soft">
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                Loading wallets…
              </div>
            ) : wallets.length > 0 ? (
              <div className="mt-2 space-y-2">
                {wallets.map((wallet) => {
                  const isActive = wallet.address.toLowerCase() === activeAddress;
                  const isPending = pendingAction === wallet.address;

                  return (
                    <button
                      key={`${wallet.walletClientType}:${wallet.address}`}
                      type="button"
                      disabled={
                        accountActionsLocked ||
                        Boolean(pendingAction) ||
                        isActive
                      }
                      onClick={() =>
                        void runWalletAction(wallet.address, () =>
                          setActiveWallet(wallet),
                        )
                      }
                      className="flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 text-left transition hover:border-ink hover:shadow-[2px_2px_0_var(--ink)] disabled:opacity-60"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {walletName(wallet)}
                        </span>
                        <span className="block truncate font-mono text-xs text-ink-soft">
                          {wallet.address}
                        </span>
                      </span>
                      {isPending ? (
                        <LoaderCircle className="size-4 shrink-0 animate-spin" aria-hidden />
                      ) : isActive ? (
                        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-success">
                          <Check className="size-4" /> Active
                        </span>
                      ) : (
                        <span className="shrink-0 text-xs font-semibold text-violet">
                          Use
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-2 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm leading-6 text-warning">
                No Ethereum wallet is ready yet. Retry embedded wallet creation or connect an external wallet.
              </div>
            )}
          </div>

          {accountActionsLocked ? (
            <p className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm leading-6 text-warning">
              Wallet changes are locked while a transaction is active or its confirmation is uncertain.
            </p>
          ) : null}

          {actionError ? (
            <p role="alert" className="mt-4 text-sm font-medium text-danger">
              {actionError}
            </p>
          ) : null}

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {wallets.length === 0 ? (
              <Button
                variant="primary"
                disabled={accountActionsLocked || Boolean(pendingAction)}
                onClick={() =>
                  void runWalletAction("create", () => createWallet())
                }
              >
                {pendingAction === "create" ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                ) : (
                  <WalletCards className="size-4" aria-hidden />
                )}
                Create wallet
              </Button>
            ) : null}
            <Button
              variant="secondary"
              disabled={accountActionsLocked || Boolean(pendingAction)}
              onClick={() => {
                if (accountActionsLocked) return;
                setActionError(undefined);
                connectWallet();
              }}
            >
              <Plus className="size-4" /> Connect another
            </Button>
            <Button
              className={wallets.length === 0 ? undefined : "sm:col-span-2"}
              variant="quiet"
              disabled={accountActionsLocked || Boolean(pendingAction)}
              onClick={() =>
                void runWalletAction("logout", async () => {
                  await logout();
                  setOpen(false);
                })
              }
            >
              {pendingAction === "logout" ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              ) : (
                <LogOut className="size-4" aria-hidden />
              )}
              Log out
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
