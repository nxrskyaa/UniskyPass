"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import type { Address } from "viem";
import { uniskyPassAbi } from "@/lib/chain/abi";
import {
  assertExpectedRpcChain,
  contractAddress,
  expectedChainId,
  networkConfigurationError,
} from "@/lib/chain/config";
import type { PassStatusCode } from "@/lib/chain/format";
import {
  normalizePass,
  normalizeProgram,
  type MemberPass,
} from "@/lib/chain/records";

export function useMemberPasses(holder?: Address) {
  const publicClient = usePublicClient({ chainId: expectedChainId });

  return useQuery({
    queryKey: ["unisky", "member-passes", expectedChainId, contractAddress, holder],
    enabled: Boolean(
      publicClient && contractAddress && holder && !networkConfigurationError,
    ),
    refetchInterval: 12_000,
    queryFn: async (): Promise<MemberPass[]> => {
      if (!publicClient || !contractAddress || !holder) return [];
      await assertExpectedRpcChain(publicClient);
      const registry = contractAddress;

      const passIds = (await publicClient.readContract({
        address: registry,
        abi: uniskyPassAbi,
        functionName: "getHolderPasses",
        args: [holder],
      })) as readonly bigint[];
      if (passIds.length === 0) return [];

      const [rawPasses, rawStatuses] = await Promise.all([
        publicClient.multicall({
          allowFailure: false,
          contracts: passIds.map((passId) => ({
            address: registry,
            abi: uniskyPassAbi,
            functionName: "getPass" as const,
            args: [passId] as const,
          })),
        }),
        publicClient.multicall({
          allowFailure: false,
          contracts: passIds.map((passId) => ({
            address: registry,
            abi: uniskyPassAbi,
            functionName: "getPassStatus" as const,
            args: [passId] as const,
          })),
        }),
      ]);

      const passes = rawPasses.map(normalizePass);
      const uniqueProgramIds = [
        ...new Set(passes.map((pass) => pass.programId.toString())),
      ].map(BigInt);
      const rawPrograms = await publicClient.multicall({
        allowFailure: false,
        contracts: uniqueProgramIds.map((programId) => ({
          address: registry,
          abi: uniskyPassAbi,
          functionName: "getProgram" as const,
          args: [programId] as const,
        })),
      });
      const programs = new Map(
        uniqueProgramIds.map((id, index) => [
          id.toString(),
          normalizeProgram(rawPrograms[index]),
        ]),
      );

      return passIds
        .map((id, index) => ({
          id,
          pass: passes[index],
          program: programs.get(passes[index].programId.toString()),
          status: Number(rawStatuses[index]) as PassStatusCode,
        }))
        .filter((item): item is MemberPass => Boolean(item.pass && item.program));
    },
  });
}
