"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import {
  resolveWalletSessionStatus,
  type WalletSessionStatus,
} from "@/lib/privy/session";

export type { WalletSessionStatus } from "@/lib/privy/session";

export function useWalletSession() {
  const { address, chainId, isConnected } = useAccount();
  const { ready: privyReady, authenticated } = usePrivy();
  const { ready: walletsReady, wallets } = useWallets();
  const status: WalletSessionStatus = resolveWalletSessionStatus({
    privyReady,
    authenticated,
    walletsReady,
    walletAddresses: wallets.map((wallet) => wallet.address),
    activeAddress: address,
    isConnected,
  });

  return { address, chainId, isConnected, status };
}
