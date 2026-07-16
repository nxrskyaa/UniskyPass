"use client";

import { useCallback } from "react";
import { usePublicClient } from "wagmi";
import { BaseError, ContractFunctionRevertedError } from "viem";
import { uniskyPassAbi } from "@/lib/chain/abi";
import {
  assertExpectedRpcChain,
  contractAddress,
  expectedChainId,
} from "@/lib/chain/config";
import { normalizePass } from "@/lib/chain/records";
import type { FreshPassReader } from "@/types/checkin";

function isPassNotFound(error: unknown) {
  if (!(error instanceof BaseError)) return false;
  const reverted = error.walk(
    (candidate) => candidate instanceof ContractFunctionRevertedError,
  );
  return (
    reverted instanceof ContractFunctionRevertedError &&
    reverted.data?.errorName === "PassNotFound"
  );
}

export function useFreshPassReader(): FreshPassReader {
  const publicClient = usePublicClient({ chainId: expectedChainId });

  return useCallback(
    async (query) => {
      if (!publicClient || !contractAddress) {
        throw new Error("Monad contract client is unavailable.");
      }
      await assertExpectedRpcChain(publicClient);
      const registry = contractAddress;
      const block = await publicClient.getBlock({ blockTag: "latest" });
      const [passResult, validResult] = await Promise.allSettled([
        publicClient.readContract({
          address: registry,
          abi: uniskyPassAbi,
          functionName: "getPass",
          args: [query.passId],
          blockNumber: block.number,
        }),
        publicClient.readContract({
          address: registry,
          abi: uniskyPassAbi,
          functionName: "isPassValidFor",
          args: [query.passId, query.holder, query.issuer, query.programId],
          blockNumber: block.number,
        }),
      ]);

      if (validResult.status === "rejected") throw validResult.reason;
      if (passResult.status === "rejected") {
        if (isPassNotFound(passResult.reason)) {
          return {
            pass: null,
            isPassValidFor: Boolean(validResult.value),
            chainTimestamp: block.timestamp,
          };
        }
        throw passResult.reason;
      }

      return {
        pass: normalizePass(passResult.value),
        isPassValidFor: Boolean(validResult.value),
        chainTimestamp: block.timestamp,
      };
    },
    [publicClient],
  );
}
