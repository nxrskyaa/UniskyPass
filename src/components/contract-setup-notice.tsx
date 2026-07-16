import { CircleAlert, ExternalLink } from "lucide-react";
import {
  contractAddress,
  contractConfigurationError,
  expectedChain,
  expectedExplorerUrl,
} from "@/lib/chain/config";
import { shortenAddress } from "@/lib/chain/format";

export function ContractSetupNotice() {
  if (contractAddress && !contractConfigurationError) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-success/25 bg-success/8 px-3.5 py-2.5 text-sm text-success">
        <span className="size-2 rounded-full bg-success" aria-hidden />
        <span className="font-semibold">Live on {expectedChain.name}</span>
        <a
          href={`${expectedExplorerUrl}/address/${contractAddress}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-mono underline underline-offset-2"
        >
          {shortenAddress(contractAddress)} <ExternalLink className="size-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-warning/35 bg-warning/10 p-4 text-sm leading-6 text-warning">
      <div className="flex items-start gap-2">
        <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div>
          <p className="font-bold">Contract deployment is not connected yet</p>
          <p className="mt-1">
            {contractConfigurationError ??
              "The interface is ready, but onchain actions stay disabled until NEXT_PUBLIC_UNISKY_PASS_CONTRACT_ADDRESS is set."}
          </p>
        </div>
      </div>
    </div>
  );
}
