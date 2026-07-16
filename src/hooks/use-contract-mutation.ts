"use client";

import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAccount,
  usePublicClient,
  useWriteContract,
  useWriteContractSync,
} from "wagmi";
import type {
  ContractFunctionArgs,
  ContractFunctionName,
  Hex,
  TransactionReceipt,
} from "viem";
import { useToast } from "@/components/toast-provider";
import { uniskyPassAbi } from "@/lib/chain/abi";
import {
  assertExpectedRpcChain,
  contractAddress,
  expectedChainId,
  networkConfigurationError,
} from "@/lib/chain/config";
import {
  explainWalletError,
  isDefinitiveSubmissionFailure,
  isSyncMethodUnsupported,
} from "@/lib/chain/errors";
import { formatGasCost } from "@/lib/chain/format";

type WriteName = ContractFunctionName<typeof uniskyPassAbi, "nonpayable">;

type ExecuteOptions<TName extends WriteName> = {
  functionName: TName;
  args: ContractFunctionArgs<
    typeof uniskyPassAbi,
    "nonpayable",
    TName
  >;
  pendingTitle: string;
  successTitle: string;
};

export function useContractMutation() {
  const notify = useToast();
  const queryClient = useQueryClient();
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient({ chainId: expectedChainId });
  const syncMutation = useWriteContractSync();
  const standardMutation = useWriteContract();
  const [gasQuote, setGasQuote] = useState<{
    gasLimit: bigint;
    gasPrice: bigint;
    formatted: string;
  }>();
  const [lastError, setLastError] = useState<string>();
  const [preflightPending, setPreflightPending] = useState(false);
  const inFlightRef = useRef(false);
  const confirmationUncertainRef = useRef(false);

  const execute = useCallback(
    async <TName extends WriteName>({
      functionName,
      args,
      pendingTitle,
      successTitle,
    }: ExecuteOptions<TName>): Promise<TransactionReceipt> => {
      setLastError(undefined);
      if (confirmationUncertainRef.current) {
        const message =
          "A previous transaction may already be onchain. Check your wallet activity and the block explorer, then reload this page before submitting again.";
        setLastError(message);
        notify({
          title: "Check the previous transaction",
          description: message,
          tone: "error",
        });
        throw new Error(message);
      }
      if (inFlightRef.current) {
        throw new Error("A transaction is already being prepared.");
      }
      inFlightRef.current = true;
      setPreflightPending(true);
      let submissionAttempted = false;
      let submittedHash: Hex | undefined;
      let receiptObserved = false;
      try {
        if (networkConfigurationError) throw new Error(networkConfigurationError);
        if (!contractAddress) {
          throw new Error("The Unisky Pass contract address is not configured yet.");
        }
        if (!address) throw new Error("Connect your wallet first.");
        if (chainId !== expectedChainId) {
          throw new Error("Switch to the required Monad network first.");
        }
        if (!publicClient) throw new Error("Monad RPC is unavailable.");

        await assertExpectedRpcChain(publicClient);
        await publicClient.simulateContract({
          address: contractAddress,
          abi: uniskyPassAbi,
          functionName,
          args: args as never,
          account: address,
        });

        const estimate = await publicClient.estimateContractGas({
          address: contractAddress,
          abi: uniskyPassAbi,
          functionName,
          args: args as never,
          account: address,
        });
        const gasLimit = estimate + estimate / 10n;
        const fees = await publicClient.estimateFeesPerGas();
        const gasPrice = fees.maxFeePerGas;
        setGasQuote({
          gasLimit,
          gasPrice,
          formatted: formatGasCost(gasLimit, gasPrice),
        });

        notify({
          title: pendingTitle,
          description: `Maximum network cost: ${formatGasCost(gasLimit, gasPrice)}. Confirm in your wallet.`,
          tone: "info",
        });

        let receipt: TransactionReceipt;
        try {
          submissionAttempted = true;
          receipt = await syncMutation.mutateAsync(
            {
              address: contractAddress,
              abi: uniskyPassAbi,
              functionName,
              args: args as never,
              account: address,
              chainId: expectedChainId,
              gas: gasLimit,
              throwOnReceiptRevert: true,
              timeout: 20_000,
            } as never,
          );
          receiptObserved = true;
        } catch (syncError) {
          if (!isSyncMethodUnsupported(syncError)) throw syncError;
          submissionAttempted = true;
          submittedHash = await standardMutation.mutateAsync(
            {
              address: contractAddress,
              abi: uniskyPassAbi,
              functionName,
              args: args as never,
              account: address,
              chainId: expectedChainId,
              gas: gasLimit,
            } as never,
          );
          submissionAttempted = true;
          receipt = await publicClient.waitForTransactionReceipt({
            hash: submittedHash,
            confirmations: 1,
            timeout: 30_000,
          });
          receiptObserved = true;
          if (receipt.status !== "success") {
            throw new Error("The transaction reverted onchain.");
          }
        }

        notify({
          title: successTitle,
          description: "Confirmed on Monad.",
          tone: "success",
        });
        await queryClient
          .invalidateQueries({ queryKey: ["unisky"] })
          .catch(() => undefined);
        return receipt;
      } catch (error) {
        const confirmationUnknown =
          !receiptObserved &&
          (Boolean(submittedHash) ||
            (submissionAttempted && !isDefinitiveSubmissionFailure(error)));
        if (confirmationUnknown) confirmationUncertainRef.current = true;
        const message = confirmationUnknown
          ? `The wallet or RPC did not return a definitive receipt, so the transaction may already be onchain. Do not submit it again until you check your wallet activity and the block explorer.${submittedHash ? ` Transaction hash: ${submittedHash}` : ""}`
          : explainWalletError(error);
        setLastError(message);
        notify({
          title: confirmationUnknown
            ? "Confirmation status unknown"
            : "Transaction failed",
          description: message,
          tone: "error",
        });
        throw error;
      } finally {
        inFlightRef.current = false;
        setPreflightPending(false);
      }
    },
    [
      address,
      chainId,
      notify,
      publicClient,
      queryClient,
      standardMutation,
      syncMutation,
    ],
  );

  return {
    execute,
    gasQuote,
    lastError,
    isPending:
      preflightPending || syncMutation.isPending || standardMutation.isPending,
  };
}
