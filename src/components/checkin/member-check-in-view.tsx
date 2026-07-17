"use client";

import { Check, CircleAlert, PenLine, RefreshCw, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { ContractSetupNotice } from "@/components/contract-setup-notice";
import { Countdown } from "@/components/countdown";
import { EmptyState } from "@/components/empty-state";
import { useNetwork } from "@/components/network-provider";
import { PageIntro } from "@/components/page-intro";
import { QrCodeDisplay } from "@/components/qr-code-display";
import { QrScanner } from "@/components/qr-scanner";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { WalletButton } from "@/components/wallet-button";
import { buildCheckInTypedData, CHECK_IN_FAILURE_MESSAGES } from "@/lib/checkin";
import { explainWalletError } from "@/lib/chain/errors";
import { formatDate } from "@/lib/chain/format";
import { decodeCheckInChallenge, encodeCheckInResponse } from "@/lib/qr";
import { useMemberPasses } from "@/hooks/use-member-passes";
import type { CheckInChallenge } from "@/types/checkin";

export function MemberCheckInView({ preferredPassId }: { preferredPassId?: string }) {
  const { address, isConnected, chainId } = useAccount();
  const { deployment, selectedChainId } = useNetwork();
  const contractAddress = deployment.contractAddress;
  const networkConfigurationError = deployment.configurationError;
  const passes = useMemberPasses(address);
  const signMutation = useSignTypedData();
  const [challenge, setChallenge] = useState<CheckInChallenge>();
  const [selectedPassId, setSelectedPassId] = useState(preferredPassId ?? "");
  const [responsePayload, setResponsePayload] = useState<string>();
  const [error, setError] = useState<string>();

  const eligiblePasses = useMemo(() => {
    if (!challenge || !passes.isSuccess) return [];
    return (passes.data ?? []).filter(
      (item) =>
        item.status === 2 &&
        item.pass.programId === challenge.programId &&
        item.pass.issuer.toLowerCase() === challenge.issuer.toLowerCase(),
    );
  }, [challenge, passes.data, passes.isSuccess]);
  const chosenId = eligiblePasses.some(({ id }) => id.toString() === selectedPassId)
    ? selectedPassId
    : (eligiblePasses[0]?.id.toString() ?? "");
  const chosenPass = eligiblePasses.find(({ id }) => id.toString() === chosenId);
  const expired = error === CHECK_IN_FAILURE_MESSAGES.CHALLENGE_EXPIRED;

  function reset() {
    setChallenge(undefined);
    setResponsePayload(undefined);
    setError(undefined);
  }

  return (
    <div className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <PageIntro
          eyebrow="Member check-in"
          title="Prove your membership"
          description="Scan the place’s temporary challenge, choose the matching pass, and sign. This check-in never sends a transaction."
        />
        <div className="mt-6"><ContractSetupNotice /></div>

        <div className="mt-7">
          {!isConnected ? (
            <EmptyState title="Connect the pass holder wallet" description="The signature must come from the same wallet that holds the membership pass." action={<WalletButton />} />
          ) : networkConfigurationError ? (
            <EmptyState title="Network configuration is invalid" description={networkConfigurationError} />
          ) : chainId !== selectedChainId ? (
            <EmptyState title="Wrong network" description={`Switch your wallet to ${deployment.chain.name} before scanning a challenge.`} />
          ) : !contractAddress ? (
            <EmptyState title="Check-in is waiting for the contract deployment" description="A registry address must be configured so the QR proof can bind to the correct contract." />
          ) : responsePayload && challenge && chosenPass ? (
            <Card className="mx-auto max-w-2xl border-success/40">
              <CardHeader className="text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-success bg-success/10 text-success"><Check className="size-6" /></span>
                <h2 className="mt-4 text-2xl font-black tracking-tight">Response ready</h2>
                <p className="mt-2 text-sm leading-6 text-ink-soft">Show this QR to the issuer’s scanner before the countdown reaches zero.</p>
                <div className="mt-3"><Countdown expiresAt={challenge.expiresAt} onExpire={() => setError(CHECK_IN_FAILURE_MESSAGES.CHALLENGE_EXPIRED)} /></div>
              </CardHeader>
              <CardBody>
                <QrCodeDisplay value={responsePayload} label="Signed Unisky Pass check-in response" />
                <div className="mt-6 rounded-xl border border-line bg-paper p-4 text-sm">
                  <div className="flex items-center justify-between gap-4"><span className="text-ink-soft">Pass</span><span className="font-bold">{chosenPass.program.name} · #{chosenPass.id.toString()}</span></div>
                  <div className="mt-2 flex items-center justify-between gap-4"><span className="text-ink-soft">Expires</span><span className="font-semibold">{formatDate(BigInt(challenge.expiresAt))}</span></div>
                </div>
                {error ? <p role="alert" className="mt-4 text-center text-sm font-medium text-danger">{error}</p> : null}
                <Button variant="secondary" className="mt-5 w-full" onClick={reset}><RefreshCw className="size-4" /> Scan another challenge</Button>
              </CardBody>
            </Card>
          ) : !challenge ? (
            <Card className="mx-auto max-w-2xl">
              <CardHeader>
                <h2 className="text-xl font-black tracking-tight">1. Scan the issuer challenge</h2>
                <p className="mt-1 text-sm leading-6 text-ink-soft">The challenge is unique to this issuer, program, contract, and one-minute window.</p>
              </CardHeader>
              <CardBody>
                <QrScanner
                  prompt="Point the camera at the issuer’s challenge"
                  onCameraDenied={() => setError(CHECK_IN_FAILURE_MESSAGES.CAMERA_PERMISSION_DENIED)}
                  onResult={(value) => {
                    const registryAddress = contractAddress;
                    if (!registryAddress) {
                      setError(CHECK_IN_FAILURE_MESSAGES.CONTRACT_READ_FAILED);
                      return;
                    }
                    try {
                      const decoded = decodeCheckInChallenge(value);
                      if (decoded.chainId !== selectedChainId) {
                        setError(CHECK_IN_FAILURE_MESSAGES.WRONG_NETWORK);
                        return;
                      }
                      if (decoded.contractAddress.toLowerCase() !== registryAddress.toLowerCase()) {
                        setError(CHECK_IN_FAILURE_MESSAGES.WRONG_CONTRACT);
                        return;
                      }
                      if (Math.floor(Date.now() / 1_000) >= decoded.expiresAt) {
                        setError(CHECK_IN_FAILURE_MESSAGES.CHALLENGE_EXPIRED);
                        return;
                      }
                      setChallenge(decoded);
                      setResponsePayload(undefined);
                      setError(undefined);
                    } catch {
                      setError(CHECK_IN_FAILURE_MESSAGES.QR_PAYLOAD_INVALID);
                    }
                  }}
                />
                {error ? <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-danger/25 bg-danger/8 p-3 text-sm font-medium text-danger"><CircleAlert className="mt-0.5 size-4 shrink-0" /> {error}</p> : null}
              </CardBody>
            </Card>
          ) : (
            <Card className="mx-auto max-w-2xl">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black tracking-tight">2. Choose a pass and sign</h2>
                    <p className="mt-1 text-sm leading-6 text-ink-soft">A signature proves wallet control. It is free and does not change contract state.</p>
                  </div>
                  <Countdown expiresAt={challenge.expiresAt} onExpire={() => setError(CHECK_IN_FAILURE_MESSAGES.CHALLENGE_EXPIRED)} />
                </div>
              </CardHeader>
              <CardBody>
                {passes.isPending ? (
                  <div className="h-28 animate-pulse rounded-xl bg-paper-deep" />
                ) : passes.isError ? (
                  <div className="rounded-xl border border-danger/25 bg-danger/8 p-4 text-sm leading-6 text-danger">
                    <p className="font-semibold">The pass registry could not be read.</p>
                    <p className="mt-1">{passes.error instanceof Error ? passes.error.message : "The Monad RPC did not respond."}</p>
                    <Button variant="secondary" size="sm" className="mt-3" onClick={() => passes.refetch()}>
                      <RefreshCw className="size-4" /> Retry
                    </Button>
                  </div>
                ) : eligiblePasses.length === 0 ? (
                  <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm leading-6 text-warning">
                    No active pass in this wallet matches the challenge’s issuer and program.
                  </div>
                ) : (
                  <>
                    <label htmlFor="eligible-pass" className="mb-2 block text-sm font-semibold">Eligible pass</label>
                    <Select id="eligible-pass" value={chosenId} onChange={(event) => setSelectedPassId(event.target.value)}>
                      {eligiblePasses.map((item) => <option key={item.id.toString()} value={item.id.toString()}>{item.program.name} · Pass #{item.id.toString()}</option>)}
                    </Select>
                    {chosenPass ? (
                      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-line bg-paper p-4">
                        <div>
                          <p className="font-bold">{chosenPass.program.name}</p>
                          <p className="mt-1 text-xs text-ink-soft">Valid until {formatDate(chosenPass.pass.expiresAt)}</p>
                        </div>
                        <StatusBadge status={chosenPass.status} />
                      </div>
                    ) : null}
                  </>
                )}
                {error ? <p role="alert" className="mt-4 text-sm font-medium text-danger">{error}</p> : null}
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    disabled={!passes.isSuccess || !chosenPass || expired || signMutation.isPending}
                    onClick={async () => {
                      if (!passes.isSuccess || !chosenPass || !address) return;
                      try {
                        const signature = await signMutation.mutateAsync(
                          buildCheckInTypedData({ challenge, passId: chosenPass.id, holder: address }),
                        );
                        setResponsePayload(
                          encodeCheckInResponse({
                            ...challenge,
                            passId: chosenPass.id,
                            holder: address,
                            signature,
                          }),
                        );
                        setError(undefined);
                      } catch (reason) {
                        setError(explainWalletError(reason));
                      }
                    }}
                  >
                    <PenLine className="size-4" /> {signMutation.isPending ? "Open your wallet…" : "Sign check-in proof"}
                  </Button>
                  <Button variant="quiet" onClick={reset}>Cancel</Button>
                </div>
                <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-ink-soft"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" /> The proof is bound to this issuer, program, holder, network, contract, nonce, and expiry.</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
