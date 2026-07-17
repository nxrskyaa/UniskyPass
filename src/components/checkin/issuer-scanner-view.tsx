"use client";

import { CheckCircle2, CircleAlert, QrCode, RefreshCw, ScanLine, ShieldCheck } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";
import { ContractSetupNotice } from "@/components/contract-setup-notice";
import { Countdown } from "@/components/countdown";
import { EmptyState } from "@/components/empty-state";
import { useNetwork } from "@/components/network-provider";
import { PageIntro } from "@/components/page-intro";
import { QrCodeDisplay } from "@/components/qr-code-display";
import { QrScanner } from "@/components/qr-scanner";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/field";
import { WalletButton } from "@/components/wallet-button";
import {
  CHECK_IN_FAILURE_MESSAGES,
  createCheckInChallenge,
  createSessionNonceLedger,
  verifyCheckInResponse,
  type CheckInVerificationResult,
} from "@/lib/checkin";
import { formatDate, shortenAddress } from "@/lib/chain/format";
import { wagmiConfig } from "@/lib/chain/config";
import { USED_CHECK_IN_NONCES_STORAGE_KEY } from "@/lib/checkin/nonce-ledger";
import { encodeCheckInChallenge } from "@/lib/qr";
import { useFreshPassReader } from "@/hooks/use-fresh-pass-reader";
import { useIssuerDashboard } from "@/hooks/use-issuer-dashboard";
import type { CheckInChallenge } from "@/types/checkin";

export function IssuerScannerView({ preferredProgramId }: { preferredProgramId?: string }) {
  const { address, isConnected, chainId } = useAccount();
  return (
    <IssuerScannerSession
      key={`${address ?? "disconnected"}:${chainId ?? "no-chain"}`}
      preferredProgramId={preferredProgramId}
      address={address}
      isConnected={isConnected}
      chainId={chainId}
    />
  );
}

function IssuerScannerSession({
  preferredProgramId,
  address,
  isConnected,
  chainId,
}: {
  preferredProgramId?: string;
  address?: Address;
  isConnected: boolean;
  chainId?: number;
}) {
  const { deployment, selectedChainId } = useNetwork();
  const contractAddress = deployment.contractAddress;
  const networkConfigurationError = deployment.configurationError;
  const dashboard = useIssuerDashboard(address);
  const readFreshPass = useFreshPassReader();
  const [programId, setProgramId] = useState(preferredProgramId ?? "");
  const [challenge, setChallenge] = useState<CheckInChallenge>();
  const [challengePayload, setChallengePayload] = useState<string>();
  const [result, setResult] = useState<CheckInVerificationResult>();
  const [verifying, setVerifying] = useState(false);
  const verifyingRef = useRef(false);
  const sessionGenerationRef = useRef(0);
  const [ledger] = useState(() =>
    createSessionNonceLedger(
      undefined,
      `${USED_CHECK_IN_NONCES_STORAGE_KEY}:${selectedChainId}:${contractAddress ?? "unconfigured"}`,
    ),
  );

  const programs = useMemo(
    () => dashboard.data?.programs ?? [],
    [dashboard.data?.programs],
  );
  const chosenProgramId = programs.some(({ id }) => id.toString() === programId)
    ? programId
    : (programs[0]?.id.toString() ?? "");
  const chosenProgram = programs.find(({ id }) => id.toString() === chosenProgramId);
  const successProgramName = useMemo(() => {
    if (!result?.valid) return "Membership";
    return programs.find(({ id }) => id === result.response.programId)?.program.name ?? "Membership";
  }, [programs, result]);

  function generateChallenge() {
    if (verifyingRef.current || !address || !contractAddress || !chosenProgramId) return;
    sessionGenerationRef.current += 1;
    const next = createCheckInChallenge({
      issuer: address,
      programId: BigInt(chosenProgramId),
      chainId: selectedChainId,
      contractAddress,
    });
    setChallenge(next);
    setChallengePayload(encodeCheckInChallenge(next));
    setResult(undefined);
  }

  function resetChallenge() {
    if (verifyingRef.current) return;
    sessionGenerationRef.current += 1;
    setChallenge(undefined);
    setChallengePayload(undefined);
    setResult(undefined);
  }

  return (
    <div className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <PageIntro
          eyebrow="Issuer scanner"
          title="Verify at the door"
          description="Create a one-minute challenge, scan the member's signed response, then verify the latest contract state before granting access."
        />
        <div className="mt-6"><ContractSetupNotice /></div>

        <div className="mt-7">
          {!isConnected ? (
            <EmptyState title="Connect the issuer wallet" description="Only the wallet that owns the selected program can run its scanner session." action={<WalletButton />} />
          ) : networkConfigurationError ? (
            <EmptyState title="Network configuration is invalid" description={networkConfigurationError} />
          ) : chainId !== selectedChainId ? (
            <EmptyState title="Wrong network" description={`Switch your wallet to ${deployment.chain.name} before generating a challenge.`} />
          ) : !contractAddress ? (
            <EmptyState title="Scanner Mode needs the deployed contract" description="Set the registry address so every proof is bound to the correct contract." />
          ) : dashboard.isPending ? (
            <div className="h-64 animate-pulse rounded-2xl border border-line bg-white/65" />
          ) : dashboard.isError ? (
            <EmptyState
              title="The issuer programs could not be read"
              description={dashboard.error instanceof Error ? dashboard.error.message : "The Monad RPC did not respond."}
              action={<Button variant="secondary" onClick={() => dashboard.refetch()}><RefreshCw className="size-4" /> Retry</Button>}
            />
          ) : !dashboard.data?.issuer.exists ? (
            <EmptyState title="Register as an issuer first" description="Create an issuer profile and at least one program before opening Scanner Mode." />
          ) : programs.length === 0 ? (
            <EmptyState title="Create a pass program first" description="Scanner challenges are bound to one of your membership programs." />
          ) : !challenge || !challengePayload ? (
            <Card className="mx-auto max-w-2xl border-ink">
              <CardHeader>
                <div className="grid size-12 place-items-center rounded-2xl border border-ink bg-lime shadow-[3px_3px_0_var(--ink)]"><QrCode className="size-5" /></div>
                <h2 className="mt-5 text-2xl font-black tracking-tight">Start a scanner session</h2>
                <p className="mt-2 text-sm leading-6 text-ink-soft">Choose the program at this door. Each challenge is random and expires after exactly 60 seconds.</p>
              </CardHeader>
              <CardBody>
                <Label htmlFor="scanner-program">Program to verify</Label>
                <Select id="scanner-program" value={chosenProgramId} onChange={(event) => setProgramId(event.target.value)}>
                  {programs.map(({ id, program }) => <option key={id.toString()} value={id.toString()}>{program.name}{program.active ? "" : " (issuance paused)"}</option>)}
                </Select>
                <Button className="mt-5" onClick={generateChallenge}><ScanLine className="size-4" /> Generate 60-second challenge</Button>
              </CardBody>
            </Card>
          ) : (
            <>
              {result ? (
                <Card className={`mb-5 border-2 ${result.valid ? "border-success bg-success/6" : "border-danger bg-danger/5"}`}>
                  <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      {result.valid ? <CheckCircle2 className="mt-0.5 size-7 shrink-0 text-success" /> : <CircleAlert className="mt-0.5 size-7 shrink-0 text-danger" />}
                      <div>
                        <p className={`font-mono text-xs font-black tracking-[0.14em] ${result.valid ? "text-success" : "text-danger"}`}>{result.code}</p>
                        <h2 className="mt-1 text-2xl font-black tracking-tight">
                          {result.valid ? `VALID MEMBER — ${successProgramName}` : result.message}
                        </h2>
                        {result.valid ? (
                          <p className="mt-2 text-sm leading-6 text-ink-soft">
                            Holder verified · Membership active · Expires {formatDate(result.pass.expiresAt)} · {shortenAddress(result.signer)}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm leading-6 text-ink-soft">Access was not approved. Resolve this specific failure before retrying.</p>
                        )}
                      </div>
                    </div>
                    <Button variant={result.valid ? "primary" : "secondary"} onClick={generateChallenge} disabled={verifying}><RefreshCw className="size-4" /> New member</Button>
                  </CardBody>
                </Card>
              ) : null}

              <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-xs font-bold text-violet uppercase">Step 1</p>
                        <h2 className="mt-2 text-xl font-black tracking-tight">Member scans this challenge</h2>
                        <p className="mt-1 text-sm text-ink-soft">{chosenProgram?.program.name}</p>
                      </div>
                      <Countdown expiresAt={challenge.expiresAt} />
                    </div>
                  </CardHeader>
                  <CardBody>
                    <QrCodeDisplay value={challengePayload} label="Unisky Pass issuer check-in challenge" />
                    <Button variant="quiet" className="mt-4 w-full" onClick={resetChallenge} disabled={verifying}>Change program</Button>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <p className="font-mono text-xs font-bold text-violet uppercase">Step 2</p>
                    <h2 className="mt-2 text-xl font-black tracking-tight">Scan the member response</h2>
                    <p className="mt-1 text-sm leading-6 text-ink-soft">A VALID result appears only after signature recovery and fresh same-block contract reads.</p>
                  </CardHeader>
                  <CardBody>
                    <QrScanner
                      prompt={verifying ? "Checking fresh membership state…" : "Point the camera at the member's response"}
                      onCameraDenied={() => setResult({ valid: false, code: "CAMERA_PERMISSION_DENIED", message: CHECK_IN_FAILURE_MESSAGES.CAMERA_PERMISSION_DENIED })}
                      onResult={async (encodedResponse) => {
                        if (verifyingRef.current || !address || chainId === undefined || !contractAddress) return;
                        const verificationGeneration = sessionGenerationRef.current;
                        verifyingRef.current = true;
                        setVerifying(true);
                        try {
                          const nextResult = await verifyCheckInResponse({
                            encodedResponse,
                            activeChallenge: challenge,
                            scannerAddress: address,
                            scannerChainId: chainId,
                            expectedChainId: selectedChainId,
                            contractAddress,
                            nonceLedger: ledger,
                            readFreshPass,
                          });
                          const currentConnection = wagmiConfig.state.current
                            ? wagmiConfig.state.connections.get(wagmiConfig.state.current)
                            : undefined;
                          const sameWalletAndChain =
                            currentConnection?.chainId === chainId &&
                            currentConnection.accounts[0]?.toLowerCase() ===
                              address.toLowerCase();
                          if (
                            sameWalletAndChain &&
                            verificationGeneration === sessionGenerationRef.current
                          ) {
                            setResult(nextResult);
                          }
                        } finally {
                          verifyingRef.current = false;
                          setVerifying(false);
                        }
                      }}
                    />
                    {verifying ? <p className="mt-4 text-center text-sm font-semibold text-violet">Recovering signer and reading the latest Monad block…</p> : null}
                    <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-ink-soft"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" /> Used challenges are remembered in this browser session to prevent replay.</p>
                  </CardBody>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
