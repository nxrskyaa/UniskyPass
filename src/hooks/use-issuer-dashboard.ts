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
  normalizeIssuer,
  normalizePass,
  normalizeProgram,
  type IssuedPass,
  type IssuerProgram,
  type IssuerRecord,
} from "@/lib/chain/records";

export type IssuerDashboardData = {
  issuer: IssuerRecord;
  programs: IssuerProgram[];
  passes: IssuedPass[];
};

export function useIssuerDashboard(issuerAddress?: Address) {
  const publicClient = usePublicClient({ chainId: expectedChainId });

  return useQuery({
    queryKey: [
      "unisky",
      "issuer-dashboard",
      expectedChainId,
      contractAddress,
      issuerAddress,
    ],
    enabled: Boolean(
      publicClient && contractAddress && issuerAddress && !networkConfigurationError,
    ),
    refetchInterval: 12_000,
    queryFn: async (): Promise<IssuerDashboardData> => {
      if (!publicClient || !contractAddress || !issuerAddress) {
        return {
          issuer: { name: "", registeredAt: 0n, exists: false },
          programs: [],
          passes: [],
        };
      }
      await assertExpectedRpcChain(publicClient);
      const registry = contractAddress;

      const [rawIssuer, rawProgramIds] = await Promise.all([
        publicClient.readContract({
          address: registry,
          abi: uniskyPassAbi,
          functionName: "getIssuer",
          args: [issuerAddress],
        }),
        publicClient.readContract({
          address: registry,
          abi: uniskyPassAbi,
          functionName: "getIssuerPrograms",
          args: [issuerAddress],
        }),
      ]);
      const programIds = rawProgramIds as readonly bigint[];

      if (programIds.length === 0) {
        return { issuer: normalizeIssuer(rawIssuer), programs: [], passes: [] };
      }

      const [rawPrograms, passIdLists] = await Promise.all([
        publicClient.multicall({
          allowFailure: false,
          contracts: programIds.map((programId) => ({
            address: registry,
            abi: uniskyPassAbi,
            functionName: "getProgram" as const,
            args: [programId] as const,
          })),
        }),
        publicClient.multicall({
          allowFailure: false,
          contracts: programIds.map((programId) => ({
            address: registry,
            abi: uniskyPassAbi,
            functionName: "getProgramPasses" as const,
            args: [programId] as const,
          })),
        }),
      ]);

      const typedPassIdLists = passIdLists as readonly (readonly bigint[])[];
      const programs: IssuerProgram[] = programIds.map((id, index) => ({
        id,
        program: normalizeProgram(rawPrograms[index]),
        passIds: typedPassIdLists[index] ?? [],
      }));
      const passIds = typedPassIdLists.flat();
      if (passIds.length === 0) {
        return { issuer: normalizeIssuer(rawIssuer), programs, passes: [] };
      }

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
      const programNames = new Map(
        programs.map(({ id, program }) => [id.toString(), program.name]),
      );

      return {
        issuer: normalizeIssuer(rawIssuer),
        programs,
        passes: passIds.map((id, index) => {
          const pass = normalizePass(rawPasses[index]);
          return {
            id,
            pass,
            status: Number(rawStatuses[index]) as PassStatusCode,
            programName: programNames.get(pass.programId.toString()) ?? "Program",
          };
        }),
      };
    },
  });
}
