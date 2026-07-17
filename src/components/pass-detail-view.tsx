"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, Fingerprint, QrCode, Store, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { CopyButton } from "@/components/copy-button";
import { EmptyState } from "@/components/empty-state";
import { LoadingCards } from "@/components/loading-cards";
import { useNetwork } from "@/components/network-provider";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { WalletButton } from "@/components/wallet-button";
import { formatDate, formatDuration } from "@/lib/chain/format";
import { useMemberPasses } from "@/hooks/use-member-passes";

export function PassDetailView({ passId }: { passId: string }) {
  const { address, isConnected, chainId } = useAccount();
  const { deployment, selectedChainId } = useNetwork();
  const contractAddress = deployment.contractAddress;
  const networkConfigurationError = deployment.configurationError;
  const passes = useMemberPasses(address);
  const item = passes.data?.find((pass) => pass.id.toString() === passId);

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <EmptyState
          title="Connect the holder wallet"
          description="This detail view confirms that the connected wallet is the pass holder."
          action={<WalletButton />}
        />
      </div>
    );
  }

  if (networkConfigurationError || chainId !== selectedChainId || !contractAddress) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <EmptyState
          title={networkConfigurationError ? "Network configuration is invalid" : chainId !== selectedChainId ? "Switch to the required network" : "Pass lookup is waiting for deployment"}
          description={networkConfigurationError ?? (chainId !== selectedChainId ? `Switch to ${deployment.chain.name} before loading this pass.` : "Set the deployed registry address before loading pass details.")}
          action={<Link href="/passes" className="font-bold text-violet underline underline-offset-4">Back to My Passes</Link>}
        />
      </div>
    );
  }

  if (passes.isPending) {
    return <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6"><LoadingCards count={1} /></div>;
  }

  if (passes.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <EmptyState
          title="We could not load this pass"
          description={passes.error instanceof Error ? passes.error.message : "The Monad RPC did not respond."}
          action={<button type="button" className="font-bold text-violet underline underline-offset-4" onClick={() => passes.refetch()}>Retry</button>}
        />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <EmptyState
          title="Pass not found in this wallet"
          description="It may belong to another wallet, or the registry could not return it."
          action={<Link href="/passes" className="font-bold text-violet underline underline-offset-4">Back to My Passes</Link>}
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/passes" className="inline-flex items-center gap-2 text-sm font-bold text-ink-soft hover:text-ink">
          <ArrowLeft className="size-4" /> My Passes
        </Link>
        <Card className="mt-5 overflow-hidden border-ink">
          <div className="bg-ink p-6 text-white sm:p-9">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs font-bold tracking-[0.16em] text-lime uppercase">Unisky Pass · #{item.id.toString()}</p>
                <h1 className="mt-4 text-4xl font-black tracking-[-0.055em] sm:text-5xl">{item.program.name}</h1>
              </div>
              <StatusBadge status={item.status} className="bg-white" />
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/12 bg-white/6 p-4">
                <p className="flex items-center gap-2 text-sm text-white/50"><Store className="size-4" /> Issuer</p>
                <p className="mt-2 break-all font-mono text-sm font-semibold">{item.pass.issuer}</p>
              </div>
              <div className="rounded-xl border border-white/12 bg-white/6 p-4">
                <p className="flex items-center gap-2 text-sm text-white/50"><Wallet className="size-4" /> Holder</p>
                <p className="mt-2 break-all font-mono text-sm font-semibold">{item.pass.holder}</p>
              </div>
            </div>
          </div>
          <div className="grid gap-px bg-line sm:grid-cols-3">
            {[
              ["Issued", formatDate(item.pass.issuedAt)],
              ["Starts", formatDate(item.pass.validFrom)],
              ["Expires", formatDate(item.pass.expiresAt)],
            ].map(([label, value]) => (
              <div key={label} className="bg-white p-5">
                <p className="text-xs font-bold tracking-wide text-ink-soft uppercase">{label}</p>
                <p className="mt-2 text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="p-6 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold"><CalendarDays className="size-4 text-violet" /> Program duration</p>
                <p className="mt-2 text-sm text-ink-soft">{formatDuration(item.program.duration)} per issued pass</p>
              </div>
              <div>
                <p className="flex items-center gap-2 text-sm font-bold"><Fingerprint className="size-4 text-violet" /> Non-transferable</p>
                <p className="mt-2 text-sm text-ink-soft">This pass can never move to another wallet.</p>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap gap-3 border-t border-line pt-6">
              {item.status === 2 ? (
                <Link
                  href={`/check-in?passId=${item.id.toString()}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink bg-ink px-4 text-sm font-bold text-white shadow-[3px_3px_0_var(--violet)]"
                >
                  <QrCode className="size-4" /> Check in with this pass
                </Link>
              ) : null}
              <CopyButton value={item.id.toString()} variant="secondary">Copy pass ID</CopyButton>
              <a
                href={`${deployment.explorerUrl}/address/${item.pass.issuer}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-violet hover:bg-violet/8"
              >
                View issuer on explorer ↗
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
