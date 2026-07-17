"use client";

import {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount, useSwitchChain } from "wagmi";
import {
  SELECTED_NETWORK_STORAGE_KEY,
  defaultChainId,
  getDeployment,
  isSupportedChainId,
  type MonadDeployment,
  type SupportedChainId,
} from "@/lib/chain/config";

type NetworkContextValue = {
  selectedChainId: SupportedChainId;
  deployment: MonadDeployment;
  walletChainId: number | undefined;
  isWalletOnSelectedChain: boolean;
  isSwitching: boolean;
  switchError: string | undefined;
  transactionGuard: "idle" | "active" | "uncertain";
  beginTransaction: () => void;
  finishTransaction: (confirmationUncertain: boolean) => void;
  selectNetwork: (chainId: SupportedChainId) => Promise<void>;
};

const NetworkContext = createContext<NetworkContextValue | undefined>(
  undefined,
);

function readStoredChainId(): SupportedChainId | undefined {
  try {
    const stored = Number(globalThis.localStorage.getItem(SELECTED_NETWORK_STORAGE_KEY));
    return isSupportedChainId(stored) ? stored : undefined;
  } catch {
    return undefined;
  }
}

function persistChainId(chainId: SupportedChainId) {
  try {
    globalThis.localStorage.setItem(
      SELECTED_NETWORK_STORAGE_KEY,
      String(chainId),
    );
  } catch {
    // Network preference remains valid for this page lifetime if storage is blocked.
  }
}

export function NetworkProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { address, chainId: walletChainId, isConnected } = useAccount();
  const {
    switchChainAsync,
    isPending: isSwitching,
    error,
    reset,
  } = useSwitchChain();
  const [selectedChainId, setSelectedChainId] =
    useState<SupportedChainId>(defaultChainId);
  const transactionGuardRef = useRef<"idle" | "active" | "uncertain">(
    "idle",
  );
  const [transactionGuard, setTransactionGuard] =
    useState<"idle" | "active" | "uncertain">("idle");

  useEffect(() => {
    const stored = readStoredChainId();
    if (stored !== undefined) {
      setSelectedChainId((current) =>
        stored === current ? current : stored,
      );
    }
  }, []);

  const beginTransaction = useCallback(() => {
    if (transactionGuardRef.current === "uncertain") {
      throw new Error(
        "A previous transaction may already be onchain. Check the block explorer and reload before submitting another transaction.",
      );
    }
    if (transactionGuardRef.current === "active") {
      throw new Error("Another transaction is already being prepared.");
    }

    transactionGuardRef.current = "active";
    setTransactionGuard("active");
  }, []);

  const finishTransaction = useCallback((confirmationUncertain: boolean) => {
    const nextGuard = confirmationUncertain ? "uncertain" : "idle";
    transactionGuardRef.current = nextGuard;
    setTransactionGuard(nextGuard);
  }, []);

  const selectNetwork = useCallback(
    async (nextChainId: SupportedChainId) => {
      if (!isSupportedChainId(nextChainId)) {
        throw new Error("Unsupported Monad network selection.");
      }
      if (transactionGuardRef.current === "active") {
        throw new Error(
          "Wait for the current transaction to finish before changing networks.",
        );
      }
      if (transactionGuardRef.current === "uncertain") {
        throw new Error(
          "A transaction may already be onchain. Check the block explorer and reload before changing networks.",
        );
      }

      reset();

      if (isConnected && walletChainId !== nextChainId) {
        await switchChainAsync({ chainId: nextChainId });
      }

      if (selectedChainId === nextChainId) return;

      await queryClient.cancelQueries({ queryKey: ["unisky"] });
      queryClient.removeQueries({ queryKey: ["unisky"] });
      persistChainId(nextChainId);
      setSelectedChainId(nextChainId);
    },
    [
      isConnected,
      queryClient,
      reset,
      selectedChainId,
      switchChainAsync,
      walletChainId,
    ],
  );

  const deployment = getDeployment(selectedChainId);
  const value = useMemo<NetworkContextValue>(
    () => ({
      selectedChainId,
      deployment,
      walletChainId,
      isWalletOnSelectedChain:
        !isConnected || walletChainId === selectedChainId,
      isSwitching,
      switchError: error instanceof Error ? error.message : undefined,
      transactionGuard,
      beginTransaction,
      finishTransaction,
      selectNetwork,
    }),
    [
      deployment,
      beginTransaction,
      error,
      finishTransaction,
      isConnected,
      isSwitching,
      selectNetwork,
      selectedChainId,
      transactionGuard,
      walletChainId,
    ],
  );

  const connectionKey = `${selectedChainId}:${walletChainId ?? "disconnected"}:${address ?? "no-account"}`;

  return (
    <NetworkContext.Provider value={value}>
      <Fragment key={connectionKey}>{children}</Fragment>
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within NetworkProvider.");
  }
  return context;
}
