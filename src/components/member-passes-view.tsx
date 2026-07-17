"use client";

import Link from "next/link";
import { RefreshCw, ScanLine, WalletCards } from "lucide-react";
import { useAccount } from "wagmi";
import { ContractSetupNotice } from "@/components/contract-setup-notice";
import { useNetwork } from "@/components/network-provider";
import { EmptyState } from "@/components/empty-state";
import { LoadingCards } from "@/components/loading-cards";
import { PageIntro } from "@/components/page-intro";
import { PassCard } from "@/components/pass-card";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/wallet-button";
import { useMemberPasses } from "@/hooks/use-member-passes";

export function MemberPassesView() {
  const { address, isConnected, chainId } = useAccount();
  const { deployment, selectedChainId } = useNetwork();
  const contractAddress = deployment.contractAddress;
  const networkConfigurationError = deployment.configurationError;
  const passes = useMemberPasses(address);

  return (
    <div className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <PageIntro
          eyebrow="Member mode"
          title="My Passes"
          description="Every membership connected to this wallet, with its current status read from Monad."
          action={
            isConnected ? (
              <Link
                href="/check-in"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink bg-ink px-4 text-sm font-bold text-white shadow-[3px_3px_0_var(--violet)]"
              >
                <ScanLine className="size-4" /> Start check-in
              </Link>
            ) : undefined
          }
        />

        <div className="mt-6">
          <ContractSetupNotice />
        </div>

        <div className="mt-7">
          {!isConnected ? (
            <EmptyState
              icon={<WalletCards className="size-5" />}
              title="Connect the wallet that holds your pass"
              description="Passes are matched to wallet addresses. Connecting lets this page look up your memberships without creating an account."
              action={<WalletButton />}
            />
          ) : networkConfigurationError ? (
            <EmptyState
              title="Network configuration is invalid"
              description={networkConfigurationError}
            />
          ) : chainId !== selectedChainId ? (
            <EmptyState
              title="Switch to the required network"
              description={`Switch your wallet to ${deployment.chain.name}, then your passes will load automatically.`}
            />
          ) : !contractAddress ? (
            <EmptyState
              title="Pass lookup will be ready after deployment"
              description="The frontend is running, but there is no deployed registry address in this environment yet."
            />
          ) : passes.isPending ? (
            <LoadingCards />
          ) : passes.isError ? (
            <EmptyState
              title="We could not read your passes"
              description={passes.error instanceof Error ? passes.error.message : "The Monad RPC did not respond."}
              action={
                <Button variant="secondary" onClick={() => passes.refetch()}>
                  <RefreshCw className="size-4" /> Retry
                </Button>
              }
            />
          ) : passes.data?.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {passes.data.map((item) => <PassCard key={item.id.toString()} item={item} />)}
            </div>
          ) : (
            <EmptyState
              title="No passes in this wallet yet"
              description="Ask a participating place to issue a pass to this wallet address. It will appear here after the transaction confirms."
              action={
                <Link href="/issuer" className="text-sm font-bold text-violet underline underline-offset-4">
                  Are you an issuer?
                </Link>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
