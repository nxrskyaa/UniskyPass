"use client";

import Link from "next/link";
import { CircleAlert, Layers3, QrCode, RefreshCw, TicketCheck, Users } from "lucide-react";
import { ContractSetupNotice } from "@/components/contract-setup-notice";
import { useNetwork } from "@/components/network-provider";
import { EmptyState } from "@/components/empty-state";
import { CreateProgramForm } from "@/components/issuer/create-program-form";
import { IssuedPassList } from "@/components/issuer/issued-pass-list";
import { IssuePassForm } from "@/components/issuer/issue-pass-form";
import { ProgramList } from "@/components/issuer/program-list";
import { RegisterIssuerForm } from "@/components/issuer/register-issuer-form";
import { PageIntro } from "@/components/page-intro";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WalletSessionNotice } from "@/components/wallet-session-notice";
import { formatDate } from "@/lib/chain/format";
import { useIssuerDashboard } from "@/hooks/use-issuer-dashboard";
import { useWalletSession } from "@/hooks/use-wallet-session";

export function IssuerDashboardView() {
  const { address, chainId, status: walletSessionStatus } =
    useWalletSession();
  const { deployment, selectedChainId } = useNetwork();
  const contractAddress = deployment.contractAddress;
  const networkConfigurationError = deployment.configurationError;
  const dashboard = useIssuerDashboard(address);
  const activePassCount = dashboard.data?.passes.filter(({ status }) => status === 2).length ?? 0;

  return (
    <div className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <PageIntro
          eyebrow="Issuer mode"
          title="Issuer Dashboard"
          description="Create time-based memberships and manage only the programs and passes issued by this wallet."
          action={
            dashboard.data?.issuer.exists ? (
              <Link href="/scanner" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink bg-ink px-4 text-sm font-bold text-white shadow-[3px_3px_0_var(--violet)]">
                <QrCode className="size-4" /> Open Scanner Mode
              </Link>
            ) : undefined
          }
        />

        <div className="mt-6"><ContractSetupNotice /></div>

        <div className="mt-7">
          {walletSessionStatus !== "ready" ? (
            <WalletSessionNotice
              status={walletSessionStatus}
              signedOutTitle="Connect the wallet that will issue passes"
              signedOutDescription="The contract has no platform admin. This wallet alone controls the programs and passes it creates."
            />
          ) : networkConfigurationError ? (
            <EmptyState title="Network configuration is invalid" description={networkConfigurationError} />
          ) : chainId !== selectedChainId ? (
            <EmptyState title="Switch to the required Monad network" description={`Switch your wallet to ${deployment.chain.name} before creating or managing memberships.`} />
          ) : !contractAddress ? (
            <EmptyState title="Issuer tools will unlock after contract deployment" description="Set the registry address for this environment to enable real onchain actions." />
          ) : dashboard.isPending ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl border border-line bg-white/65" />)}
            </div>
          ) : dashboard.isError ? (
            <EmptyState
              icon={<CircleAlert className="size-5" />}
              title="The issuer dashboard could not load"
              description={dashboard.error instanceof Error ? dashboard.error.message : "The Monad RPC did not respond."}
              action={<Button variant="secondary" onClick={() => dashboard.refetch()}><RefreshCw className="size-4" /> Retry</Button>}
            />
          ) : !dashboard.data?.issuer.exists ? (
            <RegisterIssuerForm />
          ) : (
            <div className="space-y-10">
              <div className="grid gap-4 lg:grid-cols-[1.2fr_repeat(3,.6fr)]">
                <Card className="border-ink bg-ink p-5 text-white lg:p-6">
                  <p className="font-mono text-xs font-bold tracking-[0.14em] text-lime uppercase">Registered issuer</p>
                  <h2 className="mt-3 text-2xl font-black tracking-tight">{dashboard.data.issuer.name}</h2>
                  <p className="mt-2 text-sm text-white/55">Since {formatDate(dashboard.data.issuer.registeredAt)}</p>
                </Card>
                {[
                  [Layers3, "Programs", dashboard.data.programs.length],
                  [TicketCheck, "All passes", dashboard.data.passes.length],
                  [Users, "Active now", activePassCount],
                ].map(([Icon, label, value]) => {
                  const MetricIcon = Icon as typeof Layers3;
                  return (
                    <Card key={String(label)} className="p-5">
                      <MetricIcon className="size-5 text-violet" />
                      <p className="mt-4 text-3xl font-black tracking-tight">{String(value)}</p>
                      <p className="mt-1 text-sm text-ink-soft">{String(label)}</p>
                    </Card>
                  );
                })}
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <CreateProgramForm />
                <IssuePassForm programs={dashboard.data.programs} />
              </div>

              <ProgramList programs={dashboard.data.programs} />

              {dashboard.data.passes.length > 0 ? (
                <IssuedPassList passes={dashboard.data.passes} />
              ) : dashboard.data.programs.length > 0 ? (
                <EmptyState title="No passes issued yet" description="Use the issue form above to send the first membership pass to a holder wallet." />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
